import { useState, useEffect, useCallback } from 'react';
import { db } from '../services/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, where } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { getCurrentYearMonth } from '../utils/formatters';

export function useCollection(subcollection, yearMonth) {
  const { userProfile } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const tabId = userProfile?.tabaccheria_id;
  const period = yearMonth || getCurrentYearMonth();

  useEffect(() => {
    if (!tabId) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const colRef = collection(db, 'tabaccherie', tabId, subcollection, period, 'items');
    const q = query(colRef, orderBy('data', 'desc'));

    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setData(docs);
      setLoading(false);
    }, (err) => {
      console.error(`Error loading ${subcollection}:`, err);
      setError(err);
      setLoading(false);
    });

    return unsub;
  }, [tabId, subcollection, period]);

  const addItem = useCallback(async (item) => {
    if (!tabId) return;
    const colRef = collection(db, 'tabaccherie', tabId, subcollection, period, 'items');
    return addDoc(colRef, { ...item, createdAt: serverTimestamp() });
  }, [tabId, subcollection, period]);

  const updateItem = useCallback(async (itemId, updates) => {
    if (!tabId) return;
    const docRef = doc(db, 'tabaccherie', tabId, subcollection, period, 'items', itemId);
    return updateDoc(docRef, { ...updates, updatedAt: serverTimestamp() });
  }, [tabId, subcollection, period]);

  const deleteItem = useCallback(async (itemId) => {
    if (!tabId) return;
    const docRef = doc(db, 'tabaccherie', tabId, subcollection, period, 'items', itemId);
    return deleteDoc(docRef);
  }, [tabId, subcollection, period]);

  return { data, loading, error, addItem, updateItem, deleteItem };
}

export function useAnalytics(yearMonth) {
  const { userProfile } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const tabId = userProfile?.tabaccheria_id;
  const period = yearMonth || getCurrentYearMonth();

  useEffect(() => {
    if (!tabId) {
      setAnalytics(null);
      setLoading(false);
      return;
    }

    const docRef = doc(db, 'tabaccherie', tabId, 'analytics', period);
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setAnalytics({ id: snap.id, ...snap.data() });
      } else {
        setAnalytics(null);
      }
      setLoading(false);
    });

    return unsub;
  }, [tabId, period]);

  return { analytics, loading };
}
