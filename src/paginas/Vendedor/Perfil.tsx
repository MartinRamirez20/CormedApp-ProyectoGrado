import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabase.ts';
import '../Administrador/Perfil.css';

type TipoId = 'CC' | 'NIT' | 'PASAPORTE' | 'CE';

interface PerfilData {
  nombre_razon_social: string;
  correo: string;
  telefono: string;
  tipo_identificacion: TipoId;
  numero_identificacion: string;
}

const Perfil: React.FC = () => {
  const [datos, setDatos] = useState<PerfilData>({
    nombre_razon_social: '',
    correo:              '',
    telefono:            '',
    tipo_identificacion: 'CC',
    numero_identificacion: '',
  });

  const [nuevaPassword,    setNuevaPassword]    = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [guardandoPassword, setGuardandoPassword] = useState(false);
  const [cargando,          setCargando]          = useState(true);
  const [mensajePassword,   setMensajePassword]   = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  // ── Cargar datos del usuario ──────────────────────────────────────────────
  useEffect(() => {
    const cargar = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('usuarios')
        .select('nombre_razon_social, correo, telefono, tipo_identificacion, numero_identificacion')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setDatos({
          nombre_razon_social:   data.nombre_razon_social   ?? '',
          correo:                data.correo                ?? '',
          telefono:              data.telefono              ?? '',
          tipo_identificacion:   (data.tipo_identificacion as TipoId) ?? 'CC',
          numero_identificacion: data.numero_identificacion ?? '',
        });
      }
      setCargando(false);
    };
    cargar();
  }, []);

  // ── Cambiar contraseña ────────────────────────────────────────────────────
  const handleCambiarPassword = async () => {
    setMensajePassword(null);

    if (nuevaPassword.length < 6) {
      setMensajePassword({ tipo: 'error', texto: 'La contraseña debe tener al menos 6 caracteres.' });
      return;
    }
    if (nuevaPassword !== confirmarPassword) {
      setMensajePassword({ tipo: 'error', texto: 'Las contraseñas no coinciden.' });
      return;
    }

    setGuardandoPassword(true);
    const { error } = await supabase.auth.updateUser({ password: nuevaPassword });

    if (error) {
      setMensajePassword({ tipo: 'error', texto: `Error: ${error.message}` });
    } else {
      setMensajePassword({ tipo: 'ok', texto: '¡Contraseña actualizada correctamente!' });
      setNuevaPassword('');
      setConfirmarPassword('');
    }
    setGuardandoPassword(false);
  };

  if (cargando) return <div className="perfil-cargando">Cargando perfil...</div>;

  return (
    <div className="perfil-page">
      <div className="perfil-header">
        <h2 className="perfil-title">Mi Perfil</h2>
        <p className="perfil-subtitle">Información de tu cuenta</p>
      </div>

      <div className="perfil-grid">

        {/* ── Datos personales — solo lectura ── */}
        <div className="dash-card perfil-card">
          <h5 className="dash-card-title">Datos Personales</h5>
          <p style={{ fontSize: '12px', color: '#888', margin: '-8px 0 8px' }}>
            Para modificar tus datos contacta a un administrador.
          </p>

          {[
            { label: 'Nombre / Razón Social', valor: datos.nombre_razon_social },
            { label: 'Correo Electrónico',    valor: datos.correo },
            { label: 'Teléfono',              valor: datos.telefono || '—' },
            { label: 'Tipo de Identificación',valor: datos.tipo_identificacion },
            { label: 'Número de Identificación', valor: datos.numero_identificacion },
          ].map(({ label, valor }) => (
            <div className="perfil-campo" key={label}>
              <label>{label}</label>
              <input value={valor} readOnly style={{ cursor: 'not-allowed', opacity: 0.7 }} />
            </div>
          ))}
        </div>

        {/* ── Cambiar contraseña ── */}
        <div className="dash-card perfil-card">
          <h5 className="dash-card-title">Cambiar Contraseña</h5>

          <div className="perfil-campo">
            <label>Nueva Contraseña</label>
            <input
              type="password"
              value={nuevaPassword}
              onChange={e => setNuevaPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div className="perfil-campo">
            <label>Confirmar Contraseña</label>
            <input
              type="password"
              value={confirmarPassword}
              onChange={e => setConfirmarPassword(e.target.value)}
              placeholder="Repite la contraseña"
            />
          </div>

          {mensajePassword && (
            <p className={`perfil-mensaje ${mensajePassword.tipo === 'ok' ? 'perfil-ok' : 'perfil-error'}`}>
              {mensajePassword.texto}
            </p>
          )}

          <button
            className="perfil-btn-guardar"
            onClick={handleCambiarPassword}
            disabled={guardandoPassword}
          >
            {guardandoPassword ? 'Actualizando...' : 'Cambiar Contraseña'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Perfil;