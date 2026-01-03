import { useState } from 'react';
import Login from './componentes/Auth/Login';
import RecuperarPassword from './componentes/Auth/RecuperarPassword';
import RecuperarEmail from './componentes/Auth/RecuperarEmail';
import RestablecerPassword from './componentes/Auth/RestablecerPassword';
import Dashboard from './componentes/Dashboard/Dashboard';
import './App.css';

type Vista = 'login' | 'recuperar-password' | 'recuperar-email' | 'restablecer-password' | 'dashboard';

function App() {
  const [vistaActual, setVistaActual] = useState<Vista>('login');
  const [tokenRecuperacion, setTokenRecuperacion] = useState('');
  const [usuarioAutenticado, setUsuarioAutenticado] = useState(false);

  // Función para manejar el login
  const handleLogin = async (email: string, password: string) => {
    console.log('Login:', { email, password });
    
    // Aquí iría tu lógica de autenticación
    // Por ejemplo: llamar a tu API, validar credenciales, etc.
    
    // Simulación: después de autenticar, ir al dashboard
    setUsuarioAutenticado(true);
    setVistaActual('dashboard');
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