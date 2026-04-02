import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';

import Login from './paginas/Auth/Login';
import RecuperarEmail from './paginas/Auth/RecuperarEmail';
import RestablecerPassword from './paginas/Auth/RestablecerPassword';

import AdminLayout from './paginas/Administrador/layout/MainLayout';
import AdminDashboard from './paginas/Administrador/Dashboard';
import Perfil from './paginas/Administrador/Perfil';

import VendedorLayout    from './paginas/Vendedor/layout/MainLayout';
import VendedorDashboard from './paginas/Vendedor/Dashboard';

import UsuarioLayout    from './paginas/Usuario/layout/MainLayout';
import UsuarioDashboard from './paginas/Usuario/Dashboard';

import { supabase } from './supabase.ts';
import './App.css';

type AuthVista = 'login' | 'recuperar-email';
type Rol = 'administrador' | 'vendedor' | 'usuario' | null;

// ── Página dedicada para restablecer contraseña ────────────────────────────
function PaginaRestablecerPassword() {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [listo, setListo] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    const type = params.get('type');
    const error = params.get('error');
    const errorDescription = params.get('error_description');

    if (error) {
      alert(`El enlace no es válido o ha expirado: ${errorDescription?.replace(/\+/g, ' ')}`);
      navigate('/', { replace: true });
      return;
    }

    if (accessToken && type === 'recovery') {
      supabase.auth.signOut().then(() => {
        setToken(accessToken);
        window.history.replaceState({}, document.title, window.location.pathname);
        setListo(true);
      });
    } else if (accessToken) {
      setToken(accessToken);
      window.history.replaceState({}, document.title, window.location.pathname);
      setListo(true);
    } else {
      navigate('/', { replace: true });
    }
  }, []);

  const handleRestablecer = async (nuevaPassword: string, _token: string): Promise<boolean> => {
    try {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: token,
        refresh_token: new URLSearchParams(window.location.hash.substring(1)).get('refresh_token') ?? '',
      });
      if (sessionError) { alert(`Sesión inválida: ${sessionError.message}`); return false; }

      const { error } = await supabase.auth.updateUser({ password: nuevaPassword });
      if (error) { alert(`Error al restablecer: ${error.message}`); return false; }

      await supabase.auth.signOut();
      return true;
    } catch {
      return false;
    }
  };

  if (!listo) return null;

  return (
    <RestablecerPassword
      token={token}
      onRestablecer={handleRestablecer}
      onVolver={() => navigate('/', { replace: true })}
    />
  );
}

// ── Consultar rol del usuario autenticado ──────────────────────────────────
async function obtenerRolUsuario(userId: string): Promise<Rol> {
  const { data, error } = await supabase
    .from('usuarios')
    .select(`
      rol_id,
      roles (
        nombre
      )
    `)
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error obteniendo rol:', error.message);
    return null;
  }

  if (!data) return null;

  // Supabase puede devolver roles como objeto o array
  const rolesData = data.roles as { nombre: string } | { nombre: string }[] | null;
  if (!rolesData) return null;

  const nombre = Array.isArray(rolesData) ? rolesData[0]?.nombre : rolesData.nombre;

  if (nombre === 'administrador' || nombre === 'vendedor' || nombre === 'usuario') {
    return nombre;
  }

  return null;
}

// ── Ruta por rol ───────────────────────────────────────────────────────────
function rutaPorRol(rol: Rol): string {
  switch (rol) {
    case 'administrador': return '/admin/dashboard';
    case 'vendedor':      return '/vendedor/dashboard';
    case 'usuario':       return '/usuario/dashboard';
    default:              return '/';
  }
}

// ── App principal ──────────────────────────────────────────────────────────
function App() {
  const [usuarioAutenticado, setUsuarioAutenticado] = useState(false);
  const [rol, setRol] = useState<Rol>(null);
  const [authVista, setAuthVista] = useState<AuthVista>('login');
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const rolObtenido = await obtenerRolUsuario(session.user.id);
        if (!rolObtenido) {
          // Sin rol válido: cerrar sesión
          await supabase.auth.signOut();
        } else {
          setRol(rolObtenido);
          setUsuarioAutenticado(true);
          navigate(rutaPorRol(rolObtenido));
        }
      }
      setCargando(false);
    });
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────
  const handleLogin = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { alert(`Error de acceso: ${error.message}`); return; }

      if (data.user) {
        const rolObtenido = await obtenerRolUsuario(data.user.id);
        if (!rolObtenido) {
          alert('Tu cuenta no tiene un rol asignado. Contacta al administrador.');
          await supabase.auth.signOut();
          return;
        }
        setRol(rolObtenido);
        setUsuarioAutenticado(true);
        navigate(rutaPorRol(rolObtenido));
      }
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
    setRol(null);
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
            <Navigate to={rutaPorRol(rol)} replace />
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
          usuarioAutenticado && rol === 'administrador'
            ? <AdminLayout onCerrarSesion={handleCerrarSesion} />
            : <Navigate to="/" replace />
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="perfil" element={<Perfil />} />
      </Route>

      {/* ── Panel vendedor ── */}
      <Route
        path="/vendedor"
        element={
          usuarioAutenticado && rol === 'vendedor'
            ? <VendedorLayout onCerrarSesion={handleCerrarSesion} />
            : <Navigate to="/" replace />
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<VendedorDashboard />} />
      </Route>

      {/* ── Panel usuario ── */}
      <Route
        path="/usuario"
        element={
          usuarioAutenticado && rol === 'usuario'
            ? <UsuarioLayout onCerrarSesion={handleCerrarSesion} />
            : <Navigate to="/" replace />
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<UsuarioDashboard />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;