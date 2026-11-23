import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { masterDb } from "../firebase/master";
import { resetEventFirebase } from "../firebase/eventManager";

function normalizeTutores(list = []) {
  return [...new Set(list.map((e) => String(e).trim().toLowerCase()).filter(Boolean))];
}

export function useEvents(masterUser, isMasterAdmin) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!masterUser) {
      setEvents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const colRef = collection(masterDb, "eventos");
    const q = isMasterAdmin
      ? query(colRef, orderBy("createdAt", "desc"))
      : query(colRef, where("tutoresEmails", "array-contains", masterUser.email.toLowerCase()));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setEvents(list);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [masterUser, isMasterAdmin]);

  const addEvent = async (eventData) => {
    const docRef = await addDoc(collection(masterDb, "eventos"), {
      ...eventData,
      tutoresEmails: normalizeTutores(eventData.tutoresEmails),
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  };

  const updateEvent = async (eventId, eventData) => {
    await updateDoc(doc(masterDb, "eventos", eventId), {
      ...eventData,
      tutoresEmails: normalizeTutores(eventData.tutoresEmails),
      updatedAt: serverTimestamp(),
    });
    await resetEventFirebase(eventId);
  };

  const deleteEvent = async (eventId) => {
    await deleteDoc(doc(masterDb, "eventos", eventId));
    await resetEventFirebase(eventId);
  };

  return { events, loading, error, addEvent, updateEvent, deleteEvent };
}