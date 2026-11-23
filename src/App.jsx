import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { masterAuth } from "./firebase/master";
import { useEvents } from "./hooks/useEvents";
import { MasterLogin } from "./components/MasterLogin";
import { Sidebar } from "./components/Sidebar";
import { EventWorkspace } from "./components/EventWorkspace";
import { EventFormModal } from "./components/EventFormModal";
import { TutorPortal } from "./components/TutorPortal";
import { Menu, Sparkles, Plus, LogOut } from "lucide-react";

const ADMIN_EMAIL = (import.meta.env.VITE_MASTER_ADMIN_EMAIL || "").trim().toLowerCase();

export default function App() {
  const [masterUser, setMasterUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [sessionCredentials, setSessionCredentials] = useState(null);

  const isMasterAdmin = Boolean(
    masterUser?.email && ADMIN_EMAIL && masterUser.email.toLowerCase() === ADMIN_EMAIL
  );

  const { events, loading, addEvent, updateEvent, deleteEvent } = useEvents(
    masterUser,
    isMasterAdmin
  );

  const [activeEventId, setActiveEventId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [previewTutorMode, setPreviewTutorMode] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(masterAuth, (user) => {
      setMasterUser(user);
      setAuthReady(true);
      if (!user) {
        setSessionCredentials(null);
        setPreviewTutorMode(false);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!activeEventId && events.length > 0) {
      setActiveEventId(events[0].id);
    } else if (activeEventId && !events.some((e) => e.id === activeEventId)) {
      setActiveEventId(events[0]?.id || null);
    }
  }, [events, activeEventId]);

  const handleLogout = async () => {
    setSessionCredentials(null);
    setPreviewTutorMode(false);
    await signOut(masterAuth);
  };

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">
        Iniciando panel...
      </div>
    );
  }

  if (!masterUser) {
    return <MasterLogin onLoginSuccess={setSessionCredentials} />;
  }

  const activeEvent = events.find((e) => e.id === activeEventId) || null;

  // 1) MODO TUTOR LEGAL (o Admin Master previsualizando la vista de Tutor)
  if (!isMasterAdmin || previewTutorMode) {
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">
          Cargando evento...
        </div>
      );
    }

    if (!activeEvent) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Todavía no tenés un evento asignado</h2>
            <p className="text-sm text-slate-500">
              Tu correo <strong>{masterUser.email}</strong> aún no fue vinculado a ninguna invitación. Pedile al administrador que te habilite el acceso.
            </p>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </button>
          </div>
        </div>
      );
    }

    return (
      <TutorPortal
        key={activeEvent.id}
        activeEvent={activeEvent}
        sessionCredentials={sessionCredentials}
        tutorEmail={masterUser.email}
        onLogout={handleLogout}
        onBackToAdmin={isMasterAdmin ? () => setPreviewTutorMode(false) : null}
      />
    );
  }

  // 2) MODO ADMIN MASTER (tu panel completo)
  const handleSaveEvent = async (eventData, eventId) => {
    if (eventId) {
      await updateEvent(eventId, eventData);
    } else {
      const newId = await addEvent(eventData);
      setActiveEventId(newId);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar
        events={events}
        activeEventId={activeEventId}
        onSelectEvent={setActiveEventId}
        onNewEvent={() => {
          setEditingEvent(null);
          setEventModalOpen(true);
        }}
        onEditEvent={(ev) => {
          setEditingEvent(ev);
          setEventModalOpen(true);
        }}
        onDeleteEvent={deleteEvent}
        onLogout={handleLogout}
        masterEmail={masterUser.email}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold text-slate-900 text-sm truncate">
            {activeEvent ? activeEvent.nombre : "Panel de Invitaciones"}
          </span>
          <div className="w-9" />
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {loading ? (
            <p className="text-sm text-slate-500">Cargando tus invitaciones...</p>
          ) : activeEvent ? (
            <EventWorkspace
              key={activeEvent.id}
              activeEvent={activeEvent}
              onOpenTutorView={() => setPreviewTutorMode(true)}
              onEditEvent={(ev) => {
                setEditingEvent(ev);
                setEventModalOpen(true);
              }}
            />
          ) : (
            <div className="max-w-md mx-auto mt-16 text-center bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Bienvenido a tu panel</h2>
              <p className="text-sm text-slate-500">
                Conectá el Firebase de <strong>XV Años de Tiziana</strong> (o cualquier otra invitación) para administrar sus invitados en tiempo real.
              </p>
              <button
                onClick={() => {
                  setEditingEvent(null);
                  setEventModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Agregar primera invitación
              </button>
            </div>
          )}
        </main>
      </div>

      <EventFormModal
        isOpen={eventModalOpen}
        initialData={editingEvent}
        onClose={() => setEventModalOpen(false)}
        onSave={handleSaveEvent}
      />
    </div>
  );
}