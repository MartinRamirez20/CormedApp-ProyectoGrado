import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../../supabase.ts';
import './Tienda.css';

import { FaEdit, FaTrash, FaPlus, FaEye, FaSortUp, FaSortDown } from 'react-icons/fa';

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

interface FormProducto {
  codigo: string;
  nombre: string;
  presentacion: string;
  precio: string;
  iva: string;
  stock: string;
  activo: boolean;
}

const FORM_VACIO: FormProducto = {
  codigo: '',
  nombre: '',
  presentacion: '',
  precio: '',
  iva: '19',
  stock: '0',
  activo: true,
};

const REGISTROS_POR_PAGINA = 10;

/* ── Helpers de Validación y Formateo ───────────────────────────────────── */
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
    minimumFractionDigits: 2, // No muestra decimales si es un número entero (ej: $5.000)
    maximumFractionDigits: 2, // Pero si tiene decimales, muestra hasta 2 (ej: $5.99)
  }).format(valor);

// Función centralizada para validar productos
const validarProducto = (form: FormProducto): string | null => {
  if (!form.codigo.trim()) return 'El código (SKU) es obligatorio.';
  if (!form.nombre.trim()) return 'El nombre del producto es obligatorio.';

  if (!form.precio.trim()) return 'El precio es obligatorio.';
  // Permite números con o sin decimales (separados por un punto)
  if (!/^\d+(\.\d+)?$/.test(form.precio)) return 'El precio debe ser un número válido mayor o igual a 0.';

  if (!form.stock.trim()) return 'El stock es obligatorio.';
  // Exclusivamente números enteros (sin puntos, sin comas, sin letras)
  if (!/^\d+$/.test(form.stock)) return 'El stock debe ser un número entero mayor o igual a 0 (sin decimales).';

  return null;
};

/* ── Componente ─────────────────────────────────────────────────────────── */
const Tienda: React.FC = () => {
  const [productos, setProductos]     = useState<Producto[]>([]);
  const [filtrados, setFiltrados]     = useState<Producto[]>([]);
  const [cargando, setCargando]       = useState(true);
  const [busqueda, setBusqueda]       = useState('');
  const [pagina, setPagina]           = useState(1);
  const [filtroActivo, setFiltroActivo] = useState<'todos' | 'activo' | 'inactivo'>('todos');

  // Modales
  const [modalDetalle, setModalDetalle]   = useState<Producto | null>(null);
  const [modalEditar, setModalEditar]     = useState<Producto | null>(null);
  const [modalEliminar, setModalEliminar] = useState<Producto | null>(null);
  const [modalCrear, setModalCrear]       = useState(false);

  // Formularios
  const [formEditar, setFormEditar] = useState<FormProducto>(FORM_VACIO);
  const [formCrear, setFormCrear]   = useState<FormProducto>(FORM_VACIO);

  // Estado carga / mensajes
  const [guardando, setGuardando]         = useState(false);
  const [creando, setCreando]             = useState(false);
  const [mensajeEditar, setMensajeEditar] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [mensajeCrear, setMensajeCrear]   = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  //Link Dashboard
  const location = useLocation(); 
  const navigate = useNavigate();

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
    if (location.state && location.state.abrirModalCrear) {
      setModalCrear(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

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

  /* ── Abrir edición ────────────────────────────────────────────────────── */
  const handleAbrirEditar = (p: Producto) => {
    setModalEditar(p);
    setMensajeEditar(null);
    setFormEditar({
      codigo:       p.codigo,
      nombre:       p.nombre,
      presentacion: p.presentacion ?? '',
      precio:       String(p.precio),
      iva:          String(p.iva),
      stock:        String(p.stock),
      activo:       p.activo,
    });
  };

  /* ── Guardar edición ──────────────────────────────────────────────────── */
  const handleGuardarEdicion = async () => {
    if (!modalEditar) return;

    const errorValidacion = validarProducto(formEditar);
    if (errorValidacion) {
      setMensajeEditar({ tipo: 'error', texto: errorValidacion });
      return;
    }

    const precioNum = parseFloat(formEditar.precio);
    const stockNum = parseInt(formEditar.stock, 10);

    setGuardando(true);
    setMensajeEditar(null);

    const { error } = await supabase
      .from('productos')
      .update({
        codigo:              formEditar.codigo,
        nombre:              formEditar.nombre,
        presentacion:        formEditar.presentacion || null,
        precio:              precioNum,
        iva:                 parseInt(formEditar.iva),
        stock:               stockNum,
        activo:              formEditar.activo,
        fecha_actualizacion: new Date().toISOString(),
      })
      .eq('id', modalEditar.id);

    if (error) {
      setMensajeEditar({ tipo: 'error', texto: `Error: ${error.message}` });
    } else {
      setMensajeEditar({ tipo: 'ok', texto: '¡Producto actualizado correctamente!' });
      await cargarProductos();
      setTimeout(() => { setModalEditar(null); setMensajeEditar(null); }, 1200);
    }
    setGuardando(false);
  };

  /* ── Eliminar ─────────────────────────────────────────────────────────── */
  const handleEliminar = async () => {
    if (!modalEliminar) return;
    setGuardando(true);

    const { error } = await supabase
      .from('productos')
      .delete()
      .eq('id', modalEliminar.id);

    if (!error) {
      await cargarProductos();
      setModalEliminar(null);
    }
    setGuardando(false);
  };

  /* ── Crear producto ───────────────────────────────────────────────────── */
  const handleCrearProducto = async () => {
    const errorValidacion = validarProducto(formCrear);
    if (errorValidacion) {
      setMensajeCrear({ tipo: 'error', texto: errorValidacion });
      return;
    }

    const precioNum = parseFloat(formCrear.precio);
    const stockNum = parseInt(formCrear.stock, 10);

    setCreando(true);
    setMensajeCrear(null);

    const { error } = await supabase.from('productos').insert({
      codigo:       formCrear.codigo,
      nombre:       formCrear.nombre,
      presentacion: formCrear.presentacion || null,
      precio:       precioNum,
      iva:          parseInt(formCrear.iva),
      stock:        stockNum,
      activo:       formCrear.activo,
    });

    if (error) {
      setMensajeCrear({ tipo: 'error', texto: `Error: ${error.message}` });
    } else {
      setMensajeCrear({ tipo: 'ok', texto: '¡Producto creado exitosamente!' });
      await cargarProductos();
      setTimeout(() => {
        setModalCrear(false);
        setMensajeCrear(null);
        setFormCrear(FORM_VACIO);
      }, 1200);
    }
    setCreando(false);
  };

  /* ── Resumen stats ────────────────────────────────────────────────────── */
  const totalActivos   = productos.filter(p => p.activo).length;
  const totalInactivos = productos.filter(p => !p.activo).length;

  /* ── Render ────────────────────────────────────────────────────────────── */
  return (
    <div className="tienda-page">

      <div className="tienda-header">
        <h2 className="tienda-title">Tienda</h2>
        <button
          className="btn-nuevo-producto"
          onClick={() => { setFormCrear(FORM_VACIO); setMensajeCrear(null); setModalCrear(true); }}
        >
          <FaPlus /> Nuevo Producto
        </button>
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
                        {/* Nombre + presentación */}
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
                            <button
                              className="btn-accion btn-editar"
                              title="Editar"
                              onClick={() => handleAbrirEditar(p)}
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="btn-accion btn-eliminar"
                              title="Eliminar"
                              onClick={() => setModalEliminar(p)}
                            >
                              <FaTrash />
                            </button>
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

      {/* ── Modal Editar ──────────────────────────────────────────────── */}
      {modalEditar && (
        <div className="modal-overlay" onClick={() => setModalEditar(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Editar Producto</h3>
              <button className="modal-cerrar" onClick={() => setModalEditar(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="detalle-seccion-titulo">Identificación</p>
              <div className="form-fila">
                <div className="perfil-campo">
                  <label>Código (SKU) *</label>
                  <input
                    value={formEditar.codigo}
                    placeholder="Ej: PROD-001"
                    onChange={e => setFormEditar(p => ({ ...p, codigo: e.target.value }))}
                  />
                </div>
              </div>
              <div className="perfil-campo">
                <label>Nombre *</label>
                <input
                  value={formEditar.nombre}
                  placeholder="Nombre del producto"
                  onChange={e => setFormEditar(p => ({ ...p, nombre: e.target.value }))}
                />
              </div>
              <div className="perfil-campo">
                <label>Presentación</label>
                <input
                  value={formEditar.presentacion}
                  placeholder="Ej: caja x 12, frasco 250ml"
                  onChange={e => setFormEditar(p => ({ ...p, presentacion: e.target.value }))}
                />
              </div>

              <p className="detalle-seccion-titulo">Precios e Inventario</p>
              <div className="form-fila">
                <div className="perfil-campo">
                  <label>Precio *</label>
                  <input
                    type="text"
                    placeholder="0.00"
                    value={formEditar.precio}
                    onChange={e => {
                      const val = e.target.value;
                      // Permitir solo números y punto. Si hay más de un punto, lo ignora.
                      const filtrado = val.replace(/[^0-9.]/g, '');
                      const partes = filtrado.split('.');
                      const final = partes.length > 2 ? partes[0] + '.' + partes.slice(1).join('') : filtrado;
                      setFormEditar(p => ({ ...p, precio: final }));
                    }}
                  />
                </div>
                <div className="perfil-campo">
                  <label>Stock *</label>
                  <input
                    type="text"
                    placeholder="0"
                    value={formEditar.stock}
                    onChange={e => {
                      // Permitir solo números (elimina puntos y letras)
                      const final = e.target.value.replace(/\D/g, '');
                      setFormEditar(p => ({ ...p, stock: final }));
                    }}
                  />
                </div>
                <div className="perfil-campo">
                  <label>IVA</label>
                  <select
                    value={formEditar.iva}
                    onChange={e => setFormEditar(p => ({ ...p, iva: e.target.value }))}
                  >
                    <option value="0">0% — Exento</option>
                    <option value="5">5%</option>
                    <option value="19">19%</option>
                  </select>
                </div>
              </div>

              <p className="detalle-seccion-titulo">Estado</p>
              <div className="perfil-campo perfil-campo--toggle">
                <label>Producto activo</label>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={formEditar.activo}
                    onChange={e => setFormEditar(p => ({ ...p, activo: e.target.checked }))}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>

              {mensajeEditar && (
                <p className={`perfil-mensaje ${mensajeEditar.tipo === 'ok' ? 'perfil-ok' : 'perfil-error'}`}>
                  {mensajeEditar.texto}
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

      {/* ── Modal Confirmar Eliminar ───────────────────────────────────── */}
      {modalEliminar && (
        <div className="modal-overlay" onClick={() => setModalEliminar(null)}>
          <div className="modal-box modal-pequeño" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Eliminar Producto</h3>
              <button className="modal-cerrar" onClick={() => setModalEliminar(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p>¿Estás seguro de eliminar <strong>{modalEliminar.nombre}</strong>?</p>
              <p className="tienda-aviso">Esta acción no se puede deshacer.</p>
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

      {/* ── Modal Crear Producto ───────────────────────────────────────── */}
      {modalCrear && (
        <div className="modal-overlay" onClick={() => setModalCrear(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Nuevo Producto</h3>
              <button className="modal-cerrar" onClick={() => setModalCrear(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="detalle-seccion-titulo">Identificación</p>
              <div className="perfil-campo">
                <label>Código (SKU) *</label>
                <input
                  placeholder="Ej: PROD-001"
                  value={formCrear.codigo}
                  onChange={e => setFormCrear(p => ({ ...p, codigo: e.target.value }))}
                />
              </div>
              <div className="perfil-campo">
                <label>Nombre *</label>
                <input
                  placeholder="Nombre del producto"
                  value={formCrear.nombre}
                  onChange={e => setFormCrear(p => ({ ...p, nombre: e.target.value }))}
                />
              </div>
              <div className="perfil-campo">
                <label>Presentación</label>
                <input
                  placeholder="Ej: caja x 12, frasco 250ml"
                  value={formCrear.presentacion}
                  onChange={e => setFormCrear(p => ({ ...p, presentacion: e.target.value }))}
                />
              </div>

              <p className="detalle-seccion-titulo">Precios e Inventario</p>
              <div className="form-fila">
                <div className="perfil-campo">
                  <label>Precio *</label>
                  <input
                    type="text"
                    placeholder="0.00"
                    value={formCrear.precio}
                    onChange={e => {
                      const val = e.target.value;
                      // Permitir solo números y punto.
                      const filtrado = val.replace(/[^0-9.]/g, '');
                      const partes = filtrado.split('.');
                      const final = partes.length > 2 ? partes[0] + '.' + partes.slice(1).join('') : filtrado;
                      setFormCrear(p => ({ ...p, precio: final }));
                    }}
                  />
                </div>
                <div className="perfil-campo">
                  <label>Stock Inicial *</label>
                  <input
                    type="text"
                    placeholder="0"
                    value={formCrear.stock}
                    onChange={e => {
                      // Permitir solo números enteros
                      const final = e.target.value.replace(/\D/g, '');
                      setFormCrear(p => ({ ...p, stock: final }));
                    }}
                  />
                </div>
                <div className="perfil-campo">
                  <label>IVA</label>
                  <select
                    value={formCrear.iva}
                    onChange={e => setFormCrear(p => ({ ...p, iva: e.target.value }))}
                  >
                    <option value="0">0% — Exento</option>
                    <option value="5">5%</option>
                    <option value="19">19%</option>
                  </select>
                </div>
              </div>

              <p className="detalle-seccion-titulo">Estado</p>
              <div className="perfil-campo perfil-campo--toggle">
                <label>Producto activo</label>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={formCrear.activo}
                    onChange={e => setFormCrear(p => ({ ...p, activo: e.target.checked }))}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>

              {mensajeCrear && (
                <p className={`perfil-mensaje ${mensajeCrear.tipo === 'ok' ? 'perfil-ok' : 'perfil-error'}`}>
                  {mensajeCrear.texto}
                </p>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-modal-cancelar" onClick={() => setModalCrear(false)}>Cancelar</button>
              <button className="perfil-btn-guardar" onClick={handleCrearProducto} disabled={creando}>
                {creando ? 'Creando...' : 'Crear Producto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tienda;