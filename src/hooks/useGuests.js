import { useEffect, useState, useMemo } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { getEventFirebase } from "../firebase/eventManager";

function parseAsistencia(val) {
  if (typeof val === "boolean") return val ? "si" : "no";
  const str = String(val ?? "").trim().toLowerCase();
  if (["si", "sí", "true", "confirmado", "confirma", "asiste", "asistiré", "1"].includes(str)) {
    return "si";
  }
  return "no";
}

function normalizeDieta(val) {
  const clean = String(val ?? "").trim();
  const emptyValues = [
    "ninguna",
    "ninguno",
    "no",
    "nada",
    "normal",
    "sin restricciones",
    "sin restriccion",
    "sin restricción",
    "-",
    "n/a",
    "na",
  ];
  return emptyValues.includes(clean.toLowerCase()) ? "" : clean;
}

function pickFirstValue(data, candidates) {
  for (const key of candidates) {
    if (key && data[key] !== undefined && data[key] !== null && String(data[key]).trim() !== "") {
      return { key, value: data[key] };
    }
  }
  return { key: candidates[0], value: "" };
}

function extractNombre(data, configuredKey) {
  const candidates = [
    configuredKey,
    "nombreCompleto",
    "nombre_completo",
    "nombreApellido",
    "nombre_apellido",
    "nombreYApellido",
    "invitado",
    "fullName",
    "name",
    "nombre",
  ];

  const found = pickFirstValue(data, candidates);

  // Si existe un campo apellido separado y no está ya incluido en el nombre, los combinamos
  const apellido = data.apellido || data.apellidos || data.lastName || "";
  if (found.value) {
    const base = String(found.value).trim();
    const ap = String(apellido).trim();
    if (ap && !base.toLowerCase().includes(ap.toLowerCase())) {
      return { key: found.key, value: `${base} ${ap}` };
    }
    return { key: found.key, value: base };
  }

  // Último recurso: buscar cualquier campo cuyo nombre contenga "nom", "name" o "invit"
  const fuzzyKey = Object.keys(data).find((k) => /nom|name|invit/i.test(k));
  if (fuzzyKey && data[fuzzyKey]) {
    return { key: fuzzyKey, value: String(data[fuzzyKey]).trim() };
  }

  console.warn(
    "Invitado sin campo de nombre reconocido. Campos encontrados en Firestore:",
    Object.keys(data)
  );
  return { key: configuredKey || "nombre", value: "Sin nombre" };
}

export function useGuests(activeEvent, eventUser) {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!activeEvent || !eventUser) {
      setGuests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { db } = getEventFirebase(activeEvent);
    const colRef = collection(db, activeEvent.coleccion);
    const c = activeEvent.campos || {};

    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const list = snapshot.docs.map((d) => {
          const data = d.data();

          const nombreInfo = extractNombre(data, c.nombre);
          const asistenciaInfo = pickFirstValue(data, [
            c.asistencia,
            "asistencia",
            "confirma",
            "confirmacion",
            "asiste",
            "estado",
          ]);
          const dietaInfo = pickFirstValue(data, [
            c.dieta,
            "dieta",
            "menuEspecial",
            "menu_especial",
            "menu",
            "restricciones",
            "restriccionAlimenticia",
            "alergias",
          ]);
          const comentariosInfo = pickFirstValue(data, [
            c.comentarios,
            "comentarios",
            "comentario",
            "mensaje",
            "notas",
            "observaciones",
          ]);

          const asistencia = parseAsistencia(asistenciaInfo.value);

          const adultosKey = [c.adultos, "adultos", "cantidadAdultos", "mayores"].find(
            (k) => k && data[k] !== undefined
          );
          const ninosKey = [c.ninos, "niños", "ninos", "cantidadNinos", "menores"].find(
            (k) => k && data[k] !== undefined
          );

          const hasFamilyCounts = adultosKey !== undefined || ninosKey !== undefined;
          const adultos = hasFamilyCounts
            ? Number(data[adultosKey] || 0)
            : asistencia === "si"
            ? 1
            : 0;
          const ninos = hasFamilyCounts ? Number(data[ninosKey] || 0) : 0;

          return {
            id: d.id,
            nombre: nombreInfo.value,
            asistencia,
            adultos,
            ninos,
            totalPersonas: adultos + ninos,
            dieta: normalizeDieta(dietaInfo.value),
            comentarios: String(comentariosInfo.value || ""),
            mesa: data.mesa ?? "",
            checkIn: Boolean(data.checkIn),
            checkInHora: data.checkInHora ?? null,
            // Guardamos las claves reales detectadas para editar sin duplicar campos
            _keys: {
              nombre: nombreInfo.key || c.nombre || "nombre",
              asistencia: asistenciaInfo.key || c.asistencia || "asistencia",
              adultos: adultosKey || c.adultos || "adultos",
              ninos: ninosKey || c.ninos || "niños",
              dieta: dietaInfo.key || c.dieta || "dieta",
              comentarios: comentariosInfo.key || c.comentarios || "comentarios",
            },
          };
        });

        list.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
        setGuests(list);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [activeEvent, eventUser]);

  const stats = useMemo(() => {
    const confirmados = guests.filter((g) => g.asistencia === "si");
    const ausentes = guests.filter((g) => g.asistencia === "no");
    const totalAdultos = confirmados.reduce((acc, g) => acc + g.adultos, 0);
    const totalNinos = confirmados.reduce((acc, g) => acc + g.ninos, 0);
    const conDieta = confirmados.filter((g) => g.dieta && g.dieta.trim() !== "").length;
    const sinMesa = confirmados.filter((g) => !g.mesa || g.mesa.trim() === "").length;
    const ingresados = confirmados
      .filter((g) => g.checkIn)
      .reduce((acc, g) => acc + g.totalPersonas, 0);

    return {
      totalRegistros: guests.length,
      gruposConfirmados: confirmados.length,
      gruposAusentes: ausentes.length,
      totalPersonas: totalAdultos + totalNinos,
      totalAdultos,
      totalNinos,
      conDieta,
      sinMesa,
      ingresados,
    };
  }, [guests]);

  const toggleCheckIn = async (guest) => {
    const { db } = getEventFirebase(activeEvent);
    const nextState = !guest.checkIn;
    await updateDoc(doc(db, activeEvent.coleccion, guest.id), {
      checkIn: nextState,
      checkInHora: nextState
        ? new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
        : null,
    });
  };

  const updateMesa = async (guestId, mesa) => {
    const { db } = getEventFirebase(activeEvent);
    await updateDoc(doc(db, activeEvent.coleccion, guestId), { mesa });
  };

  const saveGuest = async (guestData, guestId = null) => {
    const { db } = getEventFirebase(activeEvent);
    const existing = guestId ? guests.find((g) => g.id === guestId) : null;
    const k = existing?._keys || activeEvent.campos || {};

    const payload = {
      [k.nombre || "nombre"]: guestData.nombre,
      [k.asistencia || "asistencia"]: guestData.asistencia,
      [k.adultos || "adultos"]: Number(guestData.adultos || 0),
      [k.ninos || "niños"]: Number(guestData.ninos || 0),
      [k.dieta || "dieta"]: normalizeDieta(guestData.dieta),
      [k.comentarios || "comentarios"]: guestData.comentarios || "",
      mesa: guestData.mesa || "",
    };

    if (guestId) {
      await updateDoc(doc(db, activeEvent.coleccion, guestId), payload);
    } else {
      await addDoc(collection(db, activeEvent.coleccion), {
        ...payload,
        checkIn: false,
        checkInHora: null,
        createdAt: serverTimestamp(),
      });
    }
  };

  const deleteGuest = async (guestId) => {
    const { db } = getEventFirebase(activeEvent);
    await deleteDoc(doc(db, activeEvent.coleccion, guestId));
  };

  return { guests, stats, loading, error, toggleCheckIn, updateMesa, saveGuest, deleteGuest };
}