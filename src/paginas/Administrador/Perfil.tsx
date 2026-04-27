import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabase.ts';
import './Perfil.css';

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
    correo: '',
    telefono: '',
    tipo_identificacion: 'CC',
    numero_identificacion: '',
  });

  const [form, setForm] = useState<PerfilData>({ ...datos });
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [guardandoPassword, setGuardandoPassword] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [mensajeDatos, setMensajeDatos] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [mensajePassword, setMensajePassword] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

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
        const perfil: PerfilData = {
          nombre_razon_social:  data.nombre_razon_social  ?? '',
          correo:               data.correo               ?? '',
          telefono:             data.telefono             ?? '',
          tipo_identificacion:  (data.tipo_identificacion as TipoId) ?? 'CC',
          numero_identificacion: data.numero_identificacion ?? '',
        };
        setDatos(perfil);
        setForm(perfil);
      }
      setCargando(false);
    };
    cargar();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // ── Guardar datos personales ──────────────────────────────────────────────
  const handleGuardarDatos = async () => {
    setGuardando(true);
    setMensajeDatos(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Actualizar tabla public.usuarios
    const { error: errorPublic } = await supabase
      .from('usuarios')
      .update({
        nombre_razon_social:   form.nombre_razon_social,
        telefono:              form.telefono,
        tipo_identificacion:   form.tipo_identificacion,
        numero_identificacion: form.numero_identificacion,
        fecha_actualizacion:   new Date().toISOString(),
      })
      .eq('id', user.id);

    if (errorPublic) {
      setMensajeDatos({ tipo: 'error', texto: `Error al guardar: ${errorPublic.message}` });
      setGuardando(false);
      return;
    }

    // 2. Si cambió el correo, actualizar también en Auth
    if (form.correo !== datos.correo) {
      const { error: errorAuth } = await supabase.auth.updateUser({ email: form.correo });
      if (errorAuth) {
        setMensajeDatos({ tipo: 'error', texto: `Datos guardados, pero error al cambiar correo: ${errorAuth.message}` });
        setGuardando(false);
        return;
      }

      // Actualizar correo también en public.usuarios
      await supabase.from('usuarios').update({ correo: form.correo }).eq('id', user.id);
    }

    setDatos({ ...form });
    setMensajeDatos({ tipo: 'ok', texto: '¡Datos actualizados correctamente!' });
    setGuardando(false);
  };

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
        <p className="perfil-subtitle">Administra tu información personal</p>
      </div>

      <div className="perfil-grid">

        {/* ── Datos personales ── */}
        <div className="dash-card perfil-card">
          <h5 className="dash-card-title">Datos Personales</h5>

          <div className="perfil-campo">
            <label>Nombre</label>
            <input
              name="nombre_razon_social"
              value={form.nombre_razon_social}
              onChange={handleChange}
              placeholder="Tu nombre completo"
            />
          </div>

          <div className="perfil-campo">
            <label>Correo Electrónico</label>
            <input
              name="correo"
              type="email"
              value={form.correo}
              onChange={handleChange}
              placeholder="correo@ejemplo.com"
            />
            {form.correo !== datos.correo && (
              <span className="perfil-aviso">
                Se enviará un enlace de confirmación al nuevo correo.
              </span>
            )}
          </div>

          <div className="perfil-campo">
            <label>Teléfono</label>
            <input
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
              placeholder="3001234567"
            />
          </div>

          <div className="perfil-fila">
            <div className="perfil-campo">
              <label>Tipo de Identificación</label>
              <select name="tipo_identificacion" value={form.tipo_identificacion} onChange={handleChange}>
                <option value="CC">CC</option>
                <option value="NIT">NIT</option>
                <option value="PASAPORTE">Pasaporte</option>
                <option value="CE">CE</option>
              </select>
            </div>
            <div className="perfil-campo">
              <label>Número de Identificación</label>
              <input
                name="numero_identificacion"
                value={form.numero_identificacion}
                onChange={handleChange}
                placeholder="123456789"
              />
            </div>
          </div>

          {mensajeDatos && (
            <p className={`perfil-mensaje ${mensajeDatos.tipo === 'ok' ? 'perfil-ok' : 'perfil-error'}`}>
              {mensajeDatos.texto}
            </p>
          )}

          <button className="perfil-btn-guardar" onClick={handleGuardarDatos} disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar Cambios'}
          </button>
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

          <button className="perfil-btn-guardar" onClick={handleCambiarPassword} disabled={guardandoPassword}>
            {guardandoPassword ? 'Actualizando...' : 'Cambiar Contraseña'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Perfil;