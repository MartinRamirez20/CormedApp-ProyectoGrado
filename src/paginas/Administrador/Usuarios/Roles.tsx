import React, { useEffect, useState } from 'react';
import { supabase } from '../../../supabase.ts';
import './Roles.css';

/* ── Tipos ──────────────────────────────────────────────────────────────── */
interface Rol {
  id: number;
  nombre: string;
  descripcion: string | null;
}

interface UsuarioDeRol {
  id: string;
  consecutivo: number;
  nombre_razon_social: string;
  correo: string;
  telefono: string;
  tipo_identificacion: string;
  numero_identificacion: string;
  activo: boolean;
}

interface RolConConteo extends Rol {
  total: number;
}

const REGISTROS_POR_PAGINA = 10;

const ICONOS_ROL: Record<string, string> = {
  administrador: '🛡️',
  facturador:    '🧾',
  vendedor:      '🏷️',
};

const COLORES_ROL: Record<string, { bg: string; color: string; border: string }> = {
  administrador: { bg: '#ede9fe', color: '#512da8', border: '#c4b5fd' },
  facturador:    { bg: '#e0f2fe', color: '#0369a1', border: '#7dd3fc' },
  vendedor:      { bg: '#f0fdf4', color: '#16a34a', border: '#86efac' },
};

const Roles: React.FC = () => {
  const [roles, setRoles]                   = useState<RolConConteo[]>([]);
  const [cargando, setCargando]             = useState(true);

  // ── Modal lista de usuarios por rol ──
  const [rolSeleccionado, setRolSeleccionado] = useState<RolConConteo | null>(null);
  const [usuarios, setUsuarios]               = useState<UsuarioDeRol[]>([]);
  const [filtrados, setFiltrados]             = useState<UsuarioDeRol[]>([]);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false);
  const [busqueda, setBusqueda]               = useState('');
  const [pagina, setPagina]                   = useState(1);

  // ── Modal detalle de usuario ──
  const [modalDetalle, setModalDetalle] = useState<UsuarioDeRol | null>(null);

  // ── Ordenamiento ──
  const [orden, setOrden] = useState<{ columna: keyof UsuarioDeRol; direccion: 'asc' | 'desc' }>({
    columna: 'consecutivo',
    direccion: 'asc',
  });

  /* ── Cargar roles con conteo de usuarios ───────────────────────────────── */
  const cargarRoles = async () => {
    setCargando(true);

    const { data: rolesData, error } = await supabase
      .from('roles')
      .select('id, nombre, descripcion')
      .order('id');

    if (error || !rolesData) {
      setCargando(false);
      return;
    }

    // Para cada rol, contar cuántos usuarios tiene
    const rolesConConteo: RolConConteo[] = await Promise.all(
      rolesData.map(async (rol) => {
        const { count } = await supabase
          .from('usuarios')
          .select('id', { count: 'exact', head: true })
          .eq('rol_id', rol.id);

        return { ...rol, total: count ?? 0 };
      })
    );

    setRoles(rolesConConteo);
    setCargando(false);
  };

  useEffect(() => {
    cargarRoles();
  }, []);

  /* ── Al hacer click en un rol: cargar sus usuarios ─────────────────────── */
  const handleAbrirRol = async (rol: RolConConteo) => {
    setRolSeleccionado(rol);
    setCargandoUsuarios(true);
    setBusqueda('');
    setPagina(1);

    const { data, error } = await supabase
      .from('usuarios')
      .select('id, consecutivo, nombre_razon_social, correo, telefono, tipo_identificacion, numero_identificacion, activo')
      .eq('rol_id', rol.id)
      .order('consecutivo', { ascending: true });

    if (!error && data) {
      setUsuarios(data as UsuarioDeRol[]);
      setFiltrados(data as UsuarioDeRol[]);
    }
    setCargandoUsuarios(false);
  };

  /* ── Buscador dentro del modal ─────────────────────────────────────────── */
  useEffect(() => {
    if (!rolSeleccionado) return;
    const q = busqueda.toLowerCase();
    const resultado = usuarios.filter(u =>
      u.nombre_razon_social.toLowerCase().includes(q) ||
      u.correo.toLowerCase().includes(q) ||
      u.numero_identificacion.toLowerCase().includes(q)
    );
    setFiltrados(resultado);
    setPagina(1);
  }, [busqueda, usuarios]);

  /* ── Ordenamiento de la tabla ──────────────────────────────────────────── */
  const usuariosOrdenados = [...filtrados].sort((a, b) => {
    const valA = a[orden.columna] ?? '';
    const valB = b[orden.columna] ?? '';
    if (valA < valB) return orden.direccion === 'asc' ? -1 : 1;
    if (valA > valB) return orden.direccion === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (columna: keyof UsuarioDeRol) => {
    const esAsc = orden.columna === columna && orden.direccion === 'asc';
    setOrden({ columna, direccion: esAsc ? 'desc' : 'asc' });
  };

  const iconoOrden = (col: keyof UsuarioDeRol) =>
    orden.columna === col ? (orden.direccion === 'asc' ? ' 🔼' : ' 🔽') : '';

  /* ── Paginación ────────────────────────────────────────────────────────── */
  const totalPaginas = Math.ceil(filtrados.length / REGISTROS_POR_PAGINA);
  const inicio       = (pagina - 1) * REGISTROS_POR_PAGINA;
  const paginados    = usuariosOrdenados.slice(inicio, inicio + REGISTROS_POR_PAGINA);

  /* ── Helpers de estilo ─────────────────────────────────────────────────── */
  const getColores = (nombre: string) =>
    COLORES_ROL[nombre.toLowerCase()] ?? { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' };

  const getIcono = (nombre: string) =>
    ICONOS_ROL[nombre.toLowerCase()] ?? '👤';

  /* ── Render ────────────────────────────────────────────────────────────── */
  return (
    <div className="roles-page">
      {/* Encabezado */}
      <div className="roles-header">
        <h2 className="roles-title">
          <i className="bi bi-shield-lock">Roles de Usuario</i>
        </h2>
      </div>

      {/* Tarjetas de roles */}
      {cargando ? (
        <p className="roles-cargando">Cargando roles...</p>
      ) : (
        <div className="roles-cards-grid">
          {roles.map(rol => {
            const colores = getColores(rol.nombre);
            return (
              <div
                key={rol.id}
                className="roles-card"
                style={{ borderTop: `4px solid ${colores.color}` }}
                onClick={() => handleAbrirRol(rol)}
              >
                <div className="roles-card-icono" style={{ background: colores.bg, color: colores.color }}>
                  <span>{getIcono(rol.nombre)}</span>
                </div>
                <div className="roles-card-info">
                  <h3 className="roles-card-nombre" style={{ color: colores.color }}>
                    {rol.nombre.charAt(0).toUpperCase() + rol.nombre.slice(1)}
                  </h3>
                  {rol.descripcion && (
                    <p className="roles-card-descripcion">{rol.descripcion}</p>
                  )}
                  <div className="roles-card-conteo">
                    <span
                      className="badge-status badge-activo"
                      style={{ background: colores.bg, color: colores.color, border: `1px solid ${colores.border}` }}
                    >
                      {rol.total} {rol.total === 1 ? 'usuario' : 'usuarios'}
                    </span>
                  </div>
                </div>
                <div className="roles-card-flecha" style={{ color: colores.color }}>
                  Ver usuarios →
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal: Usuarios del Rol ─────────────────────────────────────── */}
      {rolSeleccionado && (
        <div className="modal-overlay" onClick={() => setRolSeleccionado(null)}>
          <div
            className="modal-box modal-roles-usuarios"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="modal-header">
              <h3>
                {getIcono(rolSeleccionado.nombre)}{' '}
                Usuarios — {rolSeleccionado.nombre.charAt(0).toUpperCase() + rolSeleccionado.nombre.slice(1)}
              </h3>
              <button className="modal-cerrar" onClick={() => setRolSeleccionado(null)}>✕</button>
            </div>

            {/* Toolbar de búsqueda */}
            <div className="modal-body" style={{ maxHeight: 'none', overflow: 'visible', padding: '16px 20px 0' }}>
              <div className="roles-toolbar">
                <div className="roles-toolbar-left">
                  <span className="toolbar-label">Total:</span>
                  <span className="toolbar-count">{filtrados.length} registros</span>
                </div>
                <div className="roles-toolbar-right">
                  <span className="toolbar-label">Buscar:</span>
                  <input
                    className="roles-buscador"
                    type="text"
                    placeholder="Nombre, correo, identificación..."
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Tabla */}
            <div style={{ padding: '0 20px', overflowX: 'auto', maxHeight: '45vh', overflowY: 'auto' }}>
              {cargandoUsuarios ? (
                <p className="roles-cargando">Cargando usuarios...</p>
              ) : filtrados.length === 0 ? (
                <p className="roles-vacio">No hay usuarios con este rol.</p>
              ) : (
                <table className="pedidos-table roles-table">
                  <thead>
                    <tr>
                      <th onClick={() => handleSort('consecutivo')} style={{ cursor: 'pointer' }}>
                        #{iconoOrden('consecutivo')}
                      </th>
                      <th onClick={() => handleSort('nombre_razon_social')} style={{ cursor: 'pointer' }}>
                        Nombre{iconoOrden('nombre_razon_social')}
                      </th>
                      <th onClick={() => handleSort('correo')} style={{ cursor: 'pointer' }}>
                        Correo{iconoOrden('correo')}
                      </th>
                      <th>Teléfono</th>
                      <th>Identificación</th>
                      <th>Estado</th>
                      <th>Detalle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginados.map(u => (
                      <tr key={u.id}>
                        <td>{u.consecutivo}</td>
                        <td><div>{u.nombre_razon_social}</div></td>
                        <td>{u.correo}</td>
                        <td>{u.telefono || '—'}</td>
                        <td>{u.tipo_identificacion} {u.numero_identificacion}</td>
                        <td>
                          <span className={`badge-status ${u.activo ? 'badge-activo' : 'badge-inactivo'}`}>
                            {u.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td>
                          <div className="roles-acciones">
                            <button
                              className="btn-accion btn-ver"
                              title="Ver detalle"
                              onClick={() => setModalDetalle(u)}
                            >
                              🔍
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Paginación */}
            {!cargandoUsuarios && filtrados.length > 0 && (
              <div style={{ padding: '0 20px' }}>
                <div className="roles-paginacion">
                  <span className="paginacion-info">
                    Mostrando {filtrados.length === 0 ? 0 : inicio + 1} al{' '}
                    {Math.min(inicio + REGISTROS_POR_PAGINA, filtrados.length)} de{' '}
                    {filtrados.length} registros
                  </span>
                  <div className="paginacion-botones">
                    <button
                      className="btn-pagina"
                      disabled={pagina === 1}
                      onClick={() => setPagina(p => p - 1)}
                    >
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
                    <button
                      className="btn-pagina"
                      disabled={pagina === totalPaginas || totalPaginas === 0}
                      onClick={() => setPagina(p => p + 1)}
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="modal-footer">
              <button className="btn-modal-cancelar" onClick={() => setRolSeleccionado(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Detalle de Usuario ───────────────────────────────────── */}
      {modalDetalle && (
        <div className="modal-overlay" onClick={() => setModalDetalle(null)}>
          <div className="modal-box modal-pequeño" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detalle de Usuario</h3>
              <button className="modal-cerrar" onClick={() => setModalDetalle(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="detalle-fila">
                <span>Nombre</span>
                <strong>{modalDetalle.nombre_razon_social}</strong>
              </div>
              <div className="detalle-fila">
                <span>Correo</span>
                <strong>{modalDetalle.correo}</strong>
              </div>
              <div className="detalle-fila">
                <span>Teléfono</span>
                <strong>{modalDetalle.telefono || '—'}</strong>
              </div>
              <div className="detalle-fila">
                <span>Identificación</span>
                <strong>{modalDetalle.tipo_identificacion} {modalDetalle.numero_identificacion}</strong>
              </div>
              <div className="detalle-fila">
                <span>Rol</span>
                <strong>
                  {rolSeleccionado
                    ? rolSeleccionado.nombre.charAt(0).toUpperCase() + rolSeleccionado.nombre.slice(1)
                    : '—'}
                </strong>
              </div>
              <div className="detalle-fila">
                <span>Estado</span>
                <strong>
                  <span className={`badge-status ${modalDetalle.activo ? 'badge-activo' : 'badge-inactivo'}`}>
                    {modalDetalle.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </strong>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-modal-cancelar" onClick={() => setModalDetalle(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Roles;