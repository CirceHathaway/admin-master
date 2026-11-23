import { Plus, Pencil, Trash2, LogOut, Calendar, X, Sparkles } from "lucide-react";

export function Sidebar({
  events,
  activeEventId,
  onSelectEvent,
  onNewEvent,
  onEditEvent,
  onDeleteEvent,
  onLogout,
  masterEmail,
  isOpen,
  onClose,
}) {
  return (
    <>
      {/* Fondo oscuro en móvil cuando el menú está abierto */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 z-30 lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-200 flex flex-col transform transition-transform duration-200 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-900">Mis Eventos</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3">
          <button
            onClick={() => {
              onNewEvent();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nueva Invitación
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
          {events.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8 px-2">
              Todavía no cargaste ninguna invitación. Usá el botón de arriba para sumar la primera.
            </p>
          ) : (
            events.map((ev) => {
              const isActive = ev.id === activeEventId;
              return (
                <div
                  key={ev.id}
                  className={`group flex items-center justify-between rounded-xl px-3 py-2.5 transition cursor-pointer ${
                    isActive
                      ? "bg-indigo-50 text-indigo-950 font-semibold"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                  onClick={() => {
                    onSelectEvent(ev.id);
                    onClose();
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 border border-black/10"
                      style={{ backgroundColor: ev.colorAcento || "#6366f1" }}
                    />
                    <div className="truncate">
                      <p className="text-sm truncate">{ev.nombre}</p>
                      {ev.fecha && (
                        <p className="text-xs text-slate-400 font-normal flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {ev.fecha}
                        </p>
                      )}
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      title="Editar configuración"
                      onClick={() => onEditEvent(ev)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-white cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      title="Quitar del panel"
                      onClick={() => {
                        if (window.confirm(`¿Quitar "${ev.nombre}" del panel? (No borra los datos en su Firebase)`)) {
                          onDeleteEvent(ev.id);
                        }
                      }}
                      className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-white cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </nav>

        <div className="p-3 border-t border-slate-200 bg-slate-50">
          <p className="text-xs text-slate-500 truncate px-2 mb-2">{masterEmail}</p>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Cerrar sesión principal
          </button>
        </div>
      </aside>
    </>
  );
}