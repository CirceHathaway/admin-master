export const EVENTS = [
  {
    id: "xv-tiziana",
    nombre: "XV Años de Tiziana",
    fecha: "2026-12-12",
    coleccion: "invitados_tiziana",
    colorAcento: "#c0c0c0", // Para distinguir visualmente qué panel tenés abierto
    campos: {
      nombre: "nombre",
      asistencia: "asistencia",
      adultos: "adultos",
      ninos: "niños", // Ajustar a "ninos" si en Firestore se guardó sin ñ
      dieta: "dieta",
      comentarios: "comentarios",
    },
    firebaseConfig: {
      apiKey: import.meta.env.VITE_TIZIANA_API_KEY,
      authDomain: import.meta.env.VITE_TIZIANA_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_TIZIANA_PROJECT_ID,
      storageBucket: import.meta.env.VITE_TIZIANA_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_TIZIANA_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_TIZIANA_APP_ID,
    },
  },
  // Acá sumás los siguientes eventos (ej. xv-melanie, xv-sofia...)
];