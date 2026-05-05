import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../supabase.ts';
import './Pedidos.css';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FaEye, FaEdit, FaTrash, FaPlus, FaSortUp, FaSortDown, FaFilePdf } from 'react-icons/fa';

const EMPRESA = {
  nombre:    'Comercializadora Médica CORMED S.A.S.',
  nit:       '900.123.456-7',
  direccion: 'Calle 123 # 45-67, Bogotá D.C.',
  telefono:  '+57 601 234 5678',
  correo:    'ventas@miempresa.com',
  url:       'www.miempresa.com',
};

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
  cliente_id: string; 
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
  const [modalEliminar, setModalEliminar] = useState<Pedido | null>(null);
  const [guardando, setGuardando]         = useState(false);

  const [orden, setOrden] = useState<{ columna: string; direccion: 'asc' | 'desc' }>({
    columna: 'id',
    direccion: 'desc',
  });

  // ── Generar PDF Asíncrono (Busca datos faltantes en BD) ──────────────
  const handleDescargarPDF = async (pedido: Pedido) => {
    try {
      // Buscar Vendedor
      const { data: vendedorBD } = await supabase.from('usuarios').select('*').eq('id', pedido.vendedor_id).single();
      
      // Buscar Cliente (Puede ser un Cliente en BIGINT o un Vendedor en UUID)
      let clienteBD = null;
      const esUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pedido.cliente_id);
      
      if (esUUID) {
        const { data } = await supabase.from('usuarios').select('*').eq('id', pedido.cliente_id).single();
        if (data) clienteBD = data;
      } else {
        const { data } = await supabase.from('clientes').select('*').eq('id', pedido.cliente_id).single();
        if (data) clienteBD = data;
      }

      const doc = new jsPDF();
      const margin = 14;
      const colWidth = 60; 

      // --- ENCABEZADO ---
      doc.setFontSize(18);
      doc.setTextColor(81, 45, 168);
      doc.text("COTIZACIÓN / PEDIDO", margin, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Referencia: ${pedido.referencia} | Fecha: ${formatFecha(pedido.fecha_creacion)}`, margin, 28);

      doc.setDrawColor(230, 230, 230);
      doc.line(margin, 32, 196, 32);

      // --- BLOQUE DE 3 COLUMNAS ---
      let yPos = 40;
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);

      // Columna 1: Empresa
      doc.setFont("helvetica", "bold");
      doc.text("EMISOR", margin, yPos);
      doc.setFont("helvetica", "normal");
      doc.text([
        EMPRESA.nombre,
        `NIT: ${EMPRESA.nit}`,
        `Dir: ${EMPRESA.direccion}`,
        `Tel: ${EMPRESA.telefono}`,
        `Email: ${EMPRESA.correo}`
      ], margin, yPos + 5);

      // Columna 2: Vendedor
      const col2X = margin + colWidth + 5;
      doc.setFont("helvetica", "bold");
      doc.text("VENDEDOR", col2X, yPos);
      doc.setFont("helvetica", "normal");
      doc.text([
        pedido.vendedor_nombre,
        `Email: ${vendedorBD?.correo || 'N/A'}`,
        `Tel: ${vendedorBD?.telefono || 'N/A'}`
      ], col2X, yPos + 5);

      // Columna 3: Cliente
      const col3X = margin + (colWidth * 2) + 10;
      doc.setFont("helvetica", "bold");
      doc.text("FACTURAR A", col3X, yPos);
      doc.setFont("helvetica", "normal");
      
      const datosCliente = [pedido.cliente_nombre];
      if (clienteBD?.nombre_comercial) datosCliente.push(`Comercial: ${clienteBD.nombre_comercial}`);
      datosCliente.push(`ID: ${clienteBD?.numero_identificacion || 'N/A'}`);
      datosCliente.push(`Email: ${clienteBD?.correo || 'N/A'}`);
      
      const telCliente = clienteBD?.telefono_principal || clienteBD?.telefono || 'N/A';
      datosCliente.push(`Tel: ${telCliente}`);
      
      if (clienteBD?.telefono_alternativo) datosCliente.push(`Tel 2: ${clienteBD.telefono_alternativo}`);
      datosCliente.push(`Dir: ${clienteBD?.direccion || 'N/A'}`);

      doc.text(datosCliente, col3X, yPos + 5);

      // --- TABLA DE PRODUCTOS ---
      autoTable(doc, {
        startY: yPos + 45,
        head: [["Referencia", "Producto", "Cant.", "P. Unitario", "IVA", "Subtotal"]],
        body: pedido.productos.map(p => [
          p.referencia, p.nombre, p.cantidad, 
          formatCurrency(p.precio_unitario), `${p.iva_porcentaje}%`, formatCurrency(p.subtotal)
        ]),
        headStyles: { fillColor: [81, 45, 168] },
        styles: { fontSize: 8 }
      });

      // --- TOTALES ---
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(10);
      doc.text(`Subtotal: ${formatCurrency(pedido.monto_subtotal)}`, 196, finalY, { align: 'right' });
      doc.text(`IVA: ${formatCurrency(pedido.monto_iva)}`, 196, finalY + 6, { align: 'right' });
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`TOTAL: ${formatCurrency(pedido.monto_total)}`, 196, finalY + 14, { align: 'right' });

      doc.save(`Factura_${pedido.referencia}.pdf`);
    } catch (error) {
      console.error("Error generando el PDF:", error);
      alert("Hubo un error al recopilar los datos para el PDF.");
    }
  };

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
      <FaSortUp className="sort-icon" /> : 
      <FaSortDown className="sort-icon" />;
  };

  const totalPaginas = Math.ceil(filtrados.length / REGISTROS_POR_PAGINA);
  const inicio       = (pagina - 1) * REGISTROS_POR_PAGINA;
  const paginados    = pedidosOrdenados.slice(inicio, inicio + REGISTROS_POR_PAGINA);

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
      <div className="pedidos-header">
        <h2 className="pedidos-title">
          <i className="bi bi-bag"></i> Pedidos
        </h2>
        <button className="btn-nuevo-pedido" onClick={() => navigate('/admin/pedidos/crear')}>
          <FaPlus /> Nuevo Pedido
        </button>
      </div>

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
        <div className="pedidos-toolbar">
          <div className="pedidos-toolbar-left">
            <span className="toolbar-label">Mostrar</span>
            <span className="toolbar-count">{filtrados.length}</span>
            <span className="toolbar-label">registros</span>

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
                    <th className="sortable-col" onClick={() => handleSort('referencia')}>Referencia{sortIcon('referencia')}</th>
                    <th className="sortable-col" onClick={() => handleSort('cliente_nombre')}>Cliente{sortIcon('cliente_nombre')}</th>
                    <th className="sortable-col" onClick={() => handleSort('vendedor_nombre')}>Vendedor{sortIcon('vendedor_nombre')}</th>
                    <th className="sortable-col" onClick={() => handleSort('monto_total')}>Total{sortIcon('monto_total')}</th>
                    <th className="sortable-col" onClick={() => handleSort('estado')}>Estado{sortIcon('estado')}</th>
                    <th className="sortable-col" onClick={() => handleSort('fecha_creacion')}>Fecha{sortIcon('fecha_creacion')}</th>
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
                      <td><span className={getEstadoBadge(p.estado)}>{getEstadoLabel(p.estado)}</span></td>
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

                        {p.estado === 'pendiente' ? (
                          <button
                            className="btn-accion btn-editar"
                            title="Editar pedido"
                            onClick={() => navigate(`/admin/pedidos/editar/${p.id}`)}
                          >
                            <FaEdit className="icons" />
                          </button>
                        ) : (
                          <button
                            className="btn-accion btn-pdf"
                            title="Descargar PDF"
                            onClick={() => handleDescargarPDF(p)}
                          >
                            <FaFilePdf className="icons" />
                          </button>
                        )}

                        <button
                          className="btn-accion btn-eliminar"
                          title="Eliminar pedido"
                          disabled={p.estado !== 'pendiente'}
                          onClick={() => p.estado === 'pendiente' && setModalEliminar(p)}
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

            <div className="pedidos-paginacion">
              <span className="paginacion-info">
                Mostrando {filtrados.length === 0 ? 0 : inicio + 1} al {Math.min(inicio + REGISTROS_POR_PAGINA, filtrados.length)} de {filtrados.length} registros
              </span>
              <div className="paginacion-botones">
                <button className="btn-pagina" disabled={pagina === 1} onClick={() => setPagina(p => p - 1)}>Anterior</button>
                {Array.from({ length: totalPaginas }, (_, i) => (
                  <button key={i + 1} className={`btn-pagina ${pagina === i + 1 ? 'activa' : ''}`} onClick={() => setPagina(i + 1)}>{i + 1}</button>
                ))}
                <button className="btn-pagina" disabled={pagina === totalPaginas || totalPaginas === 0} onClick={() => setPagina(p => p + 1)}>Siguiente</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modales sin cambios mayores */}
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

              <h4 className="detalle-subtitulo">Productos</h4>
              <table className="detalle-productos-table">
                <thead>
                  <tr>
                    <th>Referencia</th><th>Nombre</th><th>Cant.</th><th>P. Unitario</th><th>IVA %</th><th>Subtotal</th>
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