import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabase.ts';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import './Perfil.css';

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
    correo: '',
    telefono: '',
    tipo_identificacion: 'CC',
    numero_identificacion: '',
    rol_id: 1,
  });

  const [form, setForm] = useState<PerfilData>({ ...datos });
  const [roles, setRoles] = useState<Rol[]>([]); // Añadido para cargar roles
  
  // Estados para la contraseña
  const [passwordActual, setPasswordActual] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  
  const [guardando, setGuardando] = useState(false);
  const [guardandoPassword, setGuardandoPassword] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [mensajeDatos, setMensajeDatos] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [mensajePassword, setMensajePassword] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  
  // Mostrar/Ocultar contraseñas
  const [showPasswordActual, setShowPasswordActual] = useState(false);
  const [showNuevaPassword, setShowNuevaPassword] = useState(false);
  const [showConfirmarPassword, setShowConfirmarPassword] = useState(false);

  // ── Cargar datos del usuario y roles ──────────────────────────────────────
  useEffect(() => {
    const cargar = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Cargar roles
      const { data: rolesData } = await supabase.from('roles').select('id, nombre');
      if (rolesData) setRoles(rolesData);

      const { data, error } = await supabase
        .from('usuarios')
        .select('nombre_razon_social, correo, telefono, tipo_identificacion, numero_identificacion, rol_id')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        const perfil: PerfilData = {
          nombre_razon_social:  data.nombre_razon_social  ?? '',
          correo:               data.correo               ?? '',
          telefono:             data.telefono             ?? '',
          tipo_identificacion:  (data.tipo_identificacion as TipoId) ?? 'CC',
          numero_identificacion: data.numero_identificacion ?? '',
          rol_id:               data.rol_id               ?? 1,
        };
        setDatos(perfil);
        setForm(perfil);
      }
      setCargando(false);
    };
    cargar();
  }, []);

  // ── Manejar cambios en el formulario con validación de solo números ──────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'telefono' || name === 'numero_identificacion') {
      const soloNumeros = value.replace(/\D/g, '');
      if (soloNumeros.length <= 10) {
        setForm(prev => ({ ...prev, [name]: soloNumeros }));
      }
    } else if (name === 'rol_id') {
      setForm(prev => ({ ...prev, [name]: Number(value) }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  // ── Guardar datos personales ──────────────────────────────────────────────
  const handleGuardarDatos = async () => {
    setGuardando(true);
    setMensajeDatos(null);

    // Validar campos vacíos
    if (!form.nombre_razon_social || !form.correo || !form.telefono || !form.numero_identificacion) {
      setMensajeDatos({ tipo: 'error', texto: 'Todos los campos son obligatorios.' });
      setGuardando(false);
      return;
    }

    // VALIDACIÓN DE LONGITUD: Identificación
    if (form.numero_identificacion.length < 3) {
      setMensajeDatos({ tipo: 'error', texto: 'El número de identificación debe tener entre 3 y 10 dígitos.' });
      setGuardando(false);
      return;
    }

    // Validar formato de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.correo)) {
      setMensajeDatos({ tipo: 'error', texto: 'El formato del correo electrónico no es válido.' });
      setGuardando(false);
      return;
    }

    // --- REGLA DE NEGOCIO: Evitar quedarse sin administradores ---
    if (form.rol_id !== datos.rol_id) {
      const rolAntiguo = roles.find(r => r.id === datos.rol_id);
      if (rolAntiguo?.nombre.toLowerCase() === 'administrador') {
        const { count, error: countError } = await supabase
          .from('usuarios')
          .select('id', { count: 'exact', head: true })
          .eq('rol_id', datos.rol_id); 
          
        if (countError) {
          setMensajeDatos({ tipo: 'error', texto: 'Error al verificar los permisos del sistema.' });
          setGuardando(false);
          return;
        }

        if (count !== null && count <= 1) {
          setMensajeDatos({ tipo: 'error', texto: 'Acción denegada: No puedes cambiar tu rol porque eres el único Administrador.' });
          setGuardando(false);
          return;
        }
      }
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: errorPublic } = await supabase
      .from('usuarios')
      .update({
        nombre_razon_social:   form.nombre_razon_social,
        correo:                form.correo,
        telefono:              form.telefono,
        tipo_identificacion:   form.tipo_identificacion,
        numero_identificacion: form.numero_identificacion,
        rol_id:                form.rol_id, // Guardar el rol
        fecha_actualizacion:   new Date().toISOString(),
      })
      .eq('id', user.id);

    if (errorPublic) {
      if (errorPublic.code === '23505') {
        setMensajeDatos({ tipo: 'error', texto: 'Error: Este correo electrónico o número de identificación ya está en uso por otra persona.' });
      } else {
        setMensajeDatos({ tipo: 'error', texto: `Error al guardar: ${errorPublic.message}` });
      }
      setGuardando(false);
      return;
    }

    setDatos({ ...form });
    setMensajeDatos({ tipo: 'ok', texto: '¡Datos actualizados correctamente!' });
    
    // Si cambió de rol, recargamos para actualizar menús
    if (form.rol_id !== datos.rol_id) {
        setTimeout(() => window.location.reload(), 2000); 
    }

    setGuardando(false);
  };

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

    if (!passwordActual) {
      setMensajePassword({ tipo: 'error', texto: 'Debes ingresar tu contraseña actual.' });
      return;
    }

    const errorReglas = validarReglasPassword(nuevaPassword);
    if (errorReglas) {
      setMensajePassword({ tipo: 'error', texto: errorReglas });
      return;
    }

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

    const { error: errorVerificacion } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: passwordActual,
    });

    if (errorVerificacion) {
      setMensajePassword({ tipo: 'error', texto: 'La contraseña actual es incorrecta.' });
      setGuardandoPassword(false);
      return;
    }

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

  return (
    <div className="perfil-page">
      <div className="perfil-header">
        <h2 className="perfil-title">Mi Perfil</h2>
        <p className="perfil-subtitle">Administra tu información personal y seguridad</p>
      </div>

      <div className="perfil-grid">

        {/* ── Datos personales ── */}
        <div className="dash-card perfil-card">
          <h5 className="dash-card-title">Datos Personales</h5>

          <div className="perfil-campo">
            <label>Nombre o Razón Social</label>
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
              type="text"
              value={form.telefono}
              onChange={handleChange}
              placeholder="Ej: 3001234567"
            />
          </div>

          <div className="perfil-fila">
            <div className="perfil-campo">
              <label>Tipo de Id.</label>
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
                type="text"
                value={form.numero_identificacion}
                onChange={handleChange}
                placeholder="Ej: 123456789"
              />
            </div>
          </div>

          {/* NUEVO CAMPO: ROL */}
          <div className="perfil-campo">
            <label>Rol en el sistema</label>
            <select name="rol_id" value={form.rol_id} onChange={handleChange}>
              {roles.map((rol) => (
                <option key={rol.id} value={rol.id}>
                  {rol.nombre.charAt(0).toUpperCase() + rol.nombre.slice(1)}
                </option>
              ))}
            </select>
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
            <label>Confirmar Nueva Contraseña</label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmarPassword ? "text" : "password"}
                value={confirmarPassword}
                onChange={e => setConfirmarPassword(e.target.value)}
                placeholder="Repite la nueva contraseña"
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

          <button className="perfil-btn-guardar" onClick={handleCambiarPassword} disabled={guardandoPassword}>
            {guardandoPassword ? 'Actualizando...' : 'Cambiar Contraseña'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Perfil;