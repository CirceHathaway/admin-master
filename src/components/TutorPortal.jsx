import { useEffect, useState, useMemo } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import { getEventFirebase } from "../firebase/eventManager";
import { useGuests } from "../hooks/useGuests";
import { GuestModal } from "./GuestModal";
import { exportGuestsToExcel } from "../utils/exportExcel";
import {
  Calendar,
  Users,
  Utensils,
  MessageSquare,
  Search,
  UserPlus,
  Download,
  CheckCircle2,
  LayoutGrid,
  Armchair,
  Pencil,
  Trash2,
  LogOut,
  ArrowLeft,
  Lock,
  Sparkles,
  Check,
  Crown,
  AlertTriangle,
  X,
  Eye,
  EyeOff,
} from "lucide-react";

function getInitials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function getDaysRemaining(fechaStr) {
  if (!fechaStr) return null;
  const target = new Date(`${fechaStr}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

function normalizeMesaValue(raw) {
  const clean = String(raw || "").trim();
  if (!clean) return "";
  if (/^(p|principal|mesa\s*p|mesa\s*principal)$/i.test(clean)) return "P";
  const mesaNumMatch = clean.match(/^mesa\s+(\d+)$/i);
  if (mesaNumMatch) return mesaNumMatch[1];
  return clean;
}

function formatMesaTitle(mesaKey) {
  if (mesaKey === "P") return "Mesa Principal";
  if (/^\d+$/.test(mesaKey)) return `Mesa ${mesaKey}`;
  return mesaKey;
}

function QuickMesaField({ value, onSave }) {
  const normalizedProp = normalizeMesaValue(value);
  const [text, setText] = useState(normalizedProp);

  useEffect(() => {
    setText(normalizeMesaValue(value));
  }, [value]);

  const commit = () => {
    const next = normalizeMesaValue(text);
    setText(next);
    if (next !== normalizedProp) {
      onSave(next);
    }
  };

  const togglePrincipal = () => {
    const next = normalizedProp === "P" ? "" : "P";
    setText(next);
    onSave(next);
  };

  const isPrincipal = normalizedProp === "P";

  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 border transition ${
          isPrincipal
            ? "bg-amber-500/20 border-amber-400/60"
            : "bg-slate-800 border-slate-700 focus-within:border-indigo-400"
        }`}
      >
        {isPrincipal ? (
          <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        ) : (
          <Armchair className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        )}
        <input
          type="text"
          value={text}
          placeholder="N° o P"
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          className={`w-16 bg-transparent text-xs font-semibold placeholder:text-slate-400 focus:outline-none ${
            isPrincipal ? "text-amber-200" : "text-slate-100"
          }`}
        />
      </div>

      <button
        type="button"
        onClick={togglePrincipal}
        title={isPrincipal ? "Quitar de Mesa Principal" : "Asignar a Mesa Principal (P)"}
        className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
          isPrincipal
            ? "bg-amber-400 text-slate-950 border-amber-300"
            : "bg-slate-800 text-slate-300 border-slate-700 hover:border-amber-400 hover:text-amber-300"
        }`}
      >
        P
      </button>
    </div>
  );
}

export function TutorPortal({
  activeEvent,
  sessionCredentials,
  tutorEmail,
  onLogout,
  onBackToAdmin,
}) {
  const [eventUser, setEventUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [autoLoginTried, setAutoLoginTried] = useState(false);

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [unlockError, setUnlockError] = useState("");
  const [unlocking, setUnlocking] = useState(false);

  const [viewMode, setViewMode] = useState("cards");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState(null);

  // Modal de confirmación de borrado
  const [guestToDelete, setGuestToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setAuthLoading(true);
    setAutoLoginTried(false);
    const { auth } = getEventFirebase(activeEvent);
    const unsub = onAuthStateChanged(auth, (user) => {
      setEventUser(user);
      setAuthLoading(false);
    });
    return () => unsub();
  }, [activeEvent]);

  useEffect(() => {
    if (
      !authLoading &&
      !eventUser &&
      !autoLoginTried &&
      sessionCredentials?.email &&
      sessionCredentials?.password
    ) {
      setAutoLoginTried(true);
      const { auth } = getEventFirebase(activeEvent);
      signInWithEmailAndPassword(auth, sessionCredentials.email, sessionCredentials.password).catch(
        () => {}
      );
    }
  }, [authLoading, eventUser, autoLoginTried, sessionCredentials, activeEvent]);

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

  const handleManualUnlock = async (e) => {
    e.preventDefault();
    setUnlockError("");
    setUnlocking(true);
    try {
      const { auth } = getEventFirebase(activeEvent);
      await signInWithEmailAndPassword(auth, tutorEmail, password);
    } catch {
      setUnlockError("La contraseña no coincide. Pedile ayuda al organizador.");
    } finally {
      setUnlocking(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!guestToDelete) return;
    setDeleting(true);
    try {
      await deleteGuest(guestToDelete.id);
      setGuestToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveGuestNormalized = async (guestData, guestId) => {
    await saveGuest(
      { ...guestData, mesa: normalizeMesaValue(guestData.mesa) },
      guestId
    );
  };

  const filteredGuests = useMemo(() => {
    const q = search.trim().toLowerCase();
    return guests.filter((g) => {
      const mesaNorm = normalizeMesaValue(g.mesa);
      if (filter === "confirmados" && g.asistencia !== "si") return false;
      if (filter === "ausentes" && g.asistencia !== "no") return false;
      if (filter === "dieta" && (!g.dieta || g.dieta.trim() === "")) return false;
      if (filter === "sin_mesa" && (g.asistencia !== "si" || mesaNorm !== "")) {
        return false;
      }
      if (filter === "pendientes" && (g.asistencia !== "si" || g.checkIn)) return false;

      if (!q) return true;
      const mesaTitle = mesaNorm ? formatMesaTitle(mesaNorm).toLowerCase() : "";
      return (
        g.nombre.toLowerCase().includes(q) ||
        mesaNorm.toLowerCase().includes(q) ||
        mesaTitle.includes(q) ||
        g.dieta.toLowerCase().includes(q) ||
        g.comentarios.toLowerCase().includes(q)
      );
    });
  }, [guests, search, filter]);

  // Separa mesas asignadas (con "P" primero) de los grupos aún sin mesa
  const { assignedTables, unassignedGuests } = useMemo(() => {
    const map = new Map();
    const unassigned = [];
    const confirmados = filteredGuests.filter((g) => g.asistencia === "si");

    confirmados.forEach((g) => {
      const mesaKey = normalizeMesaValue(g.mesa);
      if (!mesaKey) {
        unassigned.push(g);
      } else {
        if (!map.has(mesaKey)) map.set(mesaKey, []);
        map.get(mesaKey).push(g);
      }
    });

    const sortedTables = Array.from(map.entries()).sort(([a], [b]) => {
      if (a === "P") return -1;
      if (b === "P") return 1;
      return a.localeCompare(b, "es", { numeric: true });
    });

    return { assignedTables: sortedTables, unassignedGuests: unassigned };
  }, [filteredGuests]);

  const accent = activeEvent.colorAcento || "#6366f1";
  const daysLeft = getDaysRemaining(activeEvent.fecha);
  const checkInPct =
    stats.totalPersonas > 0 ? Math.round((stats.ingresados / stats.totalPersonas) * 100) : 0;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-sm text-slate-500">
        Preparando tu lista de invitados...
      </div>
    );
  }

  if (!eventUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-lg border-2 border-slate-400 p-7 space-y-5">
          <div className="text-center space-y-2">
            <div
              className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center text-white shadow-sm"
              style={{ backgroundColor: accent }}
            >
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">{activeEvent.nombre}</h2>
            <p className="text-sm text-slate-500">
              Confirmá tu contraseña para acceder a los invitados de la fiesta.
            </p>
          </div>

          <form onSubmit={handleManualUnlock} className="space-y-3">
            <input
              type="email"
              disabled
              value={tutorEmail}
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 bg-slate-50 text-slate-500 text-sm"
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border-2 border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {unlockError && <p className="text-xs text-red-600">{unlockError}</p>}

            <button
              type="submit"
              disabled={unlocking}
              className="w-full py-2.5 rounded-xl text-white font-semibold text-sm cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: accent }}
            >
              {unlocking ? "Abriendo lista..." : "Ver mis invitados"}
            </button>
          </form>

          <div className="flex justify-center gap-4 pt-2">
            {onBackToAdmin && (
              <button
                onClick={onBackToAdmin}
                className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Volver al panel Admin
              </button>
            )}
            <button
              onClick={onLogout}
              className="text-xs text-slate-500 hover:text-red-600 cursor-pointer"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filterChips = [
    { id: "todos", label: `Todos (${stats.totalRegistros})` },
    { id: "confirmados", label: `Confirmados (${stats.gruposConfirmados})` },
    { id: "ausentes", label: `No asisten (${stats.gruposAusentes})` },
    { id: "dieta", label: `Menú especial (${stats.conDieta})` },
    { id: "sin_mesa", label: `Sin mesa (${stats.sinMesa})` },
    { id: "pendientes", label: "Falta ingresar" },
  ];

  const totalSinMesaPersonas = unassignedGuests.reduce((acc, g) => acc + g.totalPersonas, 0);

  return (
    <div className="min-h-screen bg-slate-100 pb-12">
      {/* Banner superior */}
      <header
        className="text-white relative overflow-hidden border-b-2 border-slate-400/40"
        style={{
          background: `linear-gradient(135deg, ${accent} 0%, #1e293b 100%)`,
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-10 sm:pt-8 sm:pb-12">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-xs border border-white/30 px-3 py-1 rounded-full text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              Portal Familiar de Invitados
            </div>

            <div className="flex items-center gap-2">
              {onBackToAdmin && (
                <button
                  onClick={onBackToAdmin}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs font-medium transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Volver a Vista Admin
                </button>
              )}
              <button
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs font-medium transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Salir
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {activeEvent.nombre}
              </h1>
              {activeEvent.fecha && (
                <p className="text-white/85 text-sm mt-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Fecha: {activeEvent.fecha}
                  {daysLeft !== null && daysLeft > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-white/20 border border-white/30 text-xs font-semibold">
                      Faltan {daysLeft} días
                    </span>
                  )}
                  {daysLeft === 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-xs font-bold">
                      ¡Es hoy!
                    </span>
                  )}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setEditingGuest(null);
                  setModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 border-2 border-slate-300 text-sm font-semibold shadow-sm transition cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                Agregar invitado
              </button>
              <button
                onClick={() => exportGuestsToExcel(filteredGuests, activeEvent.nombre)}
                disabled={filteredGuests.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-white text-sm font-medium backdrop-blur-xs transition disabled:opacity-40 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Descargar Excel
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 -mt-6 space-y-6">
        {guestsError && (
          <div className="p-4 rounded-2xl bg-red-50 border-2 border-red-400 text-sm text-red-700">
            No se pudo cargar la lista de invitados. Avisale al organizador ({guestsError}).
          </div>
        )}

        {/* Resumen visual (bordes remarcados) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border-2 border-slate-400/80 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Total Confirmados
              </span>
              <Users className="w-5 h-5 text-indigo-500" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900 mt-2">{stats.totalPersonas}</p>
            <div className="flex items-center gap-2 mt-2 text-xs font-medium">
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700">
                {stats.totalAdultos} adultos
              </span>
              <span className="px-2 py-0.5 rounded-md bg-fuchsia-50 border border-fuchsia-200 text-fuchsia-700">
                {stats.totalNinos} niños
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border-2 border-slate-400/80 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Respuestas
              </span>
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900 mt-2">{stats.gruposConfirmados}</p>
            <p className="text-xs text-slate-500 mt-2">
              confirmaron ·{" "}
              <span className="text-rose-600 font-medium">{stats.gruposAusentes} no asisten</span>
            </p>
          </div>

          <div className="bg-white rounded-2xl border-2 border-slate-400/80 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Menús Especiales
              </span>
              <Utensils className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900 mt-2">{stats.conDieta}</p>
            <p className="text-xs text-slate-500 mt-2">
              {stats.sinMesa > 0
                ? `${stats.sinMesa} grupos aún sin mesa`
                : "Todos tienen mesa asignada"}
            </p>
          </div>

          <div className="bg-white rounded-2xl border-2 border-slate-400/80 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Llegada al Salón
              </span>
              <span className="text-xs font-bold text-sky-600">{checkInPct}%</span>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 mt-2">
              {stats.ingresados}
              <span className="text-base font-medium text-slate-400"> / {stats.totalPersonas}</span>
            </p>
            <div className="w-full h-2.5 bg-slate-100 border border-slate-300 rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-sky-500 rounded-full transition-all duration-300"
                style={{ width: `${checkInPct}%` }}
              />
            </div>
          </div>
        </section>

        {/* Buscador, filtros y selector de vista (bordes remarcados) */}
        <section className="bg-white rounded-2xl border-2 border-slate-400/80 p-4 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row gap-3 justify-between">
            <div className="relative flex-1 max-w-lg">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar invitado, mesa (ej: P o 4), dieta o mensaje..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-slate-300 bg-slate-50 focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="inline-flex bg-slate-100 border-2 border-slate-300 p-1 rounded-xl self-start">
              <button
                onClick={() => setViewMode("cards")}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  viewMode === "cards"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                Tarjetas
              </button>
              <button
                onClick={() => setViewMode("mesas")}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  viewMode === "mesas"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Armchair className="w-4 h-4" />
                Por Mesas
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {filterChips.map((chip) => (
              <button
                key={chip.id}
                onClick={() => setFilter(chip.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition cursor-pointer ${
                  filter === chip.id
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </section>

        {/* Contenido principal */}
        {guestsLoading ? (
          <p className="text-center text-sm text-slate-500 py-12">Cargando invitados...</p>
        ) : filteredGuests.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-slate-400/80 p-12 text-center text-slate-500">
            No se encontraron invitados con ese criterio.
          </div>
        ) : viewMode === "cards" ? (
          /* VISTA EN TARJETAS OSCURAS (bordes sutiles sin remarcar) */
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGuests.map((g) => {
              const confirmed = g.asistencia === "si";
              return (
                <article
                  key={g.id}
                  className={`bg-slate-900 text-slate-100 rounded-2xl border p-5 shadow-md flex flex-col justify-between gap-4 transition ${
                    g.checkIn
                      ? "border-sky-400 ring-2 ring-sky-400/30"
                      : "border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="space-y-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-11 h-11 rounded-2xl shrink-0 flex items-center justify-center font-bold text-sm border ${
                            confirmed
                              ? "bg-indigo-500/20 text-indigo-300 border-indigo-400/30"
                              : "bg-rose-500/20 text-rose-300 border-rose-400/30"
                          }`}
                        >
                          {getInitials(g.nombre)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-white leading-snug break-words">
                            {g.nombre}
                          </h3>
                          <span
                            className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                              confirmed
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                            }`}
                          >
                            {confirmed ? "Asiste" : "No asiste"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => {
                            setEditingGuest(g);
                            setModalOpen(true);
                          }}
                          title="Editar datos"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800 cursor-pointer transition"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setGuestToDelete(g)}
                          title="Eliminar"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 cursor-pointer transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-slate-800" />

                    {confirmed && (
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 font-bold">
                            {g.totalPersonas} {g.totalPersonas === 1 ? "persona" : "personas"}
                          </span>
                          <span className="text-slate-400">
                            ({g.adultos}A · {g.ninos}N)
                          </span>
                        </div>

                        <QuickMesaField
                          value={g.mesa}
                          onSave={(nuevaMesa) => updateMesa(g.id, nuevaMesa)}
                        />
                      </div>
                    )}

                    {g.dieta && (
                      <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs">
                        <Utensils className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                        <div>
                          <span className="font-semibold text-amber-300 block">
                            Menú / Restricción:
                          </span>
                          <span>{g.dieta}</span>
                        </div>
                      </div>
                    )}

                    {g.comentarios && (
                      <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 text-xs">
                        <MessageSquare className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
                        <p className="italic">"{g.comentarios}"</p>
                      </div>
                    )}
                  </div>

                  {confirmed && (
                    <button
                      onClick={() => toggleCheckIn(g)}
                      className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        g.checkIn
                          ? "bg-sky-500 text-white hover:bg-sky-400 shadow-sm"
                          : "bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700"
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      {g.checkIn
                        ? `Ingresó a las ${g.checkInHora || "--:--"}`
                        : "Marcar ingreso al salón"}
                    </button>
                  )}
                </article>
              );
            })}
          </section>
        ) : (
          /* VISTA ORGANIZADOR POR MESAS MEJORADA */
          <div className="space-y-6">
            {/* 1) Mesas ya asignadas */}
            {assignedTables.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 px-1">
                  Mesas armadas ({assignedTables.length})
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {assignedTables.map(([mesaKey, groupGuests]) => {
                    const totalEnMesa = groupGuests.reduce((acc, g) => acc + g.totalPersonas, 0);
                    const isPrincipal = mesaKey === "P";

                    return (
                      <div
                        key={mesaKey}
                        className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden flex flex-col ${
                          isPrincipal ? "border-amber-500" : "border-slate-400"
                        }`}
                      >
                        <div
                          className={`px-5 py-3.5 border-b-2 flex items-center justify-between ${
                            isPrincipal
                              ? "bg-amber-50 border-amber-300"
                              : "bg-slate-100 border-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {isPrincipal ? (
                              <Crown className="w-5 h-5 text-amber-500" />
                            ) : (
                              <Armchair className="w-4 h-4 text-slate-600" />
                            )}
                            <div>
                              <h3 className="font-bold text-slate-900 leading-tight">
                                {formatMesaTitle(mesaKey)}
                              </h3>
                              <p className="text-[11px] text-slate-500">
                                {groupGuests.length}{" "}
                                {groupGuests.length === 1 ? "grupo" : "grupos"}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`px-2.5 py-1 rounded-full border text-xs font-bold ${
                              isPrincipal
                                ? "bg-amber-400 text-slate-950 border-amber-500"
                                : "bg-white text-slate-800 border-slate-300"
                            }`}
                          >
                            {totalEnMesa} {totalEnMesa === 1 ? "pers." : "pers."}
                          </span>
                        </div>

                        {/* Cada grupo separado visualmente en su propia tarjeta oscura */}
                        <div className="p-3 space-y-2.5 bg-slate-50/70 flex-1">
                          {groupGuests.map((g) => (
                            <div
                              key={g.id}
                              className="bg-slate-900 text-slate-100 rounded-xl border border-slate-800 p-3 space-y-2.5 shadow-xs"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-white leading-snug break-words">
                                    {g.nombre}
                                  </p>
                                  <p className="text-xs text-slate-400 mt-0.5">
                                    <span className="text-slate-200 font-semibold">
                                      {g.totalPersonas}{" "}
                                      {g.totalPersonas === 1 ? "persona" : "personas"}
                                    </span>{" "}
                                    ({g.adultos}A · {g.ninos}N)
                                  </p>
                                </div>

                                <div className="flex items-center gap-0.5 shrink-0">
                                  <button
                                    onClick={() => {
                                      setEditingGuest(g);
                                      setModalOpen(true);
                                    }}
                                    title="Editar invitado"
                                    className="p-1 rounded-md text-slate-400 hover:text-indigo-300 hover:bg-slate-800 cursor-pointer"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setGuestToDelete(g)}
                                    title="Eliminar invitado"
                                    className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {g.dieta && (
                                <p className="text-[11px] text-amber-200 bg-amber-500/15 border border-amber-500/30 rounded-lg px-2 py-1 inline-flex items-center gap-1">
                                  <Utensils className="w-3 h-3 text-amber-400 shrink-0" />
                                  {g.dieta}
                                </p>
                              )}

                              <div className="pt-1 border-t border-slate-800 flex items-center justify-between gap-2">
                                <span className="text-[11px] text-slate-400">Mover a mesa:</span>
                                <QuickMesaField
                                  value={g.mesa}
                                  onSave={(nuevaMesa) => updateMesa(g.id, nuevaMesa)}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 2) Pendientes de asignar mesa: cada grupo separado individualmente */}
            {unassignedGuests.length > 0 && (
              <section className="bg-white rounded-2xl border-2 border-amber-400 p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b-2 border-amber-200">
                  <div>
                    <h2 className="font-bold text-slate-900 flex items-center gap-2">
                      <Armchair className="w-5 h-5 text-amber-500" />
                      Pendientes de asignar mesa
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Cada recuadro es un grupo independiente. Escribí un número de mesa o tocá{" "}
                      <strong className="text-slate-800">P</strong> para la Mesa Principal.
                    </p>
                  </div>
                  <span className="self-start sm:self-auto px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold">
                    {unassignedGuests.length}{" "}
                    {unassignedGuests.length === 1 ? "grupo" : "grupos"} · {totalSinMesaPersonas}{" "}
                    pers.
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {unassignedGuests.map((g) => (
                    <div
                      key={g.id}
                      className="bg-slate-900 text-slate-100 rounded-xl border border-slate-800 p-4 flex flex-col justify-between gap-3 shadow-sm"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-300 flex items-center justify-center font-bold text-xs shrink-0">
                              {getInitials(g.nombre)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-white leading-snug break-words">
                                {g.nombre}
                              </p>
                              <p className="text-xs text-slate-400">
                                <span className="text-slate-200 font-semibold">
                                  {g.totalPersonas}{" "}
                                  {g.totalPersonas === 1 ? "persona" : "personas"}
                                </span>{" "}
                                ({g.adultos}A · {g.ninos}N)
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => setGuestToDelete(g)}
                            title="Eliminar invitado"
                            className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {g.dieta && (
                          <p className="text-[11px] text-amber-200 bg-amber-500/15 border border-amber-500/30 rounded-lg px-2 py-1 inline-flex items-center gap-1">
                            <Utensils className="w-3 h-3 text-amber-400 shrink-0" />
                            {g.dieta}
                          </p>
                        )}
                      </div>

                      <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between gap-2">
                        <span className="text-xs text-slate-400 font-medium">Asignar mesa:</span>
                        <QuickMesaField
                          value={g.mesa}
                          onSave={(nuevaMesa) => updateMesa(g.id, nuevaMesa)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {assignedTables.length === 0 && unassignedGuests.length === 0 && (
              <div className="bg-white rounded-2xl border-2 border-slate-400/80 p-12 text-center text-slate-500">
                No hay invitados confirmados para organizar en mesas con este filtro.
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal de creación / edición */}
      <GuestModal
        isOpen={modalOpen}
        guest={editingGuest}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveGuestNormalized}
      />

      {/* Modal de confirmación para eliminar invitado */}
      {guestToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border-2 border-slate-400 shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b-2 border-slate-200 flex items-center justify-between bg-rose-50/70">
              <div className="flex items-center gap-2.5 text-rose-700">
                <div className="w-9 h-9 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900">Eliminar invitado</h3>
              </div>
              <button
                type="button"
                onClick={() => !deleting && setGuestToDelete(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-white hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-2">
              <p className="text-sm text-slate-700">
                ¿Seguro que querés eliminar de la lista a{" "}
                <strong className="text-slate-900">{guestToDelete.nombre}</strong>?
              </p>
              <p className="text-xs text-slate-500">
                Esta acción borra el registro de la base de datos y no se puede deshacer.
              </p>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t-2 border-slate-200 flex justify-end gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setGuestToDelete(null)}
                className="px-4 py-2 rounded-xl border-2 border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-sm font-semibold cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold cursor-pointer disabled:opacity-50"
              >
                {deleting ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}