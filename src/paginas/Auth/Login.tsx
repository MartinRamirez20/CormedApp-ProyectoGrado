import React, { useState } from 'react';
import './Login.css';

interface LoginProps {
  onLogin?: (email: string, password: string) => Promise<void> | void;
  onRecoverPassword?: (email: string) => Promise<void> | void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onRecoverPassword }) => {
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [loading, setLoading] = useState(false); // Estado para manejar la espera
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');

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
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleRecoveryMode = () => {
    setIsRecoveryMode(!isRecoveryMode);
  };

  return (
    <div className="auth-container">
      <div className={`login-container ${isRecoveryMode ? 'active' : ''}`}>
        
        {/* Formulario de Recuperación */}
        <div className="form-container recovery-form">
          <form onSubmit={handleRecoverySubmit}>
            <h1>CormedAPP</h1>
            <br />
            <h2>Recuperación</h2>
            <br />
            <span>Coloca tu correo</span>
            <input
              type="email"
              placeholder="Email"
              value={recoveryEmail}
              onChange={(e) => setRecoveryEmail(e.target.value)}
              required
              disabled={loading}
            />
            <span>Se enviará un enlace de recuperación al correo ingresado</span>
            <button type="submit" disabled={loading}>
              {loading ? 'Procesando...' : 'Recuperar'}
            </button>
            <button type="button" className="btn-link" disabled={loading}>
              ¿No recuerdas tu correo?
            </button>
          </form>
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