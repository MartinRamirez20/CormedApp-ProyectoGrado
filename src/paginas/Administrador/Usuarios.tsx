import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabase.ts';
import './Usuarios.css';

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

  // ── Paginación ─────────────────────────────────────────────────────────────
  const totalPaginas = Math.ceil(filtrados.length / REGISTROS_POR_PAGINA);
  const inicio       = (pagina - 1) * REGISTROS_POR_PAGINA;
  const paginados    = filtrados.slice(inicio, inicio + REGISTROS_POR_PAGINA);

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

  return (
    <div className="usuarios-page">
      <div className="usuarios-header">
        <h2 className="usuarios-title">
          <i className="bi bi-people"></i> Usuarios
        </h2>
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
                    <th>#</th>
                    <th>Nombre / Razón Social</th>
                    <th>Correo</th>
                    <th>Teléfono</th>
                    <th>Identificación</th>
                    <th>Rol</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginados.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="usuarios-vacio">
                        No se encontraron usuarios.
                      </td>
                    </tr>
                  ) : (
                    paginados.map(u => (
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
                              <i className="bi bi-eye"></i>
                            </button>
                            <button className="btn-accion btn-editar" title="Editar" onClick={() => setModalEditar({ ...u })}>
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button className="btn-accion btn-eliminar" title="Eliminar" onClick={() => setModalEliminar(u)}>
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
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
              <p className="usuarios-aviso">⚠️ Esta acción no se puede deshacer.</p>
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
    </div>
  );
};

export default Usuarios;