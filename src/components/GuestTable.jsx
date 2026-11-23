import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Download,
  UserPlus,
  Check,
  Pencil,
  Trash2,
  Utensils,
  MessageSquare,
} from "lucide-react";
import { exportGuestsToExcel } from "../utils/exportExcel";

function MesaInput({ initialValue, onSave }) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const commit = () => {
    if (value.trim() !== (initialValue || "").trim()) {
      onSave(value.trim());
    }
  };

  return (
    <input
      type="text"
      value={value}
      placeholder="—"
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.currentTarget.blur();
        }
      }}
      className="w-20 px-2 py-1 text-xs rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
    />
  );
}

export function GuestTable({
  guests,
  eventName,
  onToggleCheckIn,
  onUpdateMesa,
  onEditGuest,
  onDeleteGuest,
  onNewGuest,
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("todos");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return guests.filter((g) => {
      if (filter === "confirmados" && g.asistencia !== "si") return false;
      if (filter === "ausentes" && g.asistencia !== "no") return false;
      if (filter === "dieta" && (!g.dieta || g.dieta.trim() === "")) return false;
      if (filter === "pendientes" && (g.asistencia !== "si" || g.checkIn)) return false;

      if (!q) return true;
      return (
        g.nombre.toLowerCase().includes(q) ||
        g.mesa.toLowerCase().includes(q) ||
        g.dieta.toLowerCase().includes(q) ||
        g.comentarios.toLowerCase().includes(q)
      );
    });
  }, [guests, search, filter]);

  const filterButtons = [
    { id: "todos", label: "Todos" },
    { id: "confirmados", label: "Confirmados" },
    { id: "ausentes", label: "No asisten" },
    { id: "dieta", label: "Con dieta" },
    { id: "pendientes", label: "Falta check-in" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Barra superior de acciones y búsqueda */}
      <div className="p-4 border-b border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, mesa, dieta o comentario..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onNewGuest}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Agregar</span>
            </button>
            <button
              onClick={() => exportGuestsToExcel(filtered, eventName)}
              disabled={filtered.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-sm font-medium transition disabled:opacity-40 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Excel</span>
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-1.5">
          {filterButtons.map((btn) => (
            <button
              key={btn.id}
              onClick={() => setFilter(btn.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                filter === btn.id
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla responsiva */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
              <th className="py-3 px-4">Invitado</th>
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4 text-center">Personas</th>
              <th className="py-3 px-4 text-center">Mesa</th>
              <th className="py-3 px-4">Dieta / Notas</th>
              <th className="py-3 px-4 text-center">Check-in</th>
              <th className="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  No hay invitados que coincidan con este filtro.
                </td>
              </tr>
            ) : (
              filtered.map((g) => (
                <tr key={g.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-medium text-slate-900">
                    {g.nombre}
                  </td>

                  <td className="py-3 px-4">
                    {g.asistencia === "si" ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        Confirmado
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                        No asiste
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <span className="font-semibold text-slate-800">{g.totalPersonas}</span>
                    <span className="block text-[11px] text-slate-400">
                      {g.adultos}A · {g.ninos}N
                    </span>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <MesaInput
                      initialValue={g.mesa}
                      onSave={(nuevaMesa) => onUpdateMesa(g.id, nuevaMesa)}
                    />
                  </td>

                  <td className="py-3 px-4 max-w-xs">
                    {g.dieta && (
                      <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-0.5 inline-flex items-center gap-1 mb-1">
                        <Utensils className="w-3 h-3 shrink-0" />
                        {g.dieta}
                      </p>
                    )}
                    {g.comentarios && (
                      <p className="text-xs text-slate-500 flex items-start gap-1">
                        <MessageSquare className="w-3 h-3 shrink-0 mt-0.5 text-slate-400" />
                        <span>{g.comentarios}</span>
                      </p>
                    )}
                    {!g.dieta && !g.comentarios && (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-center">
                    {g.asistencia === "si" ? (
                      <button
                        onClick={() => onToggleCheckIn(g)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                          g.checkIn
                            ? "bg-sky-600 text-white hover:bg-sky-700"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        {g.checkIn ? g.checkInHora || "Ingresó" : "Marcar"}
                      </button>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => onEditGuest(g)}
                      title="Editar"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`¿Eliminar a "${g.nombre}" de la lista?`)) {
                          onDeleteGuest(g.id);
                        }
                      }}
                      title="Eliminar"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}