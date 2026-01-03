import React, { useState } from 'react';
import './Login.css';

interface LoginProps {
  onLogin?: (email: string, password: string) => void;
  onRecoverPassword?: (email: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onRecoverPassword }) => {
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onLogin) {
      onLogin(loginEmail, loginPassword);
    }
  };

  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onRecoverPassword) {
      onRecoverPassword(recoveryEmail);
    }
  };

  const toggleRecoveryMode = () => {
    setIsRecoveryMode(!isRecoveryMode);
  };

  return (
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
          />
          <span>Se asignará una nueva contraseña en el correo ingresado</span>
          <button type="submit">Recuperar</button>
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
          />
          <span>Ingrese su contraseña</span>
          <input
            type="password"
            placeholder="Password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            required
          />
          <button type="submit">Entrar</button>
        </form>
      </div>

      {/* Panel de Toggle */}
      <div className="toggle-container">
        <div className="toggle">
          <div className="toggle-panel toggle-left">
            <h1>Iniciar Sesión</h1>
            <p>Presiona el botón para volver</p>
            <button className="hidden" type="button" onClick={toggleRecoveryMode}>
              Volver
            </button>
          </div>  
          <div className="toggle-panel toggle-right">
            <h1>¿Olvidó su contraseña?</h1>
            <p>Presiona el botón para recuperar tu cuenta</p>
            <button className="hidden" type="button" onClick={toggleRecoveryMode}>
              Recuperar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;