import * as XLSX from "xlsx";

export function exportGuestsToExcel(guests, eventName = "Invitados") {
  const rows = guests.map((g) => ({
    Nombre: g.nombre,
    Asistencia: g.asistencia === "si" ? "Confirmado" : "No asiste",
    Adultos: g.adultos,
    Niños: g.ninos,
    "Total Personas": g.totalPersonas,
    Mesa: g.mesa || "-",
    "Restricción Alimenticia": g.dieta || "-",
    Comentarios: g.comentarios || "-",
    "Check-in": g.checkIn ? `Ingresó (${g.checkInHora || ""})` : "Pendiente",
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Invitados");

  const safeName = eventName.replace(/[^a-zA-Z0-9_-]/g, "_");
  const fecha = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `${safeName}_${fecha}.xlsx`);
}