import { useState } from 'react';
import Login from './paginas/Auth/Login';
import RecuperarPassword from './paginas/Auth/RecuperarPassword';
import RecuperarEmail from './paginas/Auth/RecuperarEmail';
import RestablecerPassword from './paginas/Auth/RestablecerPassword';
import Dashboard from './paginas/Dashboard/Dashboard';

import { supabase } from './supabase.ts'; // Asegúrate de importar tu cliente
import './App.css';

type Vista = 'login' | 'recuperar-password' | 'recuperar-email' | 'restablecer-password' | 'dashboard';

function App() {
  const [vistaActual, setVistaActual] = useState<Vista>('login');
  const [tokenRecuperacion, setTokenRecuperacion] = useState('');
  const [usuarioAutenticado, setUsuarioAutenticado] = useState(false);

  // Función para manejar el login
  const handleLogin = async (email: string, password: string) => {
  try {
    // 1. Llamamos a Supabase para autenticar
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(`Error de acceso: ${error.message}`);
      return;
    }

    if (data.user) {
      console.log('Usuario autenticado:', data.user);
      
      // 2. Si todo sale bien, cambiamos el estado
      setUsuarioAutenticado(true);
      setVistaActual('dashboard');
    }
  } catch (error) {
    console.error('Error inesperado:', error);
    alert('Ocurrió un error al intentar conectar con el servidor.');
  }
};

  // Función para enviar enlace de recuperación
  const handleEnviarEnlaceRecuperacion = async (email: string): Promise<boolean> => {
    console.log('Enviar enlace a:', email);
    
    // Aquí iría tu lógica para enviar el email
    // Por ejemplo: llamar a tu API que envía el correo
    
    // Simulación: siempre retorna true
    return true;
  };

  // Función para buscar email por nombre y teléfono
  const handleBuscarEmail = async (nombre: string, telefono: string): Promise<string | null> => {
    console.log('Buscar email para:', { nombre, telefono });
    
    // Aquí iría tu lógica para buscar en la BD
    // Por ejemplo: llamar a tu API que busca el usuario
    
    // Simulación: retorna un email de prueba
    return 'usuario@ejemplo.com';
  };

  // Función para restablecer la contraseña
  const handleRestablecerPassword = async (nuevaPassword: string, token: string): Promise<boolean> => {
    console.log('Restablecer password con token:', token);
    
    // Aquí iría tu lógica para actualizar la contraseña en la BD
    // Por ejemplo: validar el token y actualizar la contraseña
    
    // Simulación: siempre retorna true
    return true;
  };

  // Navegación entre vistas
  const irARecuperarPassword = () => setVistaActual('recuperar-password');
  const irARecuperarEmail = () => setVistaActual('recuperar-email');
  const irALogin = () => {
    setVistaActual('login');
    setUsuarioAutenticado(false);
  };
  
  // Esta función simula recibir un enlace de recuperación
  // En producción, esto vendría de los parámetros de la URL
  const irARestablecerPassword = (token: string = 'token-ejemplo-123') => {
    setTokenRecuperacion(token);
    setVistaActual('restablecer-password');
  };

  return (
    <>
      {vistaActual === 'login' && (
        <Login 
          onLogin={handleLogin}
          onRecoverPassword={irARecuperarPassword}
        />
      )}

      {vistaActual === 'recuperar-password' && (
        <RecuperarPassword
          onVolver={irALogin}
          onRecuperarEmail={irARecuperarEmail}
          onEnviarEnlace={handleEnviarEnlaceRecuperacion}
        />
      )}

      {vistaActual === 'recuperar-email' && (
        <RecuperarEmail
          onVolver={irARecuperarPassword}
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