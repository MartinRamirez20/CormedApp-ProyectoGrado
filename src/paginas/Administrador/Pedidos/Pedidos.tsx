import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../supabase.ts';
import './Pedidos.css';

// Icons
import { FaEye, FaEdit, FaTrash, FaPlus, FaSortUp, FaSortDown} from 'react-icons/fa';

interface Producto {
  id: number;
  nombre: string;
  referencia: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  iva_porcentaje: number;
}

interface Pedido {
  id: number;
  referencia: string;
  cliente_id: number;
  cliente_nombre: string;
  vendedor_id: string;
  vendedor_nombre: string;
  productos: Producto[];
  monto_subtotal: number;
  monto_iva: number;
  monto_total: number;
  estado: 'pendiente' | 'confirmado' | 'facturado';
  notas: string | null;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

const REGISTROS_POR_PAGINA = 10;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);

const formatFecha = (iso: string) =>
  new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });

const Pedidos: React.FC = () => {
  const navigate = useNavigate();

  const [pedidos, setPedidos]           = useState<Pedido[]>([]);
  const [filtrados, setFiltrados]       = useState<Pedido[]>([]);
  const [cargando, setCargando]         = useState(true);
  const [busqueda, setBusqueda]         = useState('');
  const [pagina, setPagina]             = useState(1);
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');

  const [modalDetalle, setModalDetalle]   = useState<Pedido | null>(null);
  const [modalEditar, setModalEditar]     = useState<Pedido | null>(null);
  const [modalEliminar, setModalEliminar] = useState<Pedido | null>(null);
  const [guardando, setGuardando]         = useState(false);
  const [mensaje, setMensaje]             = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  const [orden, setOrden] = useState<{ columna: string; direccion: 'asc' | 'desc' }>({
    columna: 'id',
    direccion: 'desc',
  });

  // ── Cargar pedidos ─────────────────────────────────────────────────────────
  const cargarPedidos = async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .order('id', { ascending: false });

    if (!error && data) {
      setPedidos(data as Pedido[]);
      setFiltrados(data as Pedido[]);
    }
    setCargando(false);
  };

  useEffect(() => { cargarPedidos(); }, []);

  // ── Filtros ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const q = busqueda.toLowerCase();
    let resultado = pedidos.filter(p =>
      p.referencia.toLowerCase().includes(q) ||
      p.cliente_nombre.toLowerCase().includes(q) ||
      p.vendedor_nombre.toLowerCase().includes(q)
    );
    if (filtroEstado !== 'todos') {
      resultado = resultado.filter(p => p.estado === filtroEstado);
    }
    setFiltrados(resultado);
    setPagina(1);
  }, [busqueda, filtroEstado, pedidos]);

  // ── Ordenamiento ───────────────────────────────────────────────────────────
  const pedidosOrdenados = [...filtrados].sort((a: any, b: any) => {
    const valA = a[orden.columna] ?? '';
    const valB = b[orden.columna] ?? '';
    if (valA < valB) return orden.direccion === 'asc' ? -1 : 1;
    if (valA > valB) return orden.direccion === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (columna: string) => {
    const esAsc = orden.columna === columna && orden.direccion === 'asc';
    setOrden({ columna, direccion: esAsc ? 'desc' : 'asc' });
  };

  const sortIcon = (col: string) => {
    if (orden.columna !== col) return null;
    return orden.direccion === 'asc' ? 
      <FaSortUp style={{ marginLeft: '4px', verticalAlign: 'middle' }} /> : 
      <FaSortDown style={{ marginLeft: '4px', verticalAlign: 'middle' }} />;
  };

  // ── Paginación ─────────────────────────────────────────────────────────────
  const totalPaginas = Math.ceil(filtrados.length / REGISTROS_POR_PAGINA);
  const inicio       = (pagina - 1) * REGISTROS_POR_PAGINA;
  const paginados    = pedidosOrdenados.slice(inicio, inicio + REGISTROS_POR_PAGINA);

  // ── Editar pedido ──────────────────────────────────────────────────────────
  const handleGuardarEdicion = async () => {
    if (!modalEditar) return;
    setGuardando(true);
    setMensaje(null);

    const { error } = await supabase
      .from('pedidos')
      .update({
        notas:               modalEditar.notas,
        estado:              modalEditar.estado,
        fecha_actualizacion: new Date().toISOString(),
      })
      .eq('id', modalEditar.id);

    if (error) {
      setMensaje({ tipo: 'error', texto: `Error: ${error.message}` });
    } else {
      setMensaje({ tipo: 'ok', texto: '¡Pedido actualizado!' });
      await cargarPedidos();
      setTimeout(() => { setModalEditar(null); setMensaje(null); }, 1200);
    }
    setGuardando(false);
  };

  // ── Eliminar pedido ────────────────────────────────────────────────────────
  const handleEliminar = async () => {
    if (!modalEliminar) return;
    setGuardando(true);

    const { error } = await supabase
      .from('pedidos')
      .delete()
      .eq('id', modalEliminar.id);

    if (!error) {
      await cargarPedidos();
      setModalEliminar(null);
    }
    setGuardando(false);
  };

  // ── Helpers UI ─────────────────────────────────────────────────────────────
  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente':  return 'badge-estado badge-pendiente';
      case 'confirmado': return 'badge-estado badge-confirmado';
      case 'facturado':  return 'badge-estado badge-facturado';
      default:           return 'badge-estado';
    }
  };

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'pendiente':  return 'Pendiente';
      case 'confirmado': return 'Confirmado';
      case 'facturado':  return 'Facturado';
      default:           return estado;
    }
  };

  return (
    <div className="pedidos-page">
      {/* ── Header ── */}
      <div className="pedidos-header">
        <h2 className="pedidos-title">
          <i className="bi bi-bag"></i> Pedidos
        </h2>
        <button
          className="btn-nuevo-pedido"
          onClick={() => navigate('/admin/pedidos/crear')}
        >
          <FaPlus /> Nuevo Pedido
        </button>
      </div>

      {/* ── Tarjetas resumen ── */}
      <div className="pedidos-stats">
        {[
          { label: 'Total Pedidos', value: pedidos.length, color: 'stat-total' },
          { label: 'Pendientes',    value: pedidos.filter(p => p.estado === 'pendiente').length,  color: 'stat-pendiente' },
          { label: 'Confirmados',   value: pedidos.filter(p => p.estado === 'confirmado').length, color: 'stat-confirmado' },
          { label: 'Facturados',    value: pedidos.filter(p => p.estado === 'facturado').length,  color: 'stat-facturado' },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.color}`}>
            <span className="stat-number">{s.value}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="dash-card">
        {/* ── Toolbar ── */}
        <div className="pedidos-toolbar">
          <div className="pedidos-toolbar-left">
            <span className="toolbar-label">Mostrar</span>
            <span className="toolbar-count">{filtrados.length}</span>
            <span className="toolbar-label">registros</span>

            {/* Filtro de estado */}
            <div className="filtro-estado-group">
              {['todos', 'pendiente', 'confirmado', 'facturado'].map(e => (
                <button
                  key={e}
                  className={`btn-filtro-estado ${filtroEstado === e ? 'activo' : ''} filtro-${e}`}
                  onClick={() => setFiltroEstado(e)}
                >
                  {e === 'todos' ? 'Todos' : getEstadoLabel(e)}
                </button>
              ))}
            </div>
          </div>

          <div className="pedidos-toolbar-right">
            <span className="toolbar-label">Buscar:</span>
            <input
              className="pedidos-buscador"
              type="text"
              placeholder="Referencia, cliente, vendedor..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        {cargando ? (
          <p className="pedidos-cargando">Cargando pedidos...</p>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="pedidos-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('referencia')} style={{ cursor: 'pointer' }}>
                      Referencia{sortIcon('referencia')}
                    </th>
                    <th onClick={() => handleSort('cliente_nombre')} style={{ cursor: 'pointer' }}>
                      Cliente{sortIcon('cliente_nombre')}
                    </th>
                    <th onClick={() => handleSort('vendedor_nombre')} style={{ cursor: 'pointer' }}>
                      Vendedor{sortIcon('vendedor_nombre')}
                    </th>
                    <th onClick={() => handleSort('monto_total')} style={{ cursor: 'pointer' }}>
                      Total{sortIcon('monto_total')}
                    </th>
                    <th onClick={() => handleSort('estado')} style={{ cursor: 'pointer' }}>
                      Estado{sortIcon('estado')}
                    </th>
                    <th onClick={() => handleSort('fecha_creacion')} style={{ cursor: 'pointer' }}>
                      Fecha{sortIcon('fecha_creacion')}
                    </th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginados.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="pedidos-vacio">No se encontraron pedidos.</td>
                    </tr>
                  ) : paginados.map(p => (
                    <tr key={p.id}>
                      <td><span className="ref-tag">{p.referencia}</span></td>
                      <td className="cliente-cell"><div>{p.cliente_nombre}</div></td>
                      <td>{p.vendedor_nombre}</td>
                      <td className="monto-cell">{formatCurrency(p.monto_total)}</td>
                      <td>
                        <span className={getEstadoBadge(p.estado)}>
                          {getEstadoLabel(p.estado)}
                        </span>
                      </td>
                      <td>{formatFecha(p.fecha_creacion)}</td>
                      <td>
                        <div className="pedidos-acciones">
                          <button
                            className="btn-accion btn-ver"
                            title="Ver detalle"
                            onClick={() => setModalDetalle(p)}
                          >
                            <FaEye className="icons" />
                          </button>
                          <button
                            className="btn-accion btn-editar"
                            title="Editar pedido"
                            disabled={p.estado === 'facturado'}
                            onClick={() => p.estado !== 'facturado' && setModalEditar({ ...p })}
                          >
                            <FaEdit className="icons" />
                          </button>
                          <button
                            className="btn-accion btn-eliminar"
                            title="Eliminar pedido"
                            disabled={p.estado === 'facturado'}
                            onClick={() => p.estado !== 'facturado' && setModalEliminar(p)}
                          >
                            <FaTrash className="icons" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Paginación ── */}
            <div className="pedidos-paginacion">
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
          <div className="modal-box modal-grande" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detalle del Pedido — <span className="ref-tag">{modalDetalle.referencia}</span></h3>
              <button className="modal-cerrar" onClick={() => setModalDetalle(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="detalle-grid">
                <div className="detalle-fila"><span>Cliente</span><strong>{modalDetalle.cliente_nombre}</strong></div>
                <div className="detalle-fila"><span>Vendedor</span><strong>{modalDetalle.vendedor_nombre}</strong></div>
                <div className="detalle-fila"><span>Estado</span>
                  <strong><span className={getEstadoBadge(modalDetalle.estado)}>{getEstadoLabel(modalDetalle.estado)}</span></strong>
                </div>
                <div className="detalle-fila"><span>Fecha</span><strong>{formatFecha(modalDetalle.fecha_creacion)}</strong></div>
                <div className="detalle-fila"><span>Subtotal</span><strong>{formatCurrency(modalDetalle.monto_subtotal)}</strong></div>
                <div className="detalle-fila"><span>IVA</span><strong>{formatCurrency(modalDetalle.monto_iva)}</strong></div>
                <div className="detalle-fila detalle-total"><span>Total</span><strong>{formatCurrency(modalDetalle.monto_total)}</strong></div>
                {modalDetalle.notas && (
                  <div className="detalle-fila"><span>Notas</span><strong>{modalDetalle.notas}</strong></div>
                )}
              </div>

              {/* Tabla de productos */}
              <h4 className="detalle-subtitulo">Productos</h4>
              <table className="detalle-productos-table">
                <thead>
                  <tr>
                    <th>Referencia</th>
                    <th>Nombre</th>
                    <th>Cant.</th>
                    <th>P. Unitario</th>
                    <th>IVA %</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(modalDetalle.productos ?? []).map((prod, i) => (
                    <tr key={i}>
                      <td><span className="ref-tag">{prod.referencia}</span></td>
                      <td>{prod.nombre}</td>
                      <td className="text-center">{prod.cantidad}</td>
                      <td>{formatCurrency(prod.precio_unitario)}</td>
                      <td className="text-center">{prod.iva_porcentaje}%</td>
                      <td>{formatCurrency(prod.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-footer">
              <button className="btn-modal-cancelar" onClick={() => setModalDetalle(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Editar ── */}
      {modalEditar && (
        <div className="modal-overlay" onClick={() => setModalEditar(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Editar Pedido — <span className="ref-tag">{modalEditar.referencia}</span></h3>
              <button className="modal-cerrar" onClick={() => setModalEditar(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="perfil-campo">
                <label>Estado</label>
                <select
                  value={modalEditar.estado}
                  onChange={e => setModalEditar(prev =>
                    prev ? { ...prev, estado: e.target.value as Pedido['estado'] } : prev
                  )}
                >
                  {/* Si está confirmado, permite volver a pendiente */}
                  <option value="pendiente">Pendiente</option>
                  <option value="confirmado">Confirmado</option>
                  {/* No se permite cambiar manualmente a facturado desde aquí */}
                </select>
                {modalEditar.estado === 'confirmado' && (
                  <p className="pedidos-aviso">⚠️ Puedes revertir a Pendiente para editar el pedido.</p>
                )}
              </div>
              <div className="perfil-campo">
                <label>Notas</label>
                <textarea
                  rows={3}
                  value={modalEditar.notas ?? ''}
                  onChange={e => setModalEditar(prev => prev ? { ...prev, notas: e.target.value } : prev)}
                />
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

      {/* ── Modal Eliminar ── */}
      {modalEliminar && (
        <div className="modal-overlay" onClick={() => setModalEliminar(null)}>
          <div className="modal-box modal-pequeño" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Eliminar Pedido</h3>
              <button className="modal-cerrar" onClick={() => setModalEliminar(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p>¿Eliminar el pedido <strong>{modalEliminar.referencia}</strong> de <strong>{modalEliminar.cliente_nombre}</strong>?</p>
              <p className="pedidos-aviso">Esta acción no se puede deshacer.</p>
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

export default Pedidos;