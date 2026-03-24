import React, { useState, useEffect } from 'react';
import Login from './Login';
import RecuperarEmail from './RecuperarEmail';
import RestablecerPassword from './RestablecerPassword';

// Definimos las posibles vistas de nuestra sección de autenticación
type AuthView = 'login' | 'recuperar-email' | 'restablecer-password';

const AuthManager: React.FC = () => {
  const [currentView, setCurrentView] = useState<AuthView>('login');
  const [resetToken, setResetToken] = useState<string>('');

  // Efecto para detectar si el usuario llega desde un enlace de su correo
  useEffect(() => {
    // Si usas React Router, puedes usar useSearchParams. 
    // Aquí usamos window.location de forma nativa para leer el token de la URL.
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      setResetToken(token);
      setCurrentView('restablecer-password');
    }
  }, []);

  // --- Funciones de Lógica de Negocio ---
  
  const handleLogin = async (email: string, password: string) => {
    console.log('Haciendo login con:', email, password);
    // Aquí llamas a tu API
  };

  const handleRecoverPassword = async (email: string) => {
    console.log('Enviando correo de recuperación a:', email);
    // Aquí llamas a tu API. El usuario se queda en Login viendo un mensaje de éxito.
    alert('Si el correo existe, hemos enviado un enlace de recuperación.');
  };

  const handleBuscarEmail = async (nombre: string, telefono: string) => {
    console.log('Buscando email para:', nombre, telefono);
    // Simulación de respuesta de la API
    return "usuario@ejemplo.com"; 
  };

  //const handleRestablecerPassword = async (nuevaPassword: string, token: string) => {
    //console.log('Guardando nueva password con token:', token);
    // Llama a tu API. Retorna true si fue exitoso, false si falló.
    //return true; 
  //};

  // --- Renderizado Condicional ---

  if (currentView === 'recuperar-email') {
    return (
      <RecuperarEmail 
        onVolver={() => setCurrentView('login')} 
        onBuscarEmail={handleBuscarEmail}
      />
    );
  }

  if (currentView === 'restablecer-password') {
    return (
      <RestablecerPassword 
        token={resetToken}
        onVolver={() => {
          // Limpiar la URL y volver al login
          window.history.replaceState({}, document.title, window.location.pathname);
          setCurrentView('login');
        }}
        //onRestablecer={handleRestablecerPassword}
      />
    );
  }

  // Por defecto, renderiza el Login
  return (
    <Login 
      onLogin={handleLogin}
      onRecoverPassword={handleRecoverPassword}
      onForgotEmail={() => setCurrentView('recuperar-email')} // ¡Aquí conectamos el botón!
    />
  );
};

export default AuthManager;