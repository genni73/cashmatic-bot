import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [nomeTabaccheria, setNomeTabaccheria] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        const tabId = `tab_${Date.now()}`;
        const cred = await register(email, password, nome, 'admin', tabId);
        await setDoc(doc(db, 'tabaccherie', tabId), {
          nome: nomeTabaccheria,
          indirizzo: '',
          p_iva: '',
          concessioneADM: '',
          codiceATR: '',
          netfoodApiKey: '',
          netfoodEndpoint: '',
          createdAt: serverTimestamp(),
          piano: 'base'
        });
        toast.success('Account creato con successo!');
      } else {
        await login(email, password);
        toast.success('Benvenuto!');
      }
      navigate('/');
    } catch (err) {
      const messages = {
        'auth/user-not-found': 'Utente non trovato',
        'auth/wrong-password': 'Password errata',
        'auth/invalid-credential': 'Credenziali non valide',
        'auth/email-already-in-use': 'Email già registrata',
        'auth/weak-password': 'Password troppo debole (min. 6 caratteri)',
        'auth/invalid-email': 'Email non valida'
      };
      toast.error(messages[err.code] || 'Errore di autenticazione');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-primary-dark p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-accent-light">TabaccheriaPro</h1>
          <p className="text-white/60 text-sm mt-1">Controllo di Gestione Cloud</p>
          <p className="text-white/40 text-xs mt-1">by G.F. Technological System</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-6">
            {isRegister ? 'Registra la tua Tabaccheria' : 'Accedi'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="label">Il tuo nome</label>
                  <input type="text" value={nome} onChange={e => setNome(e.target.value)} className="input-field" placeholder="Mario Rossi" required />
                </div>
                <div>
                  <label className="label">Nome Tabaccheria</label>
                  <input type="text" value={nomeTabaccheria} onChange={e => setNomeTabaccheria(e.target.value)} className="input-field" placeholder="Tabaccheria Rossi" required />
                </div>
              </>
            )}
            <div>
              <label className="label">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder="email@esempio.it" required />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="input-field pr-10" placeholder="••••••••" required minLength={6} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-2.5">
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  {isRegister ? <UserPlus size={18} /> : <LogIn size={18} />}
                  {isRegister ? 'Registrati' : 'Accedi'}
                </>
              )}
            </button>
          </form>
          <div className="mt-4 text-center">
            <button onClick={() => setIsRegister(!isRegister)} className="text-sm text-primary hover:text-primary-light transition-colors">
              {isRegister ? 'Hai già un account? Accedi' : 'Prima volta? Registra la tua tabaccheria'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
