import { Users, CheckCircle2, XCircle, Utensils, UserCheck } from "lucide-react";

export function StatsCards({ stats }) {
  const cards = [
    {
      label: "Personas confirmadas",
      value: stats.totalPersonas,
      sub: `${stats.totalAdultos} adultos · ${stats.totalNinos} niños`,
      icon: Users,
      color: "text-indigo-600 bg-indigo-50",
    },
    {
      label: "Grupos confirmados",
      value: stats.gruposConfirmados,
      sub: `de ${stats.totalRegistros} respuestas`,
      icon: CheckCircle2,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "No asisten",
      value: stats.gruposAusentes,
      sub: "respuestas negativas",
      icon: XCircle,
      color: "text-rose-600 bg-rose-50",
    },
    {
      label: "Menú / Dieta",
      value: stats.conDieta,
      sub: "con restricciones",
      icon: Utensils,
      color: "text-amber-600 bg-amber-50",
    },
    {
      label: "Check-in en salón",
      value: `${stats.ingresados}/${stats.totalPersonas}`,
      sub: "personas ingresadas",
      icon: UserCheck,
      color: "text-sky-600 bg-sky-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500">{card.label}</span>
              <span className={`p-1.5 rounded-lg ${card.color}`}>
                <Icon className="w-4 h-4" />
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{card.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{card.sub}</p>
          </div>
        );
      })}
    </div>
  );
}