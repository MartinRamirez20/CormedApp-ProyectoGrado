import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../../supabase.ts';
import './Usuarios.css';

// Icons
import { 
  FaEye, 
  FaEdit, 
  FaTrash, 
  FaPlus, 
  FaSortUp, 
  FaSortDown, 
  FaTimes 
} from "react-icons/fa";

interface RolSimple {
  nombre: string;
}

interface Usuario {
  id: string;
  consecutivo: number;
  nombre_razon_social: string;
  correo: string;
  telefono: string;
  tipo_identificacion: string;
  numero_identificacion: string;
  activo: boolean;
  roles: RolSimple | null;
}

interface UsuarioDetalle extends Usuario {}

const REGISTROS_POR_PAGINA = 10;

/* ── Helpers de Validación y Formateo ───────────────────────────────────── */

// Función centralizada para mostrar errores específicos de Usuario
const validarUsuario = (user: any): string | null => {
  if (!user.nombre_razon_social?.trim()) return 'El nombre es obligatorio.';
  
  if (!user.correo?.trim()) return 'El correo electrónico es obligatorio.';
  const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!correoRegex.test(user.correo)) return 'El correo debe tener un formato válido (incluir "@" y ".").';

  // Validación de contraseña (solo si existe en el objeto, como en el caso de creación)
  if (user.hasOwnProperty('password') && (!user.password || user.password.length < 6)) {
    return 'La contraseña debe tener al menos 6 caracteres.';
  }

  const idLimpia = user.numero_identificacion?.trim() || '';
  const soloNumerosId = idLimpia.replace(/-/g, '');
  if (!idLimpia) return 'El número de identificación es obligatorio.';
  if (soloNumerosId.length < 3 || soloNumerosId.length > 10) return 'La identificación debe tener entre 3 y 10 números.';
  if (!/\d/.test(idLimpia)) return 'La identificación debe contener al menos un número.';

  if (user.telefono) {
    if (!/^\d{1,10}$/.test(user.telefono)) return 'El teléfono debe contener solo números (máximo 10).';
  }

  if (!user.rol_id && !user.roles) return 'Debe asignar un rol al usuario.';

  return null;
};

// Función para limpiar la identificación (solo números y un guion)
const limpiarId = (val: string): string => {
  const filtrado = val.replace(/[^\d-]/g, '');
  const partes = filtrado.split('-');
  let final = partes.length > 2 ? partes[0] + '-' + partes.slice(1).join('') : filtrado;
  
  const soloNumeros = final.replace(/-/g, '');
  if (soloNumeros.length > 10) {
    const indiceGuion = final.indexOf('-');
    const limpia = soloNumeros.slice(0, 10);
    if (indiceGuion !== -1) {
      final = limpia.slice(0, indiceGuion) + '-' + limpia.slice(indiceGuion);
    } else {
      final = limpia;
    }
  }
  return final;
};

/* ── Componente ─────────────────────────────────────────────────────────── */
const Usuarios: React.FC = () => {
  const [usuarios, setUsuarios]           = useState<Usuario[]>([]);
  const [filtrados, setFiltrados]         = useState<Usuario[]>([]);
  const [cargando, setCargando]           = useState(true);
  const [busqueda, setBusqueda]           = useState('');
  const [pagina, setPagina]               = useState(1);
  const [modalDetalle, setModalDetalle]   = useState<UsuarioDetalle | null>(null);
  const [modalEditar, setModalEditar]     = useState<UsuarioDetalle | null>(null);
  const [modalEliminar, setModalEliminar] = useState<Usuario | null>(null);
  const [roles, setRoles]                 = useState<{ id: number; nombre: string }[]>([]);
  const [guardando, setGuardando]         = useState(false);
  const [mensaje, setMensaje]             = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [mensajeEliminar, setMensajeEliminar] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  //Link Dashboard
  const location = useLocation(); 
  const navigate = useNavigate();

  //Crear usuarios
  const [modalCrear, setModalCrear] = useState(false);
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre_razon_social:   '',
    correo:                '',
    password:              '',
    telefono:              '',
    tipo_identificacion:   'CC',
    numero_identificacion: '',
    rol_id:                '',
  });
  const [creando, setCreando] = useState(false);
  const [mensajeCrear, setMensajeCrear] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [orden, setOrden] = useState<{ columna: keyof Usuario | 'rol'; direccion: 'asc' | 'desc' }>({
    columna: 'consecutivo',
    direccion: 'asc'
  });

  useEffect(() => {
    if (location.state && location.state.abrirModalCrear) {
      setModalCrear(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  
  const cargarUsuarios = async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from('usuarios')
      .select(`
        id, consecutivo, nombre_razon_social, correo,
        telefono, tipo_identificacion, numero_identificacion, activo,
        roles ( nombre )
      `)
      .order('consecutivo', { ascending: true });

    if (!error && data) {
      const mapped: Usuario[] = (data as any[]).map(u => ({
        ...u,
        roles: Array.isArray(u.roles) ? (u.roles[0] ?? null) : (u.roles ?? null),
      }));
      setUsuarios(mapped);
      setFiltrados(mapped);
    }
    setCargando(false);
  };

  const cargarRoles = async () => {
    const { data } = await supabase.from('roles').select('id, nombre').order('id');
    if (data) setRoles(data);
  };

  useEffect(() => {
    cargarUsuarios();
    cargarRoles();
  }, []);

  useEffect(() => {
    const q = busqueda.toLowerCase();
    setFiltrados(
      usuarios.filter(u =>
        u.nombre_razon_social.toLowerCase().includes(q) ||
        u.correo.toLowerCase().includes(q) ||
        u.numero_identificacion.toLowerCase().includes(q) ||
        (u.roles?.nombre ?? '').toLowerCase().includes(q)
      )
    );
    setPagina(1);
  }, [busqueda, usuarios]);

  const usuariosOrdenados = [...filtrados].sort((a, b) => {
    let valA: any = a[orden.columna as keyof Usuario];
    let valB: any = b[orden.columna as keyof Usuario];
    if (orden.columna === 'rol') {
      valA = a.roles?.nombre ?? '';
      valB = b.roles?.nombre ?? '';
    }
    if (valA < valB) return orden.direccion === 'asc' ? -1 : 1;
    if (valA > valB) return orden.direccion === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (columna: keyof Usuario | 'rol') => {
    const esAsc = orden.columna === columna && orden.direccion === 'asc';
    setOrden({ columna, direccion: esAsc ? 'desc' : 'asc' });
  };

  const renderSortIcon = (col: keyof Usuario | 'rol') => {
    if (orden.columna !== col) return null;
    return orden.direccion === 'asc' ? 
      <FaSortUp style={{ marginLeft: '4px', verticalAlign: 'middle' }} /> : 
      <FaSortDown style={{ marginLeft: '4px', verticalAlign: 'middle' }} />;
  };

  const totalPaginas = Math.ceil(filtrados.length / REGISTROS_POR_PAGINA);
  const inicio       = (pagina - 1) * REGISTROS_POR_PAGINA;
  const paginados = usuariosOrdenados.slice(inicio, inicio + REGISTROS_POR_PAGINA);

  // ── Guardar Edición ───────────────────────────────────────────────────
  const handleGuardarEdicion = async () => {
    if (!modalEditar) return;
    
    // Validación general
    const errorValidacion = validarUsuario(modalEditar);
    if (errorValidacion) {
      setMensaje({ tipo: 'error', texto: errorValidacion });
      return;
    }

    // Novedad: Validar que el número de identificación no pertenezca a OTRO usuario
    const idDuplicada = usuarios.some(u => 
      u.numero_identificacion === modalEditar.numero_identificacion && 
      u.id !== modalEditar.id // Ignorar el usuario que estamos editando
    );
    if (idDuplicada) {
      setMensaje({ tipo: 'error', texto: 'Error: Ya existe otro usuario registrado con este número de identificación.' });
      return;
    }

    setGuardando(true);
    setMensaje(null);

    const rolSeleccionado = roles.find(r => r.nombre === modalEditar.roles?.nombre);

    const { error } = await supabase
      .from('usuarios')
      .update({
        nombre_razon_social:   modalEditar.nombre_razon_social,
        correo:                modalEditar.correo,
        telefono:              modalEditar.telefono,
        tipo_identificacion:   modalEditar.tipo_identificacion,
        numero_identificacion: modalEditar.numero_identificacion,
        rol_id:                rolSeleccionado?.id,
        fecha_actualizacion:   new Date().toISOString(),
      })
      .eq('id', modalEditar.id);

    if (error) {
      // Captura si la base de datos lanza un error de valor único (ej. si dos editan al tiempo)
      if (error.code === '23505') {
        setMensaje({ tipo: 'error', texto: 'Error: El correo o número de identificación ya están en uso.' });
      } else {
        setMensaje({ tipo: 'error', texto: `Error: ${error.message}` });
      }
    } else {
      setMensaje({ tipo: 'ok', texto: '¡Usuario actualizado!' });
      await cargarUsuarios();
      setTimeout(() => { setModalEditar(null); setMensaje(null); }, 1200);
    }
    setGuardando(false);
  };

  const handleEliminar = async () => {
    if (!modalEliminar) return;
    setGuardando(true);
    setMensajeEliminar(null);

    const { data: { session } } = await supabase.auth.getSession();

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/eliminar-usuario`,
      {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'apikey':        import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ usuario_id: modalEliminar.id }),
      }
    );

    const result = await res.json();

    if (!res.ok || result.error) {
      setMensajeEliminar({ tipo: 'error', texto: result.error ?? 'Error al eliminar el usuario.' });
    } else {
      setMensajeEliminar(null);
      setModalEliminar(null);
      await cargarUsuarios();
    }

    setGuardando(false);
  };

  const getRolBadge = (nombre: string | undefined) => {
    switch (nombre) {
      case 'administrador': return 'badge-rol badge-admin';
      case 'vendedor':      return 'badge-rol badge-vendedor';
      case 'facturacion':   return 'badge-rol badge-usuario';
      default:              return 'badge-rol';
    }
  };

  // ── Crear Usuario ─────────────────────────────────────────────────────
  const handleCrearUsuario = async () => {
    // Validación general
    const errorValidacion = validarUsuario(nuevoUsuario);
    if (errorValidacion) {
      setMensajeCrear({ tipo: 'error', texto: errorValidacion });
      return;
    }

    // Novedad: Validar que el número de identificación no exista en la BD (local check)
    const idDuplicada = usuarios.some(u => 
      u.numero_identificacion === nuevoUsuario.numero_identificacion
    );
    if (idDuplicada) {
      setMensajeCrear({ tipo: 'error', texto: 'Error: Ya existe un usuario registrado con este número de identificación.' });
      return;
    }

    setCreando(true);
    setMensajeCrear(null);
    const { data: { session } } = await supabase.auth.getSession();

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crear-usuario`,
      {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'apikey':         import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          ...nuevoUsuario,
          rol_id: Number(nuevoUsuario.rol_id),
        }),
      }
    );

    const result = await res.json();

    if (!res.ok || result.error) {
      // Captura el error si viene desde tu Edge Function
      if (result.error?.includes('duplicate key') || result.error?.includes('23505')) {
        setMensajeCrear({ tipo: 'error', texto: 'Error: El correo o número de identificación ya están en uso.' });
      } else {
        setMensajeCrear({ tipo: 'error', texto: result.error ?? 'Error al crear el usuario.' });
      }
    } else {
      setMensajeCrear({ tipo: 'ok', texto: '¡Usuario creado exitosamente!' });
      await cargarUsuarios();
      setTimeout(() => {
        setModalCrear(false);
        setMensajeCrear(null);
        setNuevoUsuario({
          nombre_razon_social: '', correo: '', password: '',
          telefono: '', tipo_identificacion: 'CC',
          numero_identificacion: '', rol_id: '',
        });
      }, 1200);
    }
    setCreando(false);
  };

  return (
    <div className="usuarios-page">
      <div className="usuarios-header">
        <h2 className="usuarios-title">
          <i className="bi bi-people"></i> Usuarios
        </h2>
        <button className="btn-nuevo-usuario" onClick={() => setModalCrear(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FaPlus /> Nuevo Usuario
        </button>
      </div>

      <div className="dash-card">
        <div className="usuarios-toolbar">
          <div className="usuarios-toolbar-left">
            <span className="toolbar-label">Mostrar</span>
            <span className="toolbar-count">{filtrados.length}</span>
            <span className="toolbar-label">registros</span>
          </div>
          <div className="usuarios-toolbar-right">
            <span className="toolbar-label">Buscar:</span>
            <input
              className="usuarios-buscador"
              type="text"
              placeholder="Nombre, correo, identificación..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        {cargando ? (
          <p className="usuarios-cargando">Cargando usuarios...</p>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="pedidos-table usuarios-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('consecutivo')} style={{ cursor: 'pointer' }}>
                    ID {renderSortIcon('consecutivo')}
                  </th>
                  <th onClick={() => handleSort('nombre_razon_social')} style={{ cursor: 'pointer' }}>
                    Nombre {renderSortIcon('nombre_razon_social')}
                  </th>
                  <th>Correo</th>
                  <th>Teléfono</th>
                  <th>Identificación</th>
                  <th onClick={() => handleSort('rol')} style={{ cursor: 'pointer' }}>
                    Rol {renderSortIcon('rol')}
                  </th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginados.map(u => (
                  <tr key={u.id}>
                    <td>{u.consecutivo}</td>
                    <td className="cliente-cell"><div>{u.nombre_razon_social}</div></td>
                    <td>{u.correo}</td>
                    <td>{u.telefono || '—'}</td>
                    <td>{u.tipo_identificacion} {u.numero_identificacion}</td>
                    <td>
                      <span className={getRolBadge(u.roles?.nombre)}>
                        {u.roles?.nombre ?? '—'}
                      </span>
                    </td>
                    <td>
                      <div className="usuarios-acciones">
                        <button className="btn-accion btn-ver" title="Ver detalle" onClick={() => setModalDetalle(u)}>
                          <FaEye />
                        </button>
                        <button className="btn-accion btn-editar" title="Editar" onClick={() => setModalEditar({ ...u })}>
                          <FaEdit />
                        </button>
                        <button className="btn-accion btn-eliminar" title="Eliminar" onClick={() => setModalEliminar(u)}>
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>

            <div className="usuarios-paginacion">
              <span className="paginacion-info">
                Mostrando {filtrados.length === 0 ? 0 : inicio + 1} al{' '}
                {Math.min(inicio + REGISTROS_POR_PAGINA, filtrados.length)} de{' '}
                {filtrados.length} registros
              </span>
              <div className="paginacion-botones">
                <button className="btn-pagina" disabled={pagina === 1} onClick={() => setPagina(p => p - 1)}>
                  Anterior
                </button>
                {Array.from({ length: totalPaginas }, (_, i) => (
                  <button
                    key={i + 1}
                    className={`btn-pagina ${pagina === i + 1 ? 'activa' : ''}`}
                    onClick={() => setPagina(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button className="btn-pagina" disabled={pagina === totalPaginas || totalPaginas === 0} onClick={() => setPagina(p => p + 1)}>
                  Siguiente
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Modal Ver Detalle ── */}
      {modalDetalle && (
        <div className="modal-overlay" onClick={() => setModalDetalle(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detalle de Usuario</h3>
              <button className="modal-cerrar" onClick={() => setModalDetalle(null)}><FaTimes /></button>
            </div>
            <div className="modal-body">
              <div className="detalle-fila"><span>Nombre</span><strong>{modalDetalle.nombre_razon_social}</strong></div>
              <div className="detalle-fila"><span>Correo</span><strong>{modalDetalle.correo}</strong></div>
              <div className="detalle-fila"><span>Teléfono</span><strong>{modalDetalle.telefono || '—'}</strong></div>
              <div className="detalle-fila"><span>Identificación</span><strong>{modalDetalle.tipo_identificacion} {modalDetalle.numero_identificacion}</strong></div>
              <div className="detalle-fila"><span>Rol</span><strong>{modalDetalle.roles?.nombre ?? '—'}</strong></div>
              <div className="detalle-fila"><span>Estado</span><strong>{modalDetalle.activo ? 'Activo' : 'Inactivo'}</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Editar ── */}
      {modalEditar && (
        <div className="modal-overlay" onClick={() => setModalEditar(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Editar Usuario</h3>
              <button className="modal-cerrar" onClick={() => setModalEditar(null)}><FaTimes /></button>
            </div>
            <div className="modal-body">
              <div className="perfil-campo">
                <label>Nombre *</label>
                <input
                  value={modalEditar.nombre_razon_social}
                  onChange={e => setModalEditar(prev => prev ? { ...prev, nombre_razon_social: e.target.value } : prev)}
                />
              </div>

              <div className="perfil-campo">
                <label>Correo *</label>
                <input
                  value={modalEditar.correo}
                  onChange={e => setModalEditar(prev => prev ? { ...prev, correo: e.target.value } : prev)}
                />
              </div>

              <div className="perfil-campo">
                <label>Teléfono</label>
                <input
                  placeholder="3001234567"
                  value={modalEditar.telefono}
                  onChange={e => setModalEditar(prev => prev ? { ...prev, telefono: e.target.value.replace(/\D/g, '').slice(0, 10) } : prev)}
                />
              </div>

              <div className="perfil-campo">
                <label>Tipo de Identificación</label>
                <select
                  value={modalEditar.tipo_identificacion}
                  onChange={e => setModalEditar(prev => prev ? { ...prev, tipo_identificacion: e.target.value } : prev)}
                >
                  {['CC', 'NIT', 'PASAPORTE', 'CE'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>

              <div className="perfil-campo">
                <label>Número de identificación *</label>
                <input
                  value={modalEditar.numero_identificacion}
                  onChange={e => {
                    const final = limpiarId(e.target.value);
                    setModalEditar(prev => prev ? { ...prev, numero_identificacion: final } : prev);
                  }}
                />
              </div>

              <div className="perfil-campo">
                <label>Rol</label>
                <select
                  value={modalEditar.roles?.nombre ?? ''}
                  onChange={e => setModalEditar(prev =>
                    prev ? { ...prev, roles: { nombre: e.target.value } } : prev
                  )}
                >
                  {roles.map(r => <option key={r.id} value={r.nombre}>{r.nombre}</option>)}
                </select>
              </div>

              {mensaje && (
                <p className={`perfil-mensaje ${mensaje.tipo === 'ok' ? 'perfil-ok' : 'perfil-error'}`}>
                  {mensaje.texto}
                </p>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-modal-cancelar" onClick={() => setModalEditar(null)}>Cancelar</button>
              <button className="perfil-btn-guardar" onClick={handleGuardarEdicion} disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Confirmar Eliminar ── */}
      {modalEliminar && (
        <div className="modal-overlay" onClick={() => { setModalEliminar(null); setMensajeEliminar(null); }}>
          <div className="modal-box modal-pequeño" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Eliminar Usuario</h3>
              <button className="modal-cerrar" onClick={() => { setModalEliminar(null); setMensajeEliminar(null); }}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <p>¿Estás seguro de que deseas eliminar a <strong>{modalEliminar.nombre_razon_social}</strong>?</p>
              <p className="usuarios-aviso">Esta acción no se puede deshacer.</p>

              {/* ✅ Aquí aparece el error si lo hay */}
              {mensajeEliminar && (
                <p className={`perfil-mensaje ${mensajeEliminar.tipo === 'ok' ? 'perfil-ok' : 'perfil-error'}`}>
                  {mensajeEliminar.texto}
                </p>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-modal-cancelar" onClick={() => { setModalEliminar(null); setMensajeEliminar(null); }}>
                Cancelar
              </button>
              <button className="btn-modal-eliminar" onClick={handleEliminar} disabled={guardando}>
                {guardando ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Modal Crear Usuario ── */}
      {modalCrear && (
        <div className="modal-overlay" onClick={() => setModalCrear(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Nuevo Usuario</h3>
              <button className="modal-cerrar" onClick={() => setModalCrear(false)}><FaTimes /></button>
            </div>
            <div className="modal-body">

              <div className="perfil-campo">
                <label>Nombre *</label>
                <input
                  placeholder="Nombre completo"
                  value={nuevoUsuario.nombre_razon_social}
                  onChange={e => setNuevoUsuario(p => ({ ...p, nombre_razon_social: e.target.value }))}
                />
              </div>

              <div className="perfil-campo">
                <label>Correo electrónico *</label>
                <input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={nuevoUsuario.correo}
                  onChange={e => setNuevoUsuario(p => ({ ...p, correo: e.target.value }))}
                />
              </div>

              <div className="perfil-campo">
                <label>Contraseña temporal *</label>
                <input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={nuevoUsuario.password}
                  onChange={e => setNuevoUsuario(p => ({ ...p, password: e.target.value }))}
                />
              </div>

              <div className="perfil-campo">
                <label>Teléfono</label>
                <input
                  placeholder="3001234567"
                  value={nuevoUsuario.telefono}
                  onChange={e => setNuevoUsuario(p => ({ ...p, telefono: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                />
              </div>

              <div className="perfil-fila">
                <div className="perfil-campo">
                  <label>Tipo de ID</label>
                  <select
                    value={nuevoUsuario.tipo_identificacion}
                    onChange={e => setNuevoUsuario(p => ({ ...p, tipo_identificacion: e.target.value }))}
                  >
                    {['CC', 'NIT', 'PASAPORTE', 'CE'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="perfil-campo">
                  <label>Número de identificación *</label>
                  <input
                    placeholder="123456789"
                    value={nuevoUsuario.numero_identificacion}
                    onChange={e => {
                      const final = limpiarId(e.target.value);
                      setNuevoUsuario(p => ({ ...p, numero_identificacion: final }));
                    }}
                  />
                </div>
              </div>

              <div className="perfil-campo">
                <label>Rol *</label>
                <select
                  value={nuevoUsuario.rol_id}
                  onChange={e => setNuevoUsuario(p => ({ ...p, rol_id: e.target.value }))}
                >
                  <option value="">— Seleccionar rol —</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                </select>
              </div>

              <div className="mensaje_campo">
                <p>Los campos que contengan * son obligatorios</p>
              </div>

              {mensajeCrear && (
                <p className={`perfil-mensaje ${mensajeCrear.tipo === 'ok' ? 'perfil-ok' : 'perfil-error'}`}>
                  {mensajeCrear.texto}
                </p>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-modal-cancelar" onClick={() => setModalCrear(false)}>Cancelar</button>
              <button className="perfil-btn-guardar" onClick={handleCrearUsuario} disabled={creando}>
                {creando ? 'Creando...' : 'Crear Usuario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Usuarios;