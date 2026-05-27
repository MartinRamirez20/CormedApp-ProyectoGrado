import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabase.ts';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import '../Administrador/Perfil.css';

type TipoId = 'CC' | 'NIT' | 'PASAPORTE' | 'CE';

interface PerfilData {
  nombre_razon_social: string;
  correo: string;
  telefono: string;
  tipo_identificacion: TipoId;
  numero_identificacion: string;
  rol_id: number; // Añadido
}

interface Rol {
  id: number;
  nombre: string;
}

const Perfil: React.FC = () => {
  const [datos, setDatos] = useState<PerfilData>({
    nombre_razon_social: '',
    correo:              '',
    telefono:            '',
    tipo_identificacion: 'CC',
    numero_identificacion: '',
    rol_id: 1,
  });

  const [roles, setRoles] = useState<Rol[]>([]); // Añadido para mostrar el nombre del rol

  // Estados para la contraseña
  const [passwordActual, setPasswordActual] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  
  const [guardandoPassword, setGuardandoPassword] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [mensajePassword, setMensajePassword] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  // Estados para mostrar/ocultar contraseñas
  const [showPasswordActual, setShowPasswordActual] = useState(false);
  const [showNuevaPassword, setShowNuevaPassword] = useState(false);
  const [showConfirmarPassword, setShowConfirmarPassword] = useState(false);

  // ── Cargar datos del usuario y roles ──────────────────────────────────────
  useEffect(() => {
    const cargar = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Cargar los roles para saber el nombre de su rol
      const { data: rolesData } = await supabase.from('roles').select('id, nombre');
      if (rolesData) setRoles(rolesData);

      const { data, error } = await supabase
        .from('usuarios')
        .select('nombre_razon_social, correo, telefono, tipo_identificacion, numero_identificacion, rol_id')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setDatos({
          nombre_razon_social:   data.nombre_razon_social   ?? '',
          correo:                data.correo                ?? '',
          telefono:              data.telefono              ?? '',
          tipo_identificacion:   (data.tipo_identificacion as TipoId) ?? 'CC',
          numero_identificacion: data.numero_identificacion ?? '',
          rol_id:                data.rol_id                ?? 1,
        });
      }
      setCargando(false);
    };
    cargar();
  }, []);

  // ── Validaciones de Contraseña ────────────────────────────────────────────
  const validarReglasPassword = (pass: string): string | null => {
    if (pass.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
    if (!/[A-Z]/.test(pass)) return 'Debe contener al menos una letra mayúscula.';
    if (!/[0-9]/.test(pass)) return 'Debe contener al menos un número.';
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(pass)) return 'Debe contener al menos un símbolo especial.';
    return null;
  };

  // ── Cambiar contraseña ────────────────────────────────────────────────────
  const handleCambiarPassword = async () => {
    setMensajePassword(null);

    // 1. Validar campos vacíos
    if (!passwordActual) {
      setMensajePassword({ tipo: 'error', texto: 'Debes ingresar tu contraseña actual.' });
      return;
    }

    // 2. Validar reglas
    const errorReglas = validarReglasPassword(nuevaPassword);
    if (errorReglas) {
      setMensajePassword({ tipo: 'error', texto: errorReglas });
      return;
    }

    // 3. Validar coincidencia
    if (nuevaPassword !== confirmarPassword) {
      setMensajePassword({ tipo: 'error', texto: 'Las contraseñas nuevas no coinciden.' });
      return;
    }

    setGuardandoPassword(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.email) {
      setMensajePassword({ tipo: 'error', texto: 'Error obteniendo la sesión del usuario.' });
      setGuardandoPassword(false);
      return;
    }

    // 4. Verificación de contraseña actual
    const { error: errorVerificacion } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: passwordActual,
    });

    if (errorVerificacion) {
      setMensajePassword({ tipo: 'error', texto: 'La contraseña actual es incorrecta.' });
      setGuardandoPassword(false);
      return;
    }

    // 5. Actualizar la contraseña
    const { error: errorActualizacion } = await supabase.auth.updateUser({ password: nuevaPassword });

    if (errorActualizacion) {
      setMensajePassword({ tipo: 'error', texto: `Error al actualizar: ${errorActualizacion.message}` });
    } else {
      setMensajePassword({ tipo: 'ok', texto: '¡Contraseña actualizada de forma segura!' });
      setPasswordActual('');
      setNuevaPassword('');
      setConfirmarPassword('');
    }
    setGuardandoPassword(false);
  };

  if (cargando) return <div className="perfil-cargando">Cargando perfil...</div>;

  // Obtener el nombre del rol para mostrarlo de forma legible
  const nombreRol = roles.find(r => r.id === datos.rol_id)?.nombre || '';
  const rolCapitalizado = nombreRol ? nombreRol.charAt(0).toUpperCase() + nombreRol.slice(1) : '—';

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
            { label: 'Rol en el sistema',     valor: rolCapitalizado }, // NUEVO CAMPO DE ROL
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
            <label>Contraseña Actual</label>
            <div className="password-input-wrapper">
              <input
                type={showPasswordActual ? "text" : "password"}
                value={passwordActual}
                onChange={e => setPasswordActual(e.target.value)}
                placeholder="Ingresa tu contraseña actual"
              />
              <button
                type="button"
                className="btn-ver-password"
                onClick={() => setShowPasswordActual(!showPasswordActual)}
              >
                {showPasswordActual ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className="perfil-campo">
            <label>Nueva Contraseña</label>
            <div className="password-input-wrapper">
              <input
                type={showNuevaPassword ? "text" : "password"}
                value={nuevaPassword}
                onChange={e => setNuevaPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres, 1 mayúscula, 1 número y 1 símbolo"
              />
              <button
                type="button"
                className="btn-ver-password"
                onClick={() => setShowNuevaPassword(!showNuevaPassword)}
              >
                {showNuevaPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className="perfil-campo">
            <label>Confirmar Contraseña</label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmarPassword ? "text" : "password"}
                value={confirmarPassword}
                onChange={e => setConfirmarPassword(e.target.value)}
                placeholder="Repite la contraseña"
              />
              <button
                type="button"
                className="btn-ver-password"
                onClick={() => setShowConfirmarPassword(!showConfirmarPassword)}
              >
                {showConfirmarPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
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