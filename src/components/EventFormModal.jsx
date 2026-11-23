import { useState, useEffect } from "react";
import { X, Wand2, UserCheck, Plus } from "lucide-react";

const EMPTY_FORM = {
  nombre: "",
  fecha: "",
  coleccion: "invitados_tiziana",
  colorAcento: "#6366f1",
  tutoresEmails: [],
  firebaseConfig: {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
  },
  campos: {
    nombre: "nombre",
    asistencia: "asistencia",
    adultos: "adultos",
    ninos: "niños",
    dieta: "dieta",
    comentarios: "comentarios",
  },
};

export function EventFormModal({ isOpen, initialData, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [tutorInput, setTutorInput] = useState("");
  const [rawSnippet, setRawSnippet] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialData) {
      setForm({
        nombre: initialData.nombre || "",
        fecha: initialData.fecha || "",
        coleccion: initialData.coleccion || "",
        colorAcento: initialData.colorAcento || "#6366f1",
        tutoresEmails: Array.isArray(initialData.tutoresEmails) ? initialData.tutoresEmails : [],
        firebaseConfig: { ...EMPTY_FORM.firebaseConfig, ...initialData.firebaseConfig },
        campos: { ...EMPTY_FORM.campos, ...initialData.campos },
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setTutorInput("");
    setRawSnippet("");
    setError("");
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const addTutorEmail = () => {
    const clean = tutorInput.trim().toLowerCase();
    if (!clean || !clean.includes("@")) return;
    if (!form.tutoresEmails.includes(clean)) {
      setForm((prev) => ({ ...prev, tutoresEmails: [...prev.tutoresEmails, clean] }));
    }
    setTutorInput("");
  };

  const removeTutorEmail = (email) => {
    setForm((prev) => ({
      ...prev,
      tutoresEmails: prev.tutoresEmails.filter((e) => e !== email),
    }));
  };

  const parseSnippet = () => {
    const keys = ["apiKey", "authDomain", "projectId", "storageBucket", "messagingSenderId", "appId"];
    const extracted = { ...form.firebaseConfig };
    let found = 0;

    keys.forEach((key) => {
      const regex = new RegExp(`${key}\\s*:\\s*["'\`]([^"'\`]+)["'\`]`);
      const match = rawSnippet.match(regex);
      if (match) {
        extracted[key] = match[1].trim();
        found++;
      }
    });

    if (found === 0) {
      setError("No se encontraron credenciales válidas en el texto pegado.");
      return;
    }

    setError("");
    setForm((prev) => ({ ...prev, firebaseConfig: extracted }));
    setRawSnippet("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      // Si el usuario escribió un correo pero no apretó "+", lo incluimos igual
      const finalTutores = [...form.tutoresEmails];
      const pending = tutorInput.trim().toLowerCase();
      if (pending && pending.includes("@") && !finalTutores.includes(pending)) {
        finalTutores.push(pending);
      }

      await onSave({ ...form, tutoresEmails: finalTutores }, initialData?.id || null);
      onClose();
    } catch (err) {
      setError(err.message || "Error al guardar la invitación.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 my-8 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            {initialData ? "Editar Invitación" : "Conectar Nueva Invitación"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nombre del evento
              </label>
              <input
                type="text"
                required
                placeholder="Ej: XV Años de Tiziana"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Fecha del evento
              </label>
              <input
                type="date"
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Colección en Firestore
              </label>
              <input
                type="text"
                required
                placeholder="Ej: invitados_tiziana"
                value={form.coleccion}
                onChange={(e) => setForm({ ...form, coleccion: e.target.value.trim() })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-slate-700">Color distintivo:</label>
              <input
                type="color"
                value={form.colorAcento}
                onChange={(e) => setForm({ ...form, colorAcento: e.target.value })}
                className="w-10 h-8 rounded cursor-pointer border border-slate-300"
              />
            </div>
          </div>

          {/* Correos de Tutores Legales */}
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-semibold text-indigo-950">
                Acceso para Tutores Legales / Familia
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Agregá el correo del padre, madre o tutor. Cuando inicie sesión en esta página con ese correo, entrará directo al portal visual simplificado de este evento.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                value={tutorInput}
                onChange={(e) => setTutorInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTutorEmail();
                  }
                }}
                placeholder="Ej: mama.tiziana@gmail.com"
                className="flex-1 px-3 py-2 rounded-lg border border-indigo-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={addTutorEmail}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Autorizar
              </button>
            </div>

            {form.tutoresEmails.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.tutoresEmails.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-indigo-200 text-xs text-indigo-900 font-medium"
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => removeTutorEmail(email)}
                      className="text-slate-400 hover:text-red-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Pegado rápido de firebaseConfig */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Pegado rápido de firebaseConfig
              </span>
              <button
                type="button"
                onClick={parseSnippet}
                disabled={!rawSnippet.trim()}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 cursor-pointer"
              >
                <Wand2 className="w-3.5 h-3.5" />
                Autocompletar campos
              </button>
            </div>
            <textarea
              rows={3}
              value={rawSnippet}
              onChange={(e) => setRawSnippet(e.target.value)}
              placeholder="Pegá acá el bloque const firebaseConfig = { ... } y apretá Autocompletar."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.keys(EMPTY_FORM.firebaseConfig).map((key) => (
              <div key={key}>
                <label className="block text-xs font-medium text-slate-600 mb-1 font-mono">
                  {key}
                </label>
                <input
                  type="text"
                  required
                  value={form.firebaseConfig[key]}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      firebaseConfig: { ...form.firebaseConfig, [key]: e.target.value.trim() },
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            ))}
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs font-medium text-indigo-600 hover:underline cursor-pointer"
            >
              {showAdvanced
                ? "Ocultar mapeo de campos de Firestore"
                : "Personalizar nombres de campos en Firestore (opcional)"}
            </button>

            {showAdvanced && (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                {Object.keys(EMPTY_FORM.campos).map((fieldKey) => (
                  <div key={fieldKey}>
                    <label className="block text-xs text-slate-600 mb-1">
                      Campo "{fieldKey}"
                    </label>
                    <input
                      type="text"
                      value={form.campos[fieldKey]}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          campos: { ...form.campos, [fieldKey]: e.target.value.trim() },
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-xs font-mono"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

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
              {saving ? "Guardando..." : "Guardar Invitación"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}