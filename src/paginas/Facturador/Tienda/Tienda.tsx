import React, { useEffect, useState } from 'react';
import { supabase } from '../../../supabase.ts';
// Puedes dejar esta ruta por ahora, o mover el archivo a una carpeta global después
import '../../Administrador/Tienda/Tienda.css';

import { FaEye, FaSortUp, FaSortDown } from 'react-icons/fa';

/* ── Tipos ──────────────────────────────────────────────────────────────── */
interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  presentacion: string | null;
  precio: number;
  iva: 0 | 5 | 19;
  stock: number;
  activo: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

type ColOrdenable =
  | 'id'
  | 'codigo'
  | 'nombre'
  | 'precio'
  | 'iva'
  | 'stock'
  | 'activo'
  | 'fecha_creacion';

const REGISTROS_POR_PAGINA = 10;

/* ── Helpers de Formateo ────────────────────────────────────────────────── */
const formatFecha = (iso: string) =>
  new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'numeric',
    year: 'numeric',
  });

const formatPrecio = (valor: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);

/* ── Componente ─────────────────────────────────────────────────────────── */
const Tienda: React.FC = () => {
  const [productos, setProductos]     = useState<Producto[]>([]);
  const [filtrados, setFiltrados]     = useState<Producto[]>([]);
  const [cargando, setCargando]       = useState(true);
  const [busqueda, setBusqueda]       = useState('');
  const [pagina, setPagina]           = useState(1);
  const [filtroActivo, setFiltroActivo] = useState<'todos' | 'activo' | 'inactivo'>('todos');

  // Modal (Solo de lectura)
  const [modalDetalle, setModalDetalle]   = useState<Producto | null>(null);

  // Ordenamiento
  const [orden, setOrden] = useState<{ columna: ColOrdenable; direccion: 'asc' | 'desc' }>({
    columna: 'id',
    direccion: 'asc',
  });

  /* ── Cargar productos ──────────────────────────────────────────────────── */
  const cargarProductos = async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .order('id', { ascending: true });

    if (!error && data) {
      setProductos(data as Producto[]);
    }
    setCargando(false);
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  /* ── Buscador + filtro de estado ──────────────────────────────────────── */
  useEffect(() => {
    const q = busqueda.toLowerCase();
    let resultado = productos.filter(p =>
      p.nombre.toLowerCase().includes(q) ||
      p.codigo.toLowerCase().includes(q) ||
      (p.presentacion ?? '').toLowerCase().includes(q)
    );

    if (filtroActivo === 'activo')   resultado = resultado.filter(p => p.activo);
    if (filtroActivo === 'inactivo') resultado = resultado.filter(p => !p.activo);

    setFiltrados(resultado);
    setPagina(1);
  }, [busqueda, productos, filtroActivo]);

  /* ── Ordenamiento ─────────────────────────────────────────────────────── */
  const productosOrdenados = [...filtrados].sort((a, b) => {
    const valA = (a[orden.columna] ?? '') as string | number | boolean;
    const valB = (b[orden.columna] ?? '') as string | number | boolean;
    if (valA < valB) return orden.direccion === 'asc' ? -1 : 1;
    if (valA > valB) return orden.direccion === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (columna: ColOrdenable) => {
    const esAsc = orden.columna === columna && orden.direccion === 'asc';
    setOrden({ columna, direccion: esAsc ? 'desc' : 'asc' });
  };

  const iconoOrden = (col: ColOrdenable) => {
    if (orden.columna !== col) return null;
    return orden.direccion === 'asc' ? 
      <FaSortUp style={{ marginLeft: '4px', verticalAlign: 'middle' }} /> : 
      <FaSortDown style={{ marginLeft: '4px', verticalAlign: 'middle' }} />;
  };

  /* ── Paginación ───────────────────────────────────────────────────────── */
  const totalPaginas = Math.ceil(filtrados.length / REGISTROS_POR_PAGINA);
  const inicio       = (pagina - 1) * REGISTROS_POR_PAGINA;
  const paginados    = productosOrdenados.slice(inicio, inicio + REGISTROS_POR_PAGINA);

  /* ── Resumen stats ────────────────────────────────────────────────────── */
  const totalActivos   = productos.filter(p => p.activo).length;
  const totalInactivos = productos.filter(p => !p.activo).length;

  /* ── Render ────────────────────────────────────────────────────────────── */
  return (
    <div className="tienda-page">

      <div className="tienda-header">
        <h2 className="tienda-title">Catálogo de Tienda</h2>
        {/* El botón de crear producto fue removido */}
      </div>

      <div className="tienda-stats">
        <div className="stat-card">
          <span className="stat-label">Total productos</span>
          <span className="stat-valor">{productos.length}</span>
        </div>
        <div className="stat-card stat-card--activo">
          <span className="stat-label">Activos</span>
          <span className="stat-valor">{totalActivos}</span>
        </div>
        <div className="stat-card stat-card--inactivo">
          <span className="stat-label">Inactivos</span>
          <span className="stat-valor">{totalInactivos}</span>
        </div>
      </div>

      <div className="dash-card">
        <div className="tienda-toolbar">
          <div className="tienda-toolbar-left">
            <span className="toolbar-label">Mostrando</span>
            <span className="toolbar-count">{filtrados.length}</span>
            <span className="toolbar-label">registros</span>

            <div className="tienda-filtros">
              {(['todos', 'activo', 'inactivo'] as const).map(f => (
                <button
                  key={f}
                  className={`btn-filtro ${filtroActivo === f ? 'btn-filtro--activo' : ''}`}
                  onClick={() => setFiltroActivo(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="tienda-toolbar-right">
            <span className="toolbar-label">Buscar:</span>
            <input
              className="tienda-buscador"
              type="text"
              placeholder="Nombre, código o presentación..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        {cargando ? (
          <p className="tienda-cargando">Cargando productos...</p>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="pedidos-table tienda-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('id')} style={{ cursor: 'pointer' }}>
                      ID{iconoOrden('id')}
                    </th>
                    <th onClick={() => handleSort('codigo')} style={{ cursor: 'pointer' }}>
                      Código{iconoOrden('codigo')}
                    </th>
                    <th onClick={() => handleSort('nombre')} style={{ cursor: 'pointer' }}>
                      Nombre{iconoOrden('nombre')}
                    </th>
                    <th onClick={() => handleSort('stock')} style={{ cursor: 'pointer' }}>
                      Stock{iconoOrden('stock')}
                    </th>
                    <th onClick={() => handleSort('precio')} style={{ cursor: 'pointer' }}>
                      Precio{iconoOrden('precio')}
                    </th>
                    <th onClick={() => handleSort('iva')} style={{ cursor: 'pointer' }}>
                      IVA{iconoOrden('iva')}
                    </th>
                    <th onClick={() => handleSort('activo')} style={{ cursor: 'pointer' }}>
                      Estado{iconoOrden('activo')}
                    </th>
                    <th onClick={() => handleSort('fecha_creacion')} style={{ cursor: 'pointer' }}>
                      Creado{iconoOrden('fecha_creacion')}
                    </th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginados.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="tienda-vacio">No se encontraron productos.</td>
                    </tr>
                  ) : (
                    paginados.map(p => (
                      <tr key={p.id}>
                        <td>#{p.id}</td>
                        <td>
                          <span className="badge-codigo">{p.codigo}</span>
                        </td>
                        <td>
                          <div className="producto-nombre-stack">
                            <span className="producto-nombre-principal">{p.nombre}</span>
                            {p.presentacion && (
                              <span className="producto-presentacion">{p.presentacion}</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`badge-stock ${p.stock <= 5 ? (p.stock === 0 ? 'badge-stock--agotado' : 'badge-stock--bajo') : ''}`}>
                            {p.stock === 0 ? 'Agotado' : p.stock}
                          </span>
                        </td>
                        <td>
                          <span className="producto-precio">{formatPrecio(p.precio)}</span>
                        </td>
                        <td>
                          <span className={`badge-iva badge-iva--${p.iva}`}>{p.iva}%</span>
                        </td>
                        <td>
                          <span className={`badge-estado ${p.activo ? 'badge-estado--activo' : 'badge-estado--inactivo'}`}>
                            {p.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td>{formatFecha(p.fecha_creacion)}</td>
                        <td>
                          <div className="tienda-acciones">
                            <button
                              className="btn-accion btn-ver"
                              title="Ver detalle"
                              onClick={() => setModalDetalle(p)}
                            >
                              <FaEye />
                            </button>
                            {/* Botones de editar y eliminar fueron removidos */}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="tienda-paginacion">
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
                  >{i + 1}</button>
                ))}
                <button className="btn-pagina" disabled={pagina === totalPaginas || totalPaginas === 0} onClick={() => setPagina(p => p + 1)}>
                  Siguiente
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Modal Ver Detalle ──────────────────────────────────────────── */}
      {modalDetalle && (
        <div className="modal-overlay" onClick={() => setModalDetalle(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detalle del Producto</h3>
              <button className="modal-cerrar" onClick={() => setModalDetalle(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="detalle-seccion-titulo">Identificación</p>
              <div className="detalle-fila">
                <span>Código</span>
                <strong><span className="badge-codigo">{modalDetalle.codigo}</span></strong>
              </div>
              <div className="detalle-fila"><span>Nombre</span><strong>{modalDetalle.nombre}</strong></div>
              <div className="detalle-fila">
                <span>Presentación</span>
                <strong>{modalDetalle.presentacion || '—'}</strong>
              </div>

              <p className="detalle-seccion-titulo">Precios e Inventario</p>
              <div className="detalle-fila">
                <span>Precio base</span>
                <strong>{formatPrecio(modalDetalle.precio)}</strong>
              </div>
              <div className="detalle-fila">
                <span>IVA</span>
                <strong>
                  <span className={`badge-iva badge-iva--${modalDetalle.iva}`}>{modalDetalle.iva}%</span>
                </strong>
              </div>
              <div className="detalle-fila">
                <span>Precio con IVA</span>
                <strong>{formatPrecio(modalDetalle.precio * (1 + modalDetalle.iva / 100))}</strong>
              </div>
              <div className="detalle-fila">
                <span>Stock Actual</span>
                <strong>
                  <span className={`badge-stock ${modalDetalle.stock <= 5 ? (modalDetalle.stock === 0 ? 'badge-stock--agotado' : 'badge-stock--bajo') : ''}`}>
                    {modalDetalle.stock === 0 ? 'Agotado' : `${modalDetalle.stock} Unidades`}
                  </span>
                </strong>
              </div>

              <p className="detalle-seccion-titulo">Estado</p>
              <div className="detalle-fila">
                <span>Estado actual</span>
                <strong>
                  <span className={`badge-estado ${modalDetalle.activo ? 'badge-estado--activo' : 'badge-estado--inactivo'}`}>
                    {modalDetalle.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </strong>
              </div>

              <p className="detalle-seccion-titulo">Auditoría</p>
              <div className="detalle-fila"><span>Fecha creación</span><strong>{formatFecha(modalDetalle.fecha_creacion)}</strong></div>
              <div className="detalle-fila"><span>Última actualización</span><strong>{formatFecha(modalDetalle.fecha_actualizacion)}</strong></div>
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

export default Tienda;