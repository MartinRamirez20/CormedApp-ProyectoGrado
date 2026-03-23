import React, { useState } from 'react';
import './RecuperarEmail.css';

interface RecuperarEmailProps {
  onVolver?: () => void;
  onBuscarEmail?: (nombre: string, telefono: string) => Promise<string | null>;
}

const RecuperarEmail: React.FC<RecuperarEmailProps> = ({
  onVolver,
  onBuscarEmail,
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
          setMensaje('❌ No encontramos una cuenta con esos datos. Verifica tu nombre y teléfono.');
        }
      }
    } catch (error) {
      setMensaje('❌ Ocurrió un error. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const formatearTelefono = (valor: string) => {
    // Solo permite dígitos
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
            <label htmlFor="nombre">Nombre completo</label>
            <input
              type="text"
              id="nombre"
              placeholder="Tal como fue registrado en el sistema"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="telefono">Número de teléfono</label>
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
            <span className="input-ayuda">10 dígitos, sin espacios ni guiones</span>
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
                Usa este correo para iniciar sesión o recuperar tu contraseña.
              </p>
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Buscando...' : 'Buscar cuenta'}
          </button>

          <div className="recuperar-email-links">
            <button
              type="button"
              onClick={onVolver}
              className="btn-link"
            >
              Volver al inicio de sesión
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecuperarEmail;