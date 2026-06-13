import { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const TabaccheriaContext = createContext(null);

export function useTabaccheria() {
  return useContext(TabaccheriaContext);
}

export function TabaccheriaProvider({ children }) {
  const { userProfile } = useAuth();
  const [tabaccheria, setTabaccheria] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.tabaccheria_id) {
      setTabaccheria(null);
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(
      doc(db, 'tabaccherie', userProfile.tabaccheria_id),
      (snap) => {
        if (snap.exists()) {
          setTabaccheria({ id: snap.id, ...snap.data() });
        }
        setLoading(false);
      }
    );
    return unsub;
  }, [userProfile?.tabaccheria_id]);

  return (
    <TabaccheriaContext.Provider value={{ tabaccheria, loading }}>
      {children}
    </TabaccheriaContext.Provider>
  );
}
