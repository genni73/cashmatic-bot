import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTabaccheria } from '../contexts/TabaccheriaContext';
import { db } from '../services/firebase';
import { doc, updateDoc, collection, getDocs, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { Store, Key, Users, Info, Save, Plus, Trash2, Eye, EyeOff, Shield, Mail, User } from 'lucide-react';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'profilo', label: 'Profilo Tabaccheria', icon: Store },
  { id: 'netfood', label: 'Configurazione Netfood', icon: Key },
  { id: 'utenti', label: 'Gestione Utenti', icon: Users },
  { id: 'info', label: 'Informazioni', icon: Info }
];

export default function Impostazioni() {
  const { user } = useAuth();
  const { tabaccheria, tabaccheriaId } = useTabaccheria();
  const [activeTab, setActiveTab] = useState('profilo');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Impostazioni</h1>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary text-white'
                  : 'bg-surface-2 text-text-secondary hover:bg-border'
              }`}
            >
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'profilo' && <ProfiloTab tabaccheria={tabaccheria} tabaccheriaId={tabaccheriaId} />}
      {activeTab === 'netfood' && <NetfoodTab tabaccheria={tabaccheria} tabaccheriaId={tabaccheriaId} />}
      {activeTab === 'utenti' && <UtentiTab tabaccheriaId={tabaccheriaId} currentUser={user} />}
      {activeTab === 'info' && <InfoTab />}
    </div>
  );
}

function ProfiloTab({ tabaccheria, tabaccheriaId }) {
  const [form, setForm] = useState({
    nome: '',
    indirizzo: '',
    p_iva: '',
    concessioneADM: '',
    codiceATR: '',
    telefono: '',
    email: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tabaccheria) {
      setForm({
        nome: tabaccheria.nome || '',
        indirizzo: tabaccheria.indirizzo || '',
        p_iva: tabaccheria.p_iva || '',
        concessioneADM: tabaccheria.concessioneADM || '',
        codiceATR: tabaccheria.codiceATR || '',
        telefono: tabaccheria.telefono || '',
        email: tabaccheria.email || ''
      });
    }
  }, [tabaccheria]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateDoc(doc(db, 'tabaccherie', tabaccheriaId), {
        ...form,
        updatedAt: serverTimestamp()
      });
      toast.success('Profilo aggiornato');
    } catch (err) {
      toast.error('Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-text-primary mb-4">Dati Tabaccheria</h2>
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Nome Tabaccheria</label>
            <input type="text" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} className="input-field" required />
          </div>
          <div>
            <label className="label">Indirizzo</label>
            <input type="text" value={form.indirizzo} onChange={e => setForm({ ...form, indirizzo: e.target.value })} className="input-field" placeholder="Via Roma 1, 00100 Roma" />
          </div>
          <div>
            <label className="label">Partita IVA</label>
            <input type="text" value={form.p_iva} onChange={e => setForm({ ...form, p_iva: e.target.value })} className="input-field" placeholder="12345678901" maxLength={11} />
          </div>
          <div>
            <label className="label">Concessione ADM</label>
            <input type="text" value={form.concessioneADM} onChange={e => setForm({ ...form, concessioneADM: e.target.value })} className="input-field" placeholder="Numero concessione" />
          </div>
          <div>
            <label className="label">Codice ATR</label>
            <input type="text" value={form.codiceATR} onChange={e => setForm({ ...form, codiceATR: e.target.value })} className="input-field" placeholder="Codice ATR" />
          </div>
          <div>
            <label className="label">Telefono</label>
            <input type="tel" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} className="input-field" placeholder="+39 06 1234567" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Email di Contatto</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input-field" placeholder="info@tabaccheria.it" />
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <Save size={16} />
            )}
            Salva Modifiche
          </button>
        </div>
      </form>
    </div>
  );
}

function NetfoodTab({ tabaccheria, tabaccheriaId }) {
  const [form, setForm] = useState({ netfoodEndpoint: '', netfoodApiKey: '' });
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tabaccheria) {
      setForm({
        netfoodEndpoint: tabaccheria.netfoodEndpoint || '',
        netfoodApiKey: tabaccheria.netfoodApiKey || ''
      });
    }
  }, [tabaccheria]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateDoc(doc(db, 'tabaccherie', tabaccheriaId), {
        netfoodEndpoint: form.netfoodEndpoint,
        netfoodApiKey: form.netfoodApiKey,
        updatedAt: serverTimestamp()
      });
      toast.success('Configurazione Netfood aggiornata');
    } catch (err) {
      toast.error('Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const maskedKey = form.netfoodApiKey
    ? form.netfoodApiKey.slice(0, 4) + '••••••••' + form.netfoodApiKey.slice(-4)
    : '';

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-text-primary mb-2">Configurazione Netfood</h2>
      <p className="text-sm text-text-muted mb-4">
        Configura la connessione al sistema Netfood per l'importazione automatica delle vendite.
      </p>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="label">Endpoint API Netfood</label>
          <input
            type="url"
            value={form.netfoodEndpoint}
            onChange={e => setForm({ ...form, netfoodEndpoint: e.target.value })}
            className="input-field"
            placeholder="https://api.netfood.it/v1/vendite"
          />
          <p className="text-xs text-text-muted mt-1">L'URL fornito dal supporto Netfood per la tua tabaccheria</p>
        </div>
        <div>
          <label className="label">API Key</label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={showKey ? form.netfoodApiKey : maskedKey}
              onChange={e => { if (showKey) setForm({ ...form, netfoodApiKey: e.target.value }); }}
              className="input-field pr-10"
              placeholder="Inserisci la chiave API"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
            >
              {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p className="text-xs text-text-muted mt-1">La chiave viene salvata in modo sicuro e non è visibile dopo il salvataggio</p>
        </div>
        <div className="bg-surface-2 rounded-lg p-3">
          <h4 className="text-sm font-medium text-text-primary mb-1">Stato Connessione</h4>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${form.netfoodEndpoint && form.netfoodApiKey ? 'bg-success' : 'bg-gray-300'}`} />
            <span className="text-sm text-text-secondary">
              {form.netfoodEndpoint && form.netfoodApiKey ? 'Configurato' : 'Non configurato'}
            </span>
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <Save size={16} />
            )}
            Salva Configurazione
          </button>
        </div>
      </form>
    </div>
  );
}

function UtentiTab({ tabaccheriaId, currentUser }) {
  const [utenti, setUtenti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('operatore');
  const [inviteName, setInviteName] = useState('');
  const [inviting, setInviting] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState(null);

  useEffect(() => {
    loadUtenti();
  }, [tabaccheriaId]);

  const loadUtenti = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), where('tabaccheriaId', '==', tabaccheriaId));
      const snap = await getDocs(q);
      setUtenti(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      toast.error('Errore nel caricamento utenti');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    try {
      await addDoc(collection(db, 'inviti'), {
        email: inviteEmail,
        nome: inviteName,
        ruolo: inviteRole,
        tabaccheriaId,
        stato: 'pending',
        createdAt: serverTimestamp(),
        invitedBy: currentUser?.uid
      });
      toast.success(`Invito inviato a ${inviteEmail}`);
      setInviteEmail('');
      setInviteName('');
      setInviteRole('operatore');
    } catch (err) {
      toast.error("Errore nell'invio dell'invito");
    } finally {
      setInviting(false);
    }
  };

  const getRoleBadge = (role) => {
    const styles = {
      admin: 'bg-primary/10 text-primary',
      manager: 'bg-accent/10 text-accent',
      operatore: 'bg-gray-100 text-gray-600'
    };
    const labels = {
      admin: 'Amministratore',
      manager: 'Manager',
      operatore: 'Operatore'
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ${styles[role] || styles.operatore}`}>
        {labels[role] || role}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Utenti Registrati</h2>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-text-muted font-medium">Nome</th>
                  <th className="text-left py-2 px-3 text-text-muted font-medium">Email</th>
                  <th className="text-left py-2 px-3 text-text-muted font-medium">Ruolo</th>
                  <th className="text-left py-2 px-3 text-text-muted font-medium">Stato</th>
                </tr>
              </thead>
              <tbody>
                {utenti.map(u => (
                  <tr key={u.id} className="border-b border-border/50 hover:bg-surface-2 transition-colors">
                    <td className="py-2.5 px-3 font-medium flex items-center gap-2">
                      <User size={14} className="text-text-muted" />
                      {u.nome || 'N/D'}
                      {u.id === currentUser?.uid && (
                        <span className="text-xs text-primary">(tu)</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-text-secondary">{u.email}</td>
                    <td className="py-2.5 px-3">{getRoleBadge(u.ruolo)}</td>
                    <td className="py-2.5 px-3">
                      <span className="flex items-center gap-1 text-success text-xs">
                        <span className="w-2 h-2 rounded-full bg-success" /> Attivo
                      </span>
                    </td>
                  </tr>
                ))}
                {utenti.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-text-muted">Nessun utente trovato</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-2">Invita Nuovo Utente</h2>
        <p className="text-sm text-text-muted mb-4">
          Invia un invito per aggiungere un collaboratore alla tua tabaccheria.
        </p>
        <form onSubmit={handleInvite} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Nome</label>
              <input
                type="text"
                value={inviteName}
                onChange={e => setInviteName(e.target.value)}
                className="input-field"
                placeholder="Nome collaboratore"
                required
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                className="input-field"
                placeholder="email@esempio.it"
                required
              />
            </div>
            <div>
              <label className="label">Ruolo</label>
              <select
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value)}
                className="select-field"
              >
                <option value="operatore">Operatore</option>
                <option value="manager">Manager</option>
                <option value="admin">Amministratore</option>
              </select>
            </div>
          </div>
          <div className="bg-surface-2 rounded-lg p-3">
            <h4 className="text-sm font-medium text-text-primary mb-1 flex items-center gap-1"><Shield size={14} /> Permessi per Ruolo</h4>
            <ul className="text-xs text-text-muted space-y-1 mt-1">
              <li><strong>Operatore:</strong> Registrazione vendite, visualizzazione dati</li>
              <li><strong>Manager:</strong> Tutto dell'operatore + gestione costi e perdite, report</li>
              <li><strong>Amministratore:</strong> Accesso completo, impostazioni, gestione utenti</li>
            </ul>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={inviting} className="btn-primary flex items-center gap-2">
              {inviting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <Mail size={16} />
              )}
              Invia Invito
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InfoTab() {
  return (
    <div className="card p-6">
      <div className="text-center max-w-md mx-auto py-6">
        <h2 className="text-2xl font-bold text-primary mb-1">TabaccheriaPro</h2>
        <p className="text-sm text-text-muted mb-6">Controllo di Gestione Cloud per Tabaccherie</p>

        <div className="space-y-3 text-sm text-left">
          <div className="flex justify-between py-2 border-b border-border/50">
            <span className="text-text-muted">Versione</span>
            <span className="font-medium text-text-primary">1.0.0</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border/50">
            <span className="text-text-muted">Ambiente</span>
            <span className="font-medium text-text-primary">{import.meta.env.MODE || 'production'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border/50">
            <span className="text-text-muted">Stack</span>
            <span className="font-medium text-text-primary">React + Firebase + Tailwind</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border/50">
            <span className="text-text-muted">Database</span>
            <span className="font-medium text-text-primary">Cloud Firestore</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border/50">
            <span className="text-text-muted">Hosting</span>
            <span className="font-medium text-text-primary">Firebase Hosting</span>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-sm font-semibold text-text-primary">G.F. Technological System</p>
          <p className="text-xs text-text-muted mt-1">Soluzioni tecnologiche per la gestione commerciale</p>
          <p className="text-xs text-text-muted mt-3">
            Tutti i diritti riservati. Questo software è protetto da copyright.
          </p>
        </div>
      </div>
    </div>
  );
}
