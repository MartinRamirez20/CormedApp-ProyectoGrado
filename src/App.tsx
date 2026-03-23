import { useState, useEffect } from 'react';
import Login from './paginas/Auth/Login';
import RecuperarEmail from './paginas/Auth/RecuperarEmail';
import RestablecerPassword from './paginas/Auth/RestablecerPassword';
import Dashboard from './paginas/Dashboard/Dashboard';

import { supabase } from './supabase.ts';
import './App.css';

type Vista = 'login' | 'recuperar-email' | 'restablecer-password' | 'dashboard';

function App() {
  const [vistaActual, setVistaActual] = useState<Vista>('login');
  const [tokenRecuperacion, setTokenRecuperacion] = useState('');
  const [usuarioAutenticado, setUsuarioAutenticado] = useState(false);

  // Detecta si el usuario llega desde un enlace de recuperación en su correo
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
        return;
      }

      if (accessToken) {
        setTokenRecuperacion(accessToken);
        setVistaActual('restablecer-password');
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────
  const handleLogin = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        alert(`Error de acceso: ${error.message}`);
        return;
      }

      if (data.user) {
        setUsuarioAutenticado(true);
        setVistaActual('dashboard');
      }
    } catch (error) {
      console.error('Error inesperado:', error);
      alert('Ocurrió un error al intentar conectar con el servidor.');
    }
  };

  // ── Recuperar contraseña (envía enlace al correo) ──────────────────────────
  const handleRecuperarPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:5173',
    });

    if (error) {
      alert(`Error al enviar enlace: ${error.message}`);
      throw error;
    }
  };

  // ── Recuperar correo (busca en public.usuarios por nombre + teléfono) ──────
  const handleBuscarEmail = async (nombre: string, telefono: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('correo')
        .ilike('nombre_razon_social', nombre.trim()) // ilike = case-insensitive
        .eq('telefono', telefono.trim())
        .single(); // esperamos exactamente un resultado

      if (error || !data) {
        // No encontrado o error de BD — retornamos null para que
        // RecuperarEmail.tsx muestre el mensaje de "cuenta no encontrada"
        return null;
      }

      return data.correo;
    } catch (error) {
      console.error('Error al buscar email:', error);
      return null;
    }
  };

  // ── Restablecer contraseña ─────────────────────────────────────────────────
  const handleRestablecerPassword = async (nuevaPassword: string, _token: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.updateUser({ password: nuevaPassword });

      if (error) {
        alert(`Error al restablecer: ${error.message}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error inesperado:', error);
      return false;
    }
  };

  const irALogin = () => {
    setVistaActual('login');
    setUsuarioAutenticado(false);
  };

  return (
    <>
      {vistaActual === 'login' && (
        <Login
          onLogin={handleLogin}
          onRecoverPassword={handleRecuperarPassword}
          onForgotEmail={() => setVistaActual('recuperar-email')}
        />
      )}

      {vistaActual === 'recuperar-email' && (
        <RecuperarEmail
          onVolver={irALogin}
          onBuscarEmail={handleBuscarEmail}
        />
      )}

      {vistaActual === 'restablecer-password' && (
        <RestablecerPassword
          token={tokenRecuperacion}
          onRestablecer={handleRestablecerPassword}
          onVolver={irALogin}
        />
      )}

      {vistaActual === 'dashboard' && usuarioAutenticado && (
        <Dashboard />
      )}
    </>
  );
}

export default App;