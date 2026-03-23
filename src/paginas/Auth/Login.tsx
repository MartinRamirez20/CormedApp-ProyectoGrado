import React, { useState } from 'react';
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
  // NUEVO: estado para saber si el enlace ya fue enviado exitosamente
  const [recoverySuccess, setRecoverySuccess] = useState(false);

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
    if (onRecoverPassword) {
      setLoading(true);
      try {
        await onRecoverPassword(recoveryEmail);
        // Si llega aquí sin error, consideramos que fue exitoso
        setRecoverySuccess(true);
      } catch {
        // El componente padre puede manejar el error con un toast/alerta
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleRecoveryMode = () => {
    setIsRecoveryMode(!isRecoveryMode);
    // Al volver al login, reseteamos el estado de recuperación
    if (isRecoveryMode) {
      setRecoveryEmail('');
      setRecoverySuccess(false);
    }
  };

  return (
    <div className="auth-container">
      <div className={`login-container ${isRecoveryMode ? 'active' : ''}`}>

        {/* Formulario de Recuperación */}
        <div className="form-container recovery-form">
          {!recoverySuccess ? (
            // --- Vista normal: pedir correo ---
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
              <span>Te enviaremos un enlace para restablecer tu contraseña</span>
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
              <div className="success-icon">✉️</div>
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

        {/* Formulario de Login — sin cambios */}
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
            <input
              type="password"
              placeholder="Password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
              disabled={loading}
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        {/* Panel de Toggle — sin cambios */}
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