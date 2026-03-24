import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';

import Login from './paginas/Auth/Login';
import RecuperarEmail from './paginas/Auth/RecuperarEmail';
import RestablecerPassword from './paginas/Auth/RestablecerPassword';

import MainLayout from './paginas/Administrador/layout/MainLayout';
import Dashboard from './paginas/Administrador/Dashboard';

import { supabase } from './supabase.ts';
import './App.css';

type AuthVista = 'login' | 'recuperar-email' | 'restablecer-password';

function App() {
  const [usuarioAutenticado, setUsuarioAutenticado] = useState(false);
  const [authVista, setAuthVista] = useState<AuthVista>('login');
  const [tokenRecuperacion, setTokenRecuperacion] = useState('');
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;

    if (hash && hash.includes('type=recovery')) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      const error = params.get('error');
      const errorDescription = params.get('error_description');

      if (error) {
        alert(`El enlace no es válido o ha expirado: ${errorDescription?.replace(/\+/g, ' ')}`);
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (accessToken) {
        setTokenRecuperacion(accessToken);
        setAuthVista('restablecer-password');
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      setCargando(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUsuarioAutenticado(true);
        navigate('/admin/dashboard');
      }
      setCargando(false);
    });
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────
  const handleLogin = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { alert(`Error de acceso: ${error.message}`); return; }
      if (data.user) { setUsuarioAutenticado(true); navigate('/admin/dashboard'); }
    } catch (error) {
      console.error('Error inesperado:', error);
      alert('Ocurrió un error al intentar conectar con el servidor.');
    }
  };

  // ── Recuperar contraseña ───────────────────────────────────────────────────
  const handleRecuperarPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:5173',
    });
    if (error) { alert(`Error al enviar enlace: ${error.message}`); throw error; }
  };

  // ── Recuperar correo ───────────────────────────────────────────────────────
  // Usa una función RPC segura (SECURITY DEFINER) en lugar de consultar
  // la tabla directamente — evita exponer datos a usuarios no autenticados
  const handleBuscarEmail = async (nombre: string, telefono: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.rpc('buscar_correo_por_identidad', {
        p_nombre:   nombre.trim(),
        p_telefono: telefono.trim(),
      });

      if (error) {
        console.error('Error al buscar email:', error.message);
        return null;
      }

      return data ?? null; // la función retorna el correo directamente o null
    } catch (error) {
      console.error('Error inesperado al buscar email:', error);
      return null;
    }
  };

  // ── Restablecer contraseña ─────────────────────────────────────────────────
  const handleRestablecerPassword = async (nuevaPassword: string, _token: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.updateUser({ password: nuevaPassword });
      if (error) { alert(`Error al restablecer: ${error.message}`); return false; }
      return true;
    } catch { return false; }
  };

  const handleCerrarSesion = async () => {
    await supabase.auth.signOut();
    setUsuarioAutenticado(false);
    navigate('/');
  };

  if (cargando) return null;

  return (
    <Routes>
      {/* ── Autenticación ── */}
      <Route
        path="/"
        element={
          usuarioAutenticado ? (
            <Navigate to="/admin/dashboard" replace />
          ) : (
            <>
              {authVista === 'login' && (
                <Login
                  onLogin={handleLogin}
                  onRecoverPassword={handleRecuperarPassword}
                  onForgotEmail={() => setAuthVista('recuperar-email')}
                />
              )}
              {authVista === 'recuperar-email' && (
                <RecuperarEmail
                  onVolver={() => setAuthVista('login')}
                  onBuscarEmail={handleBuscarEmail}
                />
              )}
              {authVista === 'restablecer-password' && (
                <RestablecerPassword
                  token={tokenRecuperacion}
                  onRestablecer={handleRestablecerPassword}
                  onVolver={() => setAuthVista('login')}
                />
              )}
            </>
          )
        }
      />

      {/* ── Panel administrador ── */}
      <Route
        path="/admin"
        element={
          usuarioAutenticado
            ? <MainLayout onCerrarSesion={handleCerrarSesion} />
            : <Navigate to="/" replace />
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        {/* Próximas páginas:
            <Route path="usuarios" element={<Usuarios />} />
            <Route path="tienda"   element={<Tienda />} />
            <Route path="pedidos"  element={<Pedidos />} />
        */}
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;