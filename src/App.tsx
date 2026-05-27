import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from './supabase.ts';
import './App.css';

import { useCallback} from 'react'; // Para el hook inactividad
import { useInactividad } from './hooks/useInactividad';

import Login from './paginas/Auth/Login';
import RecuperarEmail from './paginas/Auth/RecuperarEmail';
import RestablecerPassword from './paginas/Auth/RestablecerPassword';

import AdminLayout from './paginas/Administrador/layout/MainLayout';
import AdminDashboard from './paginas/Administrador/Dashboard';
import Perfil from './paginas/Administrador/Perfil';
import Usuarios from './paginas/Administrador/Usuarios/Usuarios';
import Roles from './paginas/Administrador/Usuarios/Roles';
import Clientes from './paginas/Administrador/Clientes/Clientes';
import Tienda from './paginas/Administrador/Tienda/Tienda';
import Pedidos from './paginas/Administrador/Pedidos/Pedidos';
import CrearPedido from './paginas/Administrador/Pedidos/Crearpedido';
import EditarPedido from './paginas/Administrador/Pedidos/EditarPedido';

import VendedorLayout    from './paginas/Vendedor/layout/MainLayout';
import VendedorDashboard from './paginas/Vendedor/Dashboard';
import PerfilVendedor from './paginas/Vendedor/Perfil';
import ClientesVendedor from './paginas/Vendedor/Clientes/Clientes';
import TiendaVendedor from './paginas/Vendedor/Tienda/Tienda';
import PedidosVendedor from './paginas/Vendedor/Pedidos/Pedidos';
import CrearPedidoVendedor from './paginas/Vendedor/Pedidos/Crearpedido';
import EditarPedidoVendedor from './paginas/Vendedor/Pedidos/EditarPedido';

import FacturadorLayout    from './paginas/Facturador/layout/MainLayout.tsx';
import FacturadorDashboard from './paginas/Facturador/Dashboard.tsx';
import PerfilFacturador from './paginas/Facturador/Perfil.tsx';
import TiendaFacturador from './paginas/Facturador/Tienda/Tienda.tsx';
import PedidosFacturador from './paginas/Facturador/Pedidos/Pedidos.tsx';

type AuthVista = 'login' | 'recuperar-email';
type Rol = 'administrador' | 'vendedor' | 'facturador' | null;

// ── Página dedicada para restablecer contraseña (Manejo de PKCE e Implicit) ──
function PaginaRestablecerPassword() {
  const navigate = useNavigate();
  const [listo, setListo] = useState(false);

  useEffect(() => {
    const verificarFlujoRecuperacion = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setListo(true);
      } else {
        // Si es PKCE, el intercambio del '?code=' puede tardar unos milisegundos.
        // Escuchamos activamente hasta que la sesión se establezca.
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
          if (currentSession) {
            setListo(true);
            subscription.unsubscribe();
          }
        });

        // Guard de seguridad: si en 2.5 segundos no se valida la sesión, el token expiró o es inválido.
        const timer = setTimeout(() => {
          subscription.unsubscribe();
          supabase.auth.getSession().then(({ data: { session: finalSession } }) => {
            if (!finalSession) {
              alert('El enlace de recuperación no es válido, ya fue utilizado o ha expirado.');
              navigate('/', { replace: true });
            } else {
              setListo(true);
            }
          });
        }, 2500);

        return () => {
          clearTimeout(timer);
          subscription.unsubscribe();
        };
      }
    };

    verificarFlujoRecuperacion();
  }, [navigate]);

  const handleRestablecer = async (nuevaPassword: string, _token: string): Promise<boolean> => {
    try {
      // Modificación directa sobre la sesión segura otorgada por el enlace
      const { error } = await supabase.auth.updateUser({ password: nuevaPassword });
      if (error) { 
        alert(`Error al restablecer: ${error.message}`); 
        return false; 
      }

      // Desconexión inmediata para limpiar credenciales temporales y forzar el reingreso manual
      await supabase.auth.signOut();
      return true;
    } catch {
      return false;
    }
  };

  if (!listo) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '12px', background: '#f8f9fa' }}>
        <div style={{ color: '#512da8', fontWeight: 600 }}>Validando credenciales de recuperación...</div>
      </div>
    );
  }

  return (
    <RestablecerPassword
      token=""
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

  const rolesData = data.roles as { nombre: string } | { nombre: string }[] | null;
  if (!rolesData) return null;

  const nombre = Array.isArray(rolesData) ? rolesData[0]?.nombre : rolesData.nombre;

  if (nombre === 'administrador' || nombre === 'vendedor' || nombre === 'facturador') {
    return nombre;
  }

  return null;
}

// ── Ruta por rol ───────────────────────────────────────────────────────────
function rutaPorRol(rol: Rol): string {
  switch (rol) {
    case 'administrador': return '/admin/dashboard';
    case 'vendedor':      return '/vendedor/dashboard';
    case 'facturador':    return '/facturador/dashboard';
    default:              return '/';
  }
}

// ── App principal ──────────────────────────────────────────────────────────
function App() {
  const [usuarioAutenticado, setUsuarioAutenticado] = useState(false);
  const [rol, setRol] = useState<Rol>(null);
  const [authVista, setAuthVista] = useState<AuthVista>('login');
  const [cargando, setCargando] = useState(true);
  const [mostrarAdvertencia, setMostrarAdvertencia] = useState(false); // Hook inactividad
  const navigate = useNavigate();

  // Evaluador riguroso del estado del URL
  const verificarSiEsFlujoRecuperacion = () => {
    const path = window.location.pathname;
    const hash = window.location.hash;
    const search = window.location.search;

    return (
      path === '/restablecer-password' ||
      hash.includes('type=recovery') ||
      search.includes('type=recovery') ||
      search.includes('code=') // Captura indispensable para el flujo PKCE
    );
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const esRecuperacion = verificarSiEsFlujoRecuperacion();

      if (session) {
        // Interceptores preventivos: si es recuperación, bloqueamos desvíos al dashboard
        if (esRecuperacion) {
          setCargando(false);
          if (window.location.pathname !== '/restablecer-password') {
            navigate('/restablecer-password' + window.location.search + window.location.hash, { replace: true });
          }
          return;
        }

        const rolObtenido = await obtenerRolUsuario(session.user.id);
        if (!rolObtenido) {
          await supabase.auth.signOut();
        } else {
          setRol(rolObtenido);
          setUsuarioAutenticado(true);
          if (window.location.pathname === '/') {
            navigate(rutaPorRol(rolObtenido));
          }
        }
      }
      setCargando(false);
    });
  }, [navigate]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Evento de Auth:", event);
      const esRecuperacion = verificarSiEsFlujoRecuperacion();
      
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/restablecer-password', { replace: true });
        return;
      }

      // Si el inicio de sesión es automático por código de recuperación, evitamos procesarlo como login ordinario
      if (event === 'SIGNED_IN' && session) {
        if (esRecuperacion) {
          return; 
        }

        // Login manual estándar a través del formulario
        if (window.location.pathname === '/') {
          const rolObtenido = await obtenerRolUsuario(session.user.id);
          if (rolObtenido) {
            setRol(rolObtenido);
            setUsuarioAutenticado(true);
            navigate(rutaPorRol(rolObtenido));
          }
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

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
  const handleBuscarEmail = async (numeroIdentificacion: string, telefono: string) => {
    try {
      const { data, error } = await supabase.rpc('buscar_correo_por_documento', {
        p_documento: numeroIdentificacion.trim(),
        p_telefono: telefono.trim()
      });

      if (error) {
        console.error('Error en la función RPC:', error.message);
        return null;
      }

      return data ? data : null;
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

  const handleAdvertencia = useCallback(() => {setMostrarAdvertencia(true);}, []);

  const handleCierreAutomatico = useCallback(async () => {
    setMostrarAdvertencia(false);
    await supabase.auth.signOut();
    setUsuarioAutenticado(false);
    setRol(null);
    navigate('/');
  }, [navigate]);

  useInactividad({
    onAdvertencia: handleAdvertencia,
    onCerrarSesion: handleCierreAutomatico,
    activo: usuarioAutenticado,
  });

  if (cargando) return null;

  return (
      <>
      {/* ── Modal advertencia inactividad ── */}
      {mostrarAdvertencia && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999,
        }}>
          <div style={{
            background: '#fff', borderRadius: '12px',
            padding: '32px', maxWidth: '380px', width: '90%',
            textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>⏱️</div>
            <h3 style={{ margin: '0 0 8px', color: '#1e1b2e', fontSize: '18px' }}>
              ¿Sigues ahí?
            </h3>
            <p style={{ color: '#666', fontSize: '14px', margin: '0 0 24px' }}>
              Tu sesión se cerrará en <strong>1 minuto</strong> por inactividad.
            </p>
            <button
              onClick={() => setMostrarAdvertencia(false)}
              style={{
                background: '#512da8', color: '#fff',
                border: 'none', borderRadius: '8px',
                padding: '10px 28px', fontSize: '14px',
                fontWeight: 600, cursor: 'pointer',
              }}
            >
              Seguir conectado
            </button>
          </div>
        </div>
      )}

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
                  <Navigate to="/recuperar-email" replace />
                )}
              </>
            )
          }
        />

        {/* Ruta aislada para la subpantalla de búsqueda de correo electrónico */}
        <Route 
          path="/recuperar-email" 
          element={
            <RecuperarEmail
              onVolver={() => { setAuthVista('login'); navigate('/'); }}
              onBuscarEmail={handleBuscarEmail}
            />
          } 
        />

        <Route path="/restablecer-password" element={<PaginaRestablecerPassword />} />

        {/* Administrador */}
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
          <Route path="usuarios" element={<Usuarios />} />
          <Route path="roles" element={<Roles />} /> 
          <Route path="clientes" element={<Clientes />} />
          <Route path="tienda" element={<Tienda />} />
          <Route path="pedidos">
            <Route index element={<Pedidos />} />
            <Route path="crear" element={<CrearPedido />} />
            <Route path="editar/:id" element={<EditarPedido />} />
          </Route>
        </Route>

        {/* Vendedor */}
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
          <Route path="perfil" element={<PerfilVendedor />} />
          <Route path="clientes" element={<ClientesVendedor />} />
          <Route path="tienda" element={<TiendaVendedor />} />
          <Route path="pedidos">
            <Route index element={<PedidosVendedor />} />
            <Route path="crear" element={<CrearPedidoVendedor />} />
            <Route path="editar/:id" element={<EditarPedidoVendedor />} />
          </Route>
        </Route>

        {/* Facturador */}
        <Route
          path="/facturador"
          element={
            usuarioAutenticado && rol === 'facturador'
              ? <FacturadorLayout onCerrarSesion={handleCerrarSesion} />
              : <Navigate to="/" replace />
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<FacturadorDashboard />} />
          <Route path="perfil" element={<PerfilFacturador />} />
          <Route path="tienda" element={<TiendaFacturador />} />
          <Route path="pedidos" element={<PedidosFacturador />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;