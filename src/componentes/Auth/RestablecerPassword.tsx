import React, { useState } from 'react';
import './RestablecerPassword.css';

interface RestablecerPasswordProps {
  token?: string; // Token del enlace de recuperación
  onRestablecer?: (nuevaPassword: string, token: string) => Promise<boolean>;
  onVolver?: () => void;
}

const RestablecerPassword: React.FC<RestablecerPasswordProps> = ({ 
  token = '',
  onRestablecer,
  onVolver 
}) => {
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);
  const [exito, setExito] = useState(false);

  const validarPassword = (): string | null => {
    if (nuevaPassword.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres';
    }
    
    if (nuevaPassword !== confirmarPassword) {
      return 'Las contraseñas no coinciden';
    }
    
    // Validar que tenga al menos una letra y un número
    const tieneLetra = /[a-zA-Z]/.test(nuevaPassword);
    const tieneNumero = /[0-9]/.test(nuevaPassword);
    
    if (!tieneLetra || !tieneNumero) {
      return 'La contraseña debe contener letras y números';
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje('');
    
    const error = validarPassword();
    if (error) {
      setMensaje(`❌ ${error}`);
      return;
    }

    setLoading(true);

    try {
      if (onRestablecer) {
        const resultado = await onRestablecer(nuevaPassword, token);
        
        if (resultado) {
          setExito(true);
          setMensaje('✅ ¡Contraseña restablecida exitosamente!');
        } else {
          setMensaje('❌ El enlace ha expirado o es inválido. Solicita uno nuevo.');
        }
      } else {
        // Simulación sin backend
        setTimeout(() => {
          setExito(true);
          setMensaje('✅ ¡Contraseña restablecida exitosamente!');
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

  const calcularFortaleza = (): { nivel: number; texto: string; color: string } => {
    let nivel = 0;
    
    if (nuevaPassword.length >= 8) nivel++;
    if (nuevaPassword.length >= 12) nivel++;
    if (/[a-z]/.test(nuevaPassword) && /[A-Z]/.test(nuevaPassword)) nivel++;
    if (/[0-9]/.test(nuevaPassword)) nivel++;
    if (/[^a-zA-Z0-9]/.test(nuevaPassword)) nivel++;
    
    if (nivel <= 2) return { nivel: 1, texto: 'Débil', color: '#ef5350' };
    if (nivel <= 3) return { nivel: 2, texto: 'Media', color: '#ff9800' };
    return { nivel: 3, texto: 'Fuerte', color: '#4caf50' };
  };

  const fortaleza = nuevaPassword ? calcularFortaleza() : null;

  if (exito) {
    return (
      <div className="restablecer-container">
        <div className="restablecer-card">
          <div className="restablecer-exito">
            <div className="icono-exito">🎉</div>
            <h2>¡Contraseña Actualizada!</h2>
            <p>Tu contraseña ha sido restablecida exitosamente.</p>
            <p className="texto-secundario">
              Ya puedes iniciar sesión con tu nueva contraseña.
            </p>
            
            <button 
              onClick={onVolver}
              className="btn-primary"
            >
              Ir a Iniciar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="restablecer-container">
      <div className="restablecer-card">
        <div className="restablecer-header">
          <h1>CormedAPP</h1>
          <h2>Nueva Contraseña</h2>
        </div>

        <form onSubmit={handleSubmit} className="restablecer-form">
          <p className="restablecer-instrucciones">
            Ingresa tu nueva contraseña. Debe tener al menos 8 caracteres e incluir letras y números.
          </p>
          
          <div className="form-group">
            <label htmlFor="nuevaPassword">Nueva Contraseña</label>
            <div className="password-input-wrapper">
              <input
                type={mostrarPassword ? 'text' : 'password'}
                id="nuevaPassword"
                placeholder="Ingresa tu nueva contraseña"
                value={nuevaPassword}
                onChange={(e) => setNuevaPassword(e.target.value)}
                required
                disabled={loading}
              />
              <button
                type="button"
                className="btn-toggle-password"
                onClick={() => setMostrarPassword(!mostrarPassword)}
                tabIndex={-1}
              >
                {mostrarPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            
            {fortaleza && (
              <div className="fortaleza-container">
                <div className="fortaleza-barra">
                  <div 
                    className="fortaleza-progreso"
                    style={{ 
                      width: `${(fortaleza.nivel / 3) * 100}%`,
                      backgroundColor: fortaleza.color
                    }}
                  />
                </div>
                <span 
                  className="fortaleza-texto"
                  style={{ color: fortaleza.color }}
                >
                  {fortaleza.texto}
                </span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmarPassword">Confirmar Contraseña</label>
            <input
              type={mostrarPassword ? 'text' : 'password'}
              id="confirmarPassword"
              placeholder="Confirma tu nueva contraseña"
              value={confirmarPassword}
              onChange={(e) => setConfirmarPassword(e.target.value)}
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
            {loading ? 'Restableciendo...' : 'Restablecer Contraseña'}
          </button>

          <div className="restablecer-links">
            <button 
              type="button" 
              onClick={onVolver}
              className="btn-link"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RestablecerPassword;