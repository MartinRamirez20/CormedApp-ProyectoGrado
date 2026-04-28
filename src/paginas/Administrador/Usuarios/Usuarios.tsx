import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../../supabase.ts';
import './Usuarios.css';

//Icons
import { FaSearch } from "react-icons/fa"; // Busqueda
import { FaEdit } from "react-icons/fa"; //Editar
import { FaTrash } from "react-icons/fa"; // Eliminar

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
    // Si en la navegación enviamos el estado 'abrirModalCrear'
    if (location.state && location.state.abrirModalCrear) {
      setModalCrear(true); // Activamos el modal
      
      // Limpiamos el estado de la navegación para que no se abra 
      // infinitamente si el usuario refresca la página (F5)
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]); // Solo depende de estos dos hooks

  
  // ── Cargar usuarios ────────────────────────────────────────────────────────
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
      // Normalizar: Supabase puede devolver roles como objeto o array
      const mapped: Usuario[] = (data as any[]).map(u => ({
        ...u,
        roles: Array.isArray(u.roles)
          ? (u.roles[0] ?? null)
          : (u.roles ?? null),
      }));
      setUsuarios(mapped);
      setFiltrados(mapped);
    }
    setCargando(false);
  };

  // ── Cargar roles ───────────────────────────────────────────────────────────
  const cargarRoles = async () => {
    const { data } = await supabase.from('roles').select('id, nombre').order('id');
    if (data) setRoles(data);
  };

  useEffect(() => {
    cargarUsuarios();
    cargarRoles();
  }, []);

  // ── Buscador ───────────────────────────────────────────────────────────────
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

  // Modifica la lógica de filtrados para incluir el ordenamiento
  const usuariosOrdenados = [...filtrados].sort((a, b) => {
    let valA: any = a[orden.columna as keyof Usuario];
    let valB: any = b[orden.columna as keyof Usuario];

    // Caso especial para la columna Rol (que es un objeto anidado)
    if (orden.columna === 'rol') {
      valA = a.roles?.nombre ?? '';
      valB = b.roles?.nombre ?? '';
    }

    if (valA < valB) return orden.direccion === 'asc' ? -1 : 1;
    if (valA > valB) return orden.direccion === 'asc' ? 1 : -1;
    return 0;
  });

  // Función para cambiar el orden
  const handleSort = (columna: keyof Usuario | 'rol') => {
    const esAsc = orden.columna === columna && orden.direccion === 'asc';
    setOrden({ columna, direccion: esAsc ? 'desc' : 'asc' });
  };

  // ── Paginación ─────────────────────────────────────────────────────────────
  const totalPaginas = Math.ceil(filtrados.length / REGISTROS_POR_PAGINA);
  const inicio       = (pagina - 1) * REGISTROS_POR_PAGINA;
  // Actualiza la paginación para que use 'usuariosOrdenados' en lugar de 'filtrados'
  const paginados = usuariosOrdenados.slice(inicio, inicio + REGISTROS_POR_PAGINA);

  // ── Editar usuario ─────────────────────────────────────────────────────────
  const handleGuardarEdicion = async () => {
    if (!modalEditar) return;
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
      setMensaje({ tipo: 'error', texto: `Error: ${error.message}` });
    } else {
      setMensaje({ tipo: 'ok', texto: '¡Usuario actualizado!' });
      await cargarUsuarios();
      setTimeout(() => { setModalEditar(null); setMensaje(null); }, 1200);
    }
    setGuardando(false);
  };

  // ── Eliminar usuario ───────────────────────────────────────────────────────
  const handleEliminar = async () => {
    if (!modalEliminar) return;
    setGuardando(true);

    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', modalEliminar.id);

    if (!error) {
      await cargarUsuarios();
      setModalEliminar(null);
    }
    setGuardando(false);
  };

  const getRolBadge = (nombre: string | undefined) => {
    switch (nombre) {
      case 'administrador': return 'badge-rol badge-admin';
      case 'vendedor':      return 'badge-rol badge-vendedor';
      case 'usuario':       return 'badge-rol badge-usuario';
      default:              return 'badge-rol';
    }
  };

  const handleCrearUsuario = async () => {
    const { nombre_razon_social, correo, password, numero_identificacion, rol_id } = nuevoUsuario;

    if (!nombre_razon_social || !correo || !password || !numero_identificacion || !rol_id) {
      setMensajeCrear({ tipo: 'error', texto: 'Todos los campos obligatorios deben completarse.' });
      return;
    }
    if (password.length < 6) {
      setMensajeCrear({ tipo: 'error', texto: 'La contraseña debe tener al menos 6 caracteres.' });
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
          'apikey':        import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          ...nuevoUsuario,
          rol_id: Number(nuevoUsuario.rol_id),
        }),
      }
    );

    const result = await res.json();

    if (!res.ok || result.error) {
      setMensajeCrear({ tipo: 'error', texto: result.error ?? 'Error al crear el usuario.' });
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
        <button className="btn-nuevo-usuario" onClick={() => setModalCrear(true)}>
          <i className="bi bi-person-plus">Nuevo Usuario</i>
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
                    # {orden.columna === 'consecutivo' ? (orden.direccion === 'asc' ? '🔼' : '🔽') : ''}
                  </th>
                  <th onClick={() => handleSort('nombre_razon_social')} style={{ cursor: 'pointer' }}>
                    Nombre {orden.columna === 'nombre_razon_social' ? (orden.direccion === 'asc' ? '🔼' : '🔽') : ''}
                  </th>
                  <th>Correo</th>
                  <th>Teléfono</th>
                  <th>Identificación</th>
                  <th onClick={() => handleSort('rol')} style={{ cursor: 'pointer' }}>
                    Rol {orden.columna === 'rol' ? (orden.direccion === 'asc' ? '🔼' : '🔽') : ''}
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
                          <i className="bi bi-eye"><FaSearch className='icons'/></i>
                        </button>
                        <button className="btn-accion btn-editar" title="Editar" onClick={() => setModalEditar({ ...u })}>
                          <i className="bi bi-pencil"><FaEdit className='icons'/></i>
                        </button>
                        <button className="btn-accion btn-eliminar" title="Eliminar" onClick={() => setModalEliminar(u)}>
                          <i className="bi bi-trash"><FaTrash className='icons'/></i>
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
              <button className="modal-cerrar" onClick={() => setModalDetalle(null)}>✕</button>
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
              <button className="modal-cerrar" onClick={() => setModalEditar(null)}>✕</button>
            </div>
            <div className="modal-body">
              {([
                { label: 'Nombre', key: 'nombre_razon_social' },
                { label: 'Correo', key: 'correo' },
                { label: 'Teléfono', key: 'telefono' },
                { label: 'Número de identificación', key: 'numero_identificacion' },
              ] as { label: string; key: keyof Usuario }[]).map(({ label, key }) => (
                <div className="perfil-campo" key={key}>
                  <label>{label}</label>
                  <input
                    value={String(modalEditar[key] ?? '')}
                    onChange={e => setModalEditar(prev => prev ? { ...prev, [key]: e.target.value } : prev)}
                  />
                </div>
              ))}

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
        <div className="modal-overlay" onClick={() => setModalEliminar(null)}>
          <div className="modal-box modal-pequeño" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Eliminar Usuario</h3>
              <button className="modal-cerrar" onClick={() => setModalEliminar(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p>¿Estás seguro de que deseas eliminar a <strong>{modalEliminar.nombre_razon_social}</strong>?</p>
              <p className="usuarios-aviso">Esta acción no se puede deshacer.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-modal-cancelar" onClick={() => setModalEliminar(null)}>Cancelar</button>
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
              <button className="modal-cerrar" onClick={() => setModalCrear(false)}>✕</button>
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
                  onChange={e => setNuevoUsuario(p => ({ ...p, telefono: e.target.value }))}
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
                    onChange={e => setNuevoUsuario(p => ({ ...p, numero_identificacion: e.target.value }))}
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