import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';

import Login from './paginas/Auth/Login';
import RecuperarEmail from './paginas/Auth/RecuperarEmail';
import RestablecerPassword from './paginas/Auth/RestablecerPassword';

import MainLayout from './paginas/Administrador/layout/MainLayout';
import Dashboard from './paginas/Administrador/Dashboard';

import { supabase } from './supabase.ts';
import './App.css';

type AuthVista = 'login' | 'recuperar-email';

// ── Página dedicada para restablecer contraseña ────────────────────────────
// Supabase redirige aquí con el token en el hash de la URL:
// https://bright-paletas-6f2e42.netlify.app/restablecer-password#access_token=...
function PaginaRestablecerPassword() {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [listo, setListo] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    const error = params.get('error');
    const errorDescription = params.get('error_description');

    if (error) {
      alert(`El enlace no es válido o ha expirado: ${errorDescription?.replace(/\+/g, ' ')}`);
      navigate('/', { replace: true });
      return;
    }

    if (accessToken) {
      setToken(accessToken);
      // Limpia el hash de la URL por seguridad sin redirigir
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      // Alguien navegó a /restablecer-password sin token — mandarlo al login
      navigate('/', { replace: true });
    }

    setListo(true);
  }, []);

  const handleRestablecer = async (nuevaPassword: string, _token: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.updateUser({ password: nuevaPassword });
      if (error) { alert(`Error al restablecer: ${error.message}`); return false; }
      return true;
    } catch { return false; }
  };

  // Espera hasta haber leído el hash antes de renderizar
  if (!listo) return null;

  return (
    <RestablecerPassword
      token={token}
      onRestablecer={handleRestablecer}
      onVolver={() => navigate('/', { replace: true })}
    />
  );
}

// ── App principal ──────────────────────────────────────────────────────────
function App() {
  const [usuarioAutenticado, setUsuarioAutenticado] = useState(false);
  const [authVista, setAuthVista] = useState<AuthVista>('login');
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
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
      redirectTo: 'https://bright-paletas-6f2e42.netlify.app/restablecer-password',
    });
    if (error) { alert(`Error al enviar enlace: ${error.message}`); throw error; }
  };

  // ── Recuperar correo ───────────────────────────────────────────────────────
  const handleBuscarEmail = async (nombre: string, telefono: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.rpc('buscar_correo_por_identidad', {
        p_nombre:   nombre.trim(),
        p_telefono: telefono.trim(),
      });
      if (error) { console.error('Error al buscar email:', error.message); return null; }
      return data ?? null;
    } catch (error) {
      console.error('Error inesperado al buscar email:', error);
      return null;
    }
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
            </>
          )
        }
      />

      {/* ── Ruta dedicada — Supabase redirige aquí desde el correo ── */}
      <Route path="/restablecer-password" element={<PaginaRestablecerPassword />} />

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