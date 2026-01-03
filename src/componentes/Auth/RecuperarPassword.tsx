import React, { useState } from 'react';
import './RecuperarPassword.css';

interface RecuperarPasswordProps {
  onVolver?: () => void;
  onRecuperarEmail?: () => void;
  onEnviarEnlace?: (email: string) => Promise<boolean>;
}

const RecuperarPassword: React.FC<RecuperarPasswordProps> = ({ 
  onVolver, 
  onRecuperarEmail,
  onEnviarEnlace 
}) => {
  const [email, setEmail] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensaje('');

    try {
      // Simular envío de email (aquí irá tu lógica real)
      if (onEnviarEnlace) {
        const exito = await onEnviarEnlace(email);
        
        if (exito) {
          setEnviado(true);
          setMensaje('✅ Se ha enviado un enlace de recuperación a tu correo electrónico.');
        } else {
          setMensaje('❌ No se encontró una cuenta con ese correo electrónico.');
        }
      } else {
        // Simulación sin backend
        setTimeout(() => {
          setEnviado(true);
          setMensaje('✅ Se ha enviado un enlace de recuperación a tu correo electrónico.');
          setLoading(false);
        }, 1500);
        return;
      }
    } catch (error) {
      setMensaje('❌ Ocurrió un error. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="recuperar-container">
      <div className="recuperar-card">
        <div className="recuperar-header">
          <h1>CormedAPP</h1>
          <h2>Recuperar Contraseña</h2>
        </div>

        {!enviado ? (
          <form onSubmit={handleSubmit} className="recuperar-form">
            <p className="recuperar-instrucciones">
              Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
            </p>
            
            <div className="form-group">
              <label htmlFor="email">Correo Electrónico</label>
              <input
                type="email"
                id="email"
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {mensaje && (
              <div className={`mensaje ${mensaje.includes('✅') ? 'exito' : 'error'}`}>
                {mensaje}
              </div>
            )}

            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Enviando...' : 'Enviar Enlace'}
            </button>

            <div className="recuperar-links">
              <button 
                type="button" 
                onClick={onRecuperarEmail}
                className="btn-link"
              >
                ¿No recuerdas tu correo?
              </button>
              
              <button 
                type="button" 
                onClick={onVolver}
                className="btn-link"
              >
                Volver al inicio
              </button>
            </div>
          </form>
        ) : (
          <div className="recuperar-exito">
            <div className="icono-exito">✉️</div>
            <h3>¡Enlace Enviado!</h3>
            <p>
              Revisa tu bandeja de entrada y haz clic en el enlace que te enviamos para restablecer tu contraseña.
            </p>
            <p className="texto-secundario">
              Si no ves el correo, revisa tu carpeta de spam o correo no deseado.
            </p>
            
            <button 
              onClick={onVolver}
              className="btn-primary"
            >
              Volver al inicio
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecuperarPassword;