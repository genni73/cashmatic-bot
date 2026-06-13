import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { TabaccheriaProvider } from './contexts/TabaccheriaContext';
import AppLayout from './components/layout/AppLayout';
import PrivateRoute from './components/layout/PrivateRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Costi from './pages/Costi';
import Margini from './pages/Margini';
import Perdite from './pages/Perdite';
import Vendite from './pages/Vendite';
import NetfoodSync from './pages/NetfoodSync';
import Report from './pages/Report';
import Impostazioni from './pages/Impostazioni';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TabaccheriaProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                borderRadius: '10px',
                background: '#0F172A',
                color: '#fff',
                fontSize: '14px',
              },
            }}
          />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              element={
                <PrivateRoute>
                  <AppLayout />
                </PrivateRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="costi" element={<Costi />} />
              <Route path="margini" element={<Margini />} />
              <Route path="perdite" element={<Perdite />} />
              <Route path="vendite" element={<Vendite />} />
              <Route path="netfood" element={<NetfoodSync />} />
              <Route path="report" element={<Report />} />
              <Route path="impostazioni" element={<Impostazioni />} />
            </Route>
          </Routes>
        </TabaccheriaProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
