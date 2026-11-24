import { useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getEventFirebase } from "../firebase/eventManager";
import { useGuests } from "../hooks/useGuests";
import { StatsCards } from "./StatsCards";
import { GuestTable } from "./GuestTable";
import { GuestModal } from "./GuestModal";
import { Lock, LogOut, Settings, AlertCircle, Eye, EyeOff } from "lucide-react";

export function EventWorkspace({ activeEvent, onEditEvent, onOpenTutorView }) {
  const [eventUser, setEventUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [initError, setInitError] = useState(null);

  // Estado del login del Firebase hijo
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  // Modal de invitado
  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState(null);

  useEffect(() => {
    setAuthLoading(true);
    setInitError(null);

    try {
      const { auth } = getEventFirebase(activeEvent);
      const unsub = onAuthStateChanged(auth, (user) => {
        setEventUser(user);
        setAuthLoading(false);
      });
      return () => unsub();
    } catch (err) {
      setInitError(err.message);
      setAuthLoading(false);
    }
  }, [activeEvent]);

  const {
    guests,
    stats,
    loading: guestsLoading,
    error: guestsError,
    toggleCheckIn,
    updateMesa,
    saveGuest,
    deleteGuest,
  } = useGuests(activeEvent, eventUser);

  const handleChildLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoggingIn(true);
    try {
      const { auth } = getEventFirebase(activeEvent);
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch {
      setLoginError("Credenciales inválidas para este proyecto de Firebase.");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleChildLogout = async () => {
    const { auth } = getEventFirebase(activeEvent);
    await signOut(auth);
  };

  if (initError) {
    return (
      <div className="max-w-lg mx-auto mt-12 bg-white p-6 rounded-2xl border border-red-200 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
        <h3 className="font-bold text-slate-900">Error de configuración de Firebase</h3>
        <p className="text-sm text-slate-600">{initError}</p>
        <button
          onClick={() => onEditEvent(activeEvent)}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium cursor-pointer"
        >
          Revisar credenciales
        </button>
      </div>
    );
  }

  if (authLoading) {
    return <p className="text-sm text-slate-500 p-8">Conectando con {activeEvent.nombre}...</p>;
  }

  // Si todavía no iniciaste sesión en el Firebase de esta cumpleañera
  if (!eventUser) {
    return (
      <div className="max-w-md mx-auto mt-10 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
            style={{ backgroundColor: activeEvent.colorAcento || "#6366f1" }}
          >
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">{activeEvent.nombre}</h2>
            <p className="text-xs text-slate-500">
              Iniciá sesión en el Firebase de esta invitación (solo la primera vez)
            </p>
          </div>
        </div>

        <form onSubmit={handleChildLogin} className="space-y-3">
          <input
            type="email"
            required
            placeholder="Correo de admin en este Firebase"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-3 pr-10 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {loginError && <p className="text-xs text-red-600">{loginError}</p>}

          <button
            type="submit"
            disabled={loggingIn}
            className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium cursor-pointer disabled:opacity-50"
          >
            {loggingIn ? "Conectando..." : "Desbloquear invitados"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado del evento activo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="w-3.5 h-10 rounded-full shrink-0"
            style={{ backgroundColor: activeEvent.colorAcento || "#6366f1" }}
          />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{activeEvent.nombre}</h1>
            <p className="text-xs text-slate-500 font-mono">
              {activeEvent.firebaseConfig?.projectId} · /{activeEvent.coleccion}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onEditEvent(activeEvent)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            Configuración
          </button>
          <button
            onClick={handleChildLogout}
            title="Cerrar sesión en este Firebase hijo"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Bloquear
          </button>
          <button
            onClick={onOpenTutorView}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            Vista Tutor
          </button>
        </div>
      </div>

      {guestsError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          <strong>Error al leer Firestore:</strong> {guestsError}. Verificá las reglas de seguridad de la colección{" "}
          <code>{activeEvent.coleccion}</code>.
        </div>
      )}

      <StatsCards stats={stats} />

      {guestsLoading ? (
        <p className="text-sm text-slate-500">Cargando invitados...</p>
      ) : (
        <GuestTable
          guests={guests}
          eventName={activeEvent.nombre}
          onToggleCheckIn={toggleCheckIn}
          onUpdateMesa={updateMesa}
          onNewGuest={() => {
            setEditingGuest(null);
            setGuestModalOpen(true);
          }}
          onEditGuest={(g) => {
            setEditingGuest(g);
            setGuestModalOpen(true);
          }}
          onDeleteGuest={deleteGuest}
        />
      )}

      <GuestModal
        isOpen={guestModalOpen}
        guest={editingGuest}
        onClose={() => setGuestModalOpen(false)}
        onSave={saveGuest}
      />
    </div>
  );
}