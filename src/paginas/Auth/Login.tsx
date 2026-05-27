import React, { useState } from 'react';
import { FaEye, FaEyeSlash, FaExclamationCircle, FaEnvelope } from 'react-icons/fa';
import { supabase } from '../../supabase';
import './Login.css';

interface LoginProps {
  onLogin?: (email: string, password: string) => Promise<void> | void;
  onRecoverPassword?: (email: string) => Promise<void> | void;
  onForgotEmail?: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onRecoverPassword, onForgotEmail }) => {
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  
  const [recoverySuccess, setRecoverySuccess] = useState(false);
  const [recoveryError, setRecoveryError] = useState(''); // NUEVO: Estado para el error de recuperación
  const [showPassword, setShowPassword] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onLogin) {
      setLoading(true);
      try {
        await onLogin(loginEmail, loginPassword);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(''); // Limpiamos errores previos

    if (onRecoverPassword) {
      setLoading(true);
      try {
        // Usamos .ilike() para ignorar mayúsculas/minúsculas y .trim() para limpiar espacios
        const emailLimpio = recoveryEmail.trim();

        const { data, error } = await supabase
          .from('usuarios')
          .select('correo')
          .ilike('correo', emailLimpio) 
          .maybeSingle();

        // SOLUCIÓN A TYPESCRIPT: Usamos la variable 'error'
        if (error) {
          console.error("Error al consultar la base de datos:", error.message);
          setRecoveryError('Problema de conexión al verificar el correo.');
          setLoading(false);
          return;
        }

        // Si no hay datos, el correo no está registrado (o está bloqueado por RLS)
        if (!data) {
          setRecoveryError('Este correo no está registrado en el sistema.');
          setLoading(false);
          return;
        }

        // Si pasa la validación, enviamos el enlace
        await onRecoverPassword(emailLimpio);
        setRecoverySuccess(true);
      } catch (err) {
        setRecoveryError('Ocurrió un error al intentar procesar la solicitud.');
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleRecoveryMode = () => {
    setIsRecoveryMode(!isRecoveryMode);
    // Al volver al login, reseteamos todos los estados de recuperación
    if (isRecoveryMode) {
      setRecoveryEmail('');
      setRecoverySuccess(false);
      setRecoveryError('');
    }
  };

  return (
    <div className="auth-container">
      <div className={`login-container ${isRecoveryMode ? 'active' : ''}`}>

        {/* Formulario de Recuperación */}
        <div className="form-container recovery-form">
          {!recoverySuccess ? (
            <form onSubmit={handleRecoverySubmit}>
              <h1>CormedAPP</h1>
              <br />
              <h2>Recuperar contraseña</h2>
              <br />
              <span>Ingresa tu correo electrónico</span>
              <input
                type="email"
                placeholder="ejemplo@correo.com"
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
                required
                disabled={loading}
              />
              
              {/* NUEVO: Mensaje de error renderizado */}
              {recoveryError && (
                <div className="mensaje error" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef5350', fontSize: '13px', marginTop: '10px' }}>
                  <FaExclamationCircle size={16} />
                  <span>{recoveryError}</span>
                </div>
              )}

              <span style={{ marginTop: recoveryError ? '10px' : '0' }}>
                Te enviaremos un enlace para restablecer tu contraseña
              </span>
              <button type="submit" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar enlace'}
              </button>
              <button
                type="button"
                className="btn-link"
                disabled={loading}
                onClick={onForgotEmail}
              >
                ¿No recuerdas tu correo?
              </button>
            </form>
          ) : (
            // --- Vista de éxito: confirmación sin redirigir ---
            <div className="recovery-success">
              <h1>CormedAPP</h1>
              <br />
              <div className="success-icon"><FaEnvelope /></div>
              <h2>¡Enlace enviado!</h2>
              <p>
                Revisa tu bandeja de entrada en <strong>{recoveryEmail}</strong> y haz clic en
                el enlace para restablecer tu contraseña.
              </p>
              <p className="texto-secundario">
                ¿No ves el correo? Revisa tu carpeta de spam.
              </p>
              <button
                type="button"
                className="btn-link"
                onClick={toggleRecoveryMode}
              >
                Volver al inicio de sesión
              </button>
            </div>
          )}
        </div>

        {/* Formulario de Login */}
        <div className="form-container login-form">
          <form onSubmit={handleLoginSubmit}>
            <h1>CormedAPP</h1>
            <br />
            <h2>Iniciar Sesión</h2>
            <br />
            <span>Ingrese su correo</span>
            <input
              type="email"
              placeholder="Email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              required
              disabled={loading}
            />
            <span>Ingrese su contraseña</span>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                disabled={loading}
              />
              <button
                type="button"
                className="btn-ver-password"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        {/* Panel de Toggle */}
        <div className="toggle-container">
          <div className="toggle">
            <div className="toggle-panel toggle-left">
              <h1>¡Bienvenido!</h1>
              <p>Presione para volver a iniciar sesión</p>
              <button className="hidden" type="button" onClick={toggleRecoveryMode} disabled={loading}>
                Volver
              </button>
            </div>
            <div className="toggle-panel toggle-right">
              <h1>¿Olvidaste tu contraseña?</h1>
              <p>Presione el botón para recuperar tu cuenta</p>
              <button className="hidden" type="button" onClick={toggleRecoveryMode} disabled={loading}>
                Recuperar
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;