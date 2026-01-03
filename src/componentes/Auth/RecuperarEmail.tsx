import React, { useState } from 'react';
import './RecuperarEmail.css';

interface RecuperarEmailProps {
  onVolver?: () => void;
  onBuscarEmail?: (nombre: string, telefono: string) => Promise<string | null>;
}

const RecuperarEmail: React.FC<RecuperarEmailProps> = ({ 
  onVolver,
  onBuscarEmail 
}) => {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [emailEncontrado, setEmailEncontrado] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensaje('');
    setEmailEncontrado(null);

    try {
      if (onBuscarEmail) {
        const email = await onBuscarEmail(nombre, telefono);
        
        if (email) {
          setEmailEncontrado(email);
          setMensaje('✅ ¡Encontramos tu cuenta!');
        } else {
          setMensaje('❌ No se encontró una cuenta con esos datos. Verifica tu información.');
        }
      } else {
        // Simulación sin backend
        setTimeout(() => {
          // Simular encontrar email
          const emailSimulado = 'usuario@ejemplo.com';
          setEmailEncontrado(emailSimulado);
          setMensaje('✅ ¡Encontramos tu cuenta!');
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

  const formatearTelefono = (valor: string) => {
    // Permitir solo números
    const numeros = valor.replace(/\D/g, '');
    setTelefono(numeros);
  };

  return (
    <div className="recuperar-email-container">
      <div className="recuperar-email-card">
        <div className="recuperar-email-header">
          <h1>CormedAPP</h1>
          <h2>Recuperar Correo</h2>
        </div>

        <form onSubmit={handleSubmit} className="recuperar-email-form">
          <p className="recuperar-email-instrucciones">
            Ingresa tu nombre completo y número de teléfono registrado para encontrar tu cuenta.
          </p>
          
          <div className="form-group">
            <label htmlFor="nombre">Nombre Completo</label>
            <input
              type="text"
              id="nombre"
              placeholder="Ingresa tu nombre completo"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="telefono">Número de Teléfono</label>
            <input
              type="tel"
              id="telefono"
              placeholder="3001234567"
              value={telefono}
              onChange={(e) => formatearTelefono(e.target.value)}
              required
              disabled={loading}
              maxLength={10}
            />
            <span className="input-ayuda">Ingresa 10 dígitos sin espacios ni guiones</span>
          </div>

          {mensaje && (
            <div className={`mensaje ${mensaje.includes('✅') ? 'exito' : 'error'}`}>
              {mensaje}
            </div>
          )}

          {emailEncontrado && (
            <div className="email-encontrado">
              <p className="email-encontrado-titulo">Tu correo electrónico es:</p>
              <div className="email-mostrar">
                <span className="icono-email">📧</span>
                <strong>{emailEncontrado}</strong>
              </div>
              <p className="email-encontrado-nota">
                Usa este correo para recuperar tu contraseña
              </p>
            </div>
          )}

          <button 
            type="submit" 
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Buscando...' : 'Buscar Cuenta'}
          </button>

          <div className="recuperar-email-links">
            <button 
              type="button" 
              onClick={onVolver}
              className="btn-link"
            >
              Volver atrás
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecuperarEmail;