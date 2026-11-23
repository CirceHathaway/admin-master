import { useState, useEffect } from "react";
import { X } from "lucide-react";

const INITIAL = {
  nombre: "",
  asistencia: "si",
  adultos: 1,
  ninos: 0,
  mesa: "",
  dieta: "",
  comentarios: "",
};

export function GuestModal({ isOpen, guest, onClose, onSave }) {
  const [form, setForm] = useState(INITIAL);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (guest) {
      setForm({
        nombre: guest.nombre || "",
        asistencia: guest.asistencia || "si",
        adultos: guest.adultos ?? 1,
        ninos: guest.ninos ?? 0,
        mesa: guest.mesa || "",
        dieta: guest.dieta || "",
        comentarios: guest.comentarios || "",
      });
    } else {
      setForm(INITIAL);
    }
  }, [guest, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form, guest?.id || null);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">
            {guest ? "Editar invitado" : "Agregar invitado manualmente"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nombre completo / Familia
            </label>
            <input
              type="text"
              required
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Asistencia
              </label>
              <select
                value={form.asistencia}
                onChange={(e) => setForm({ ...form, asistencia: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
              >
                <option value="si">Confirma</option>
                <option value="no">No asiste</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Adultos
              </label>
              <input
                type="number"
                min="0"
                value={form.adultos}
                onChange={(e) => setForm({ ...form, adultos: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Niños
              </label>
              <input
                type="number"
                min="0"
                value={form.ninos}
                onChange={(e) => setForm({ ...form, ninos: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Mesa asignada
              </label>
              <input
                type="text"
                placeholder="Ej: Mesa 4"
                value={form.mesa}
                onChange={(e) => setForm({ ...form, mesa: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Restricción alimenticia
              </label>
              <input
                type="text"
                placeholder="Ej: Celíaco, Vegetariano..."
                value={form.dieta}
                onChange={(e) => setForm({ ...form, dieta: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Comentarios
            </label>
            <textarea
              rows={2}
              value={form.comentarios}
              onChange={(e) => setForm({ ...form, comentarios: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium disabled:opacity-60 cursor-pointer"
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}