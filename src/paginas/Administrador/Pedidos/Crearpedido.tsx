import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../supabase.ts';
import './Crearpedido.css';

import { FaSearch, FaPlus, FaTrash } from 'react-icons/fa';

// ── Interfaces ─────────────────────────────────────────────────────────────
interface Cliente {
  id: number;
  nombre_personal: string;
  nombre_comercial: string | null;
  tipo_identificacion: string;
  numero_identificacion: string;
  correo: string | null;
  telefono_principal: string;
  direccion: string | null;
}

interface ProductoBD {
  id: number;
  referencia: string;
  nombre: string;
  precio_venta: number;
  iva_porcentaje: number;
  stock_actual: number;
  activo: boolean;
}

interface LineaPedido {
  producto_id: number;
  referencia: string;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  iva_porcentaje: number;
  subtotal: number;
}

interface UsuarioSesion {
  id: string;
  nombre_razon_social: string;
  correo: string;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v);

// ── Datos de la empresa (configura según tu proyecto) ─────────────────────
const EMPRESA = {
  nombre:    'Mi Empresa S.A.S.',
  nit:       '900.123.456-7',
  direccion: 'Calle 123 # 45-67, Bogotá D.C.',
  telefono:  '+57 601 234 5678',
  correo:    'ventas@miempresa.com',
  url:       'www.miempresa.com',
};

// Genera un número de referencia único
const generarReferencia = () => {
  const now   = new Date();
  const yy    = String(now.getFullYear()).slice(2);
  const mm    = String(now.getMonth() + 1).padStart(2, '0');
  const dd    = String(now.getDate()).padStart(2, '0');
  const rand  = String(Math.floor(Math.random() * 9000) + 1000);
  return `PED-${yy}${mm}${dd}-${rand}`;
};

const CrearPedido: React.FC = () => {
  const navigate = useNavigate();

  // ── Estado de sesión ─────────────────────────────────────────────────────
  const [vendedor, setVendedor]     = useState<UsuarioSesion | null>(null);
  const [referencia]                = useState(generarReferencia());

  // ── Cliente ───────────────────────────────────────────────────────────────
  const [clientes, setClientes]           = useState<Cliente[]>([]);
  const [busqCliente, setBusqCliente]     = useState('');
  const [clienteFiltrados, setClienteF]  = useState<Cliente[]>([]);
  const [clienteSelec, setClienteSelec]  = useState<Cliente | null>(null);
  const [dropCliente, setDropCliente]    = useState(false);

  // ── Productos ─────────────────────────────────────────────────────────────
  const [productos, setProductos]        = useState<ProductoBD[]>([]);
  const [busqProducto, setBusqProducto]  = useState('');
  const [prodFiltrados, setProdFiltrados]= useState<ProductoBD[]>([]);
  const [dropProducto, setDropProducto]  = useState(false);

  // ── Líneas del pedido ─────────────────────────────────────────────────────
  const [lineas, setLineas] = useState<LineaPedido[]>([]);

  // ── Notas y estado ────────────────────────────────────────────────────────
  const [notas, setNotas]       = useState('');
  const [creando, setCreando]   = useState(false);
  const [mensaje, setMensaje]   = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  // ── Cargar datos ──────────────────────────────────────────────────────────
  useEffect(() => {
    const cargarTodo = async () => {
      // Sesión
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: u } = await supabase
          .from('usuarios')
          .select('id, nombre_razon_social, correo')
          .eq('id', session.user.id)
          .single();
        if (u) setVendedor(u);
      }

      // Clientes
      const { data: cls } = await supabase
        .from('clientes')
        .select('id, nombre_personal, nombre_comercial, tipo_identificacion, numero_identificacion, correo, telefono_principal, direccion')
        .order('nombre_personal');
      if (cls) setClientes(cls as Cliente[]);

      // Productos
      const { data: prods } = await supabase
        .from('productos')
        .select('id, referencia, nombre, precio_venta, iva_porcentaje, stock_actual, activo')
        .eq('activo', true)
        .order('nombre');
      if (prods) setProductos(prods as ProductoBD[]);
    };
    cargarTodo();
  }, []);

  // ── Filtro cliente ────────────────────────────────────────────────────────
  useEffect(() => {
    const q = busqCliente.toLowerCase();
    setClienteF(
      clientes.filter(c =>
        c.nombre_personal.toLowerCase().includes(q) ||
        (c.nombre_comercial ?? '').toLowerCase().includes(q) ||
        c.numero_identificacion.toLowerCase().includes(q)
      ).slice(0, 8)
    );
  }, [busqCliente, clientes]);

  // ── Filtro producto ───────────────────────────────────────────────────────
  useEffect(() => {
    const q = busqProducto.toLowerCase();
    setProdFiltrados(
      productos.filter(p =>
        p.nombre.toLowerCase().includes(q) ||
        p.referencia.toLowerCase().includes(q)
      ).slice(0, 8)
    );
  }, [busqProducto, productos]);

  // ── Agregar producto al pedido ────────────────────────────────────────────
  const agregarProducto = (prod: ProductoBD) => {
    const yaExiste = lineas.find(l => l.producto_id === prod.id);
    if (yaExiste) {
      // Incrementar cantidad si ya existe
      cambiarCantidad(prod.id, yaExiste.cantidad + 1, prod.stock_actual);
    } else {
      const nueva: LineaPedido = {
        producto_id:    prod.id,
        referencia:     prod.referencia,
        nombre:         prod.nombre,
        cantidad:       1,
        precio_unitario: prod.precio_venta,
        iva_porcentaje:  prod.iva_porcentaje,
        subtotal:        prod.precio_venta,
      };
      setLineas(prev => [...prev, nueva]);
    }
    setBusqProducto('');
    setDropProducto(false);
  };

  const cambiarCantidad = useCallback((prodId: number, nuevaCant: number, stockMax?: number) => {
    if (nuevaCant < 1) return;
    setLineas(prev => prev.map(l => {
      if (l.producto_id !== prodId) return l;
      const prod = stockMax !== undefined
        ? productos.find(p => p.id === prodId)
        : null;
      const maxStock = prod?.stock_actual ?? stockMax ?? 9999;
      const cant = Math.min(nuevaCant, maxStock);
      return { ...l, cantidad: cant, subtotal: cant * l.precio_unitario };
    }));
  }, [productos]);

  const cambiarPrecio = (prodId: number, nuevoPrecio: number) => {
    setLineas(prev => prev.map(l =>
      l.producto_id === prodId
        ? { ...l, precio_unitario: nuevoPrecio, subtotal: l.cantidad * nuevoPrecio }
        : l
    ));
  };

  const quitarLinea = (prodId: number) =>
    setLineas(prev => prev.filter(l => l.producto_id !== prodId));

  // ── Totales ───────────────────────────────────────────────────────────────
  const subtotalGeneral = lineas.reduce((acc, l) => acc + l.subtotal, 0);
  const ivaGeneral      = lineas.reduce((acc, l) => acc + (l.subtotal * l.iva_porcentaje / 100), 0);
  const totalGeneral    = subtotalGeneral + ivaGeneral;

  // ── Guardar pedido ────────────────────────────────────────────────────────
  const handleCrear = async () => {
    if (!clienteSelec) {
      setMensaje({ tipo: 'error', texto: 'Debes seleccionar un cliente.' });
      return;
    }
    if (lineas.length === 0) {
      setMensaje({ tipo: 'error', texto: 'Agrega al menos un producto al pedido.' });
      return;
    }
    if (!vendedor) {
      setMensaje({ tipo: 'error', texto: 'No se pudo obtener la sesión del vendedor.' });
      return;
    }

    setCreando(true);
    setMensaje(null);

    const productosJSON = lineas.map(l => ({
      id:              l.producto_id,
      referencia:      l.referencia,
      nombre:          l.nombre,
      cantidad:        l.cantidad,
      precio_unitario: l.precio_unitario,
      iva_porcentaje:  l.iva_porcentaje,
      subtotal:        l.subtotal,
    }));

    const { error } = await supabase.from('pedidos').insert({
      referencia,
      cliente_id:      clienteSelec.id,
      cliente_nombre:  clienteSelec.nombre_personal,
      vendedor_id:     vendedor.id,
      vendedor_nombre: vendedor.nombre_razon_social,
      productos:       productosJSON,
      monto_subtotal:  subtotalGeneral,
      monto_iva:       ivaGeneral,
      monto_total:     totalGeneral,
      estado:          'pendiente',
      notas:           notas || null,
    });

    if (error) {
      setMensaje({ tipo: 'error', texto: `Error al crear el pedido: ${error.message}` });
      setCreando(false);
    } else {
      setMensaje({ tipo: 'ok', texto: '¡Pedido creado exitosamente!' });
      setTimeout(() => navigate('/admin/pedidos'), 1500);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="crear-pedido-page">

      {/* ── Encabezado de página ── */}
      <div className="cp-page-header">
        <button className="cp-btn-volver" onClick={() => navigate('/admin/pedidos/crear')}>
          ← Volver a Pedidos
        </button>
        <h2 className="cp-page-title">Nuevo Pedido</h2>
        <div className="cp-header-actions">
          <button className="cp-btn-crear" onClick={handleCrear} disabled={creando}>
            {creando ? 'Guardando...' : 'Guardar Pedido'}
          </button>
        </div>
      </div>

      {mensaje && (
        <div className={`cp-mensaje ${mensaje.tipo === 'ok' ? 'cp-msg-ok' : 'cp-msg-error'}`}>
          {mensaje.texto}
        </div>
      )}

      {/* ── Documento tipo factura ── */}
      <div className="cp-factura">

        {/* ══ CABECERA FACTURA ══ */}
        <div className="cp-factura-header">

          {/* Columna 1: Datos empresa */}
          <div className="cp-col-empresa">
            <div className="cp-empresa-logo">
              {EMPRESA.nombre.charAt(0)}
            </div>
            <div className="cp-empresa-info">
              <h3 className="cp-empresa-nombre">{EMPRESA.nombre}</h3>
              <p><span className="cp-lbl">NIT:</span> {EMPRESA.nit}</p>
              <p><span className="cp-lbl">Dir:</span> {EMPRESA.direccion}</p>
              <p><span className="cp-lbl">Tel:</span> {EMPRESA.telefono}</p>
              <p><span className="cp-lbl">Email:</span> {EMPRESA.correo}</p>
              <p><span className="cp-lbl">Web:</span> {EMPRESA.url}</p>
            </div>
          </div>

          {/* Columna 2: Datos vendedor */}
          <div className="cp-col-vendedor">
            <div className="cp-seccion-titulo">Vendedor</div>
            {vendedor ? (
              <div className="cp-datos-bloque">
                <p><span className="cp-lbl">Nombre:</span> {vendedor.nombre_razon_social}</p>
                <p><span className="cp-lbl">Correo:</span> {vendedor.correo}</p>
              </div>
            ) : (
              <p className="cp-placeholder">Cargando sesión...</p>
            )}
          </div>

          {/* Columna 3: Número de pedido y cliente */}
          <div className="cp-col-pedido">
            <div className="cp-numero-pedido">
              <span className="cp-num-label">N° PEDIDO</span>
              <span className="cp-num-valor">{referencia}</span>
              <span className="cp-num-fecha">{new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
            </div>

            <div className="cp-seccion-titulo" style={{ marginTop: 16 }}>Cliente</div>
            <div className="cp-cliente-buscador">
              <div className="cp-input-icon-wrap">
                <FaSearch className="cp-input-icon" />
                <input
                  className="cp-input"
                  type="text"
                  placeholder="Buscar cliente por nombre o ID..."
                  value={clienteSelec ? clienteSelec.nombre_personal : busqCliente}
                  onFocus={() => { setDropCliente(true); if (clienteSelec) { setBusqCliente(''); setClienteSelec(null); } }}
                  onChange={e => { setBusqCliente(e.target.value); setDropCliente(true); }}
                />
              </div>
              {dropCliente && clienteFiltrados.length > 0 && (
                <div className="cp-dropdown">
                  {clienteFiltrados.map(c => (
                    <div
                      key={c.id}
                      className="cp-dropdown-item"
                      onMouseDown={() => { setClienteSelec(c); setBusqCliente(''); setDropCliente(false); }}
                    >
                      <span className="cp-drop-nombre">{c.nombre_personal}</span>
                      <span className="cp-drop-sub">{c.tipo_identificacion} {c.numero_identificacion}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {clienteSelec && (
              <div className="cp-datos-bloque">
                <p><span className="cp-lbl">ID:</span> {clienteSelec.tipo_identificacion} {clienteSelec.numero_identificacion}</p>
                {clienteSelec.correo && <p><span className="cp-lbl">Correo:</span> {clienteSelec.correo}</p>}
                <p><span className="cp-lbl">Tel:</span> {clienteSelec.telefono_principal}</p>
                {clienteSelec.direccion && <p><span className="cp-lbl">Dir:</span> {clienteSelec.direccion}</p>}
              </div>
            )}
          </div>
        </div>

        {/* ══ BUSCADOR DE PRODUCTOS ══ */}
        <div className="cp-productos-header">
          <h4 className="cp-seccion-titulo">Agregar Producto</h4>
          <div className="cp-producto-buscador">
            <div className="cp-input-icon-wrap">
              <FaSearch className="cp-input-icon" />
              <input
                className="cp-input"
                type="text"
                placeholder="Buscar por nombre o referencia..."
                value={busqProducto}
                onFocus={() => setDropProducto(true)}
                onChange={e => { setBusqProducto(e.target.value); setDropProducto(true); }}
                onBlur={() => setTimeout(() => setDropProducto(false), 200)}
              />
            </div>
            {dropProducto && prodFiltrados.length > 0 && (
              <div className="cp-dropdown">
                {prodFiltrados.map(p => (
                  <div
                    key={p.id}
                    className={`cp-dropdown-item ${p.stock_actual === 0 ? 'cp-drop-sin-stock' : ''}`}
                    onMouseDown={() => p.stock_actual > 0 && agregarProducto(p)}
                  >
                    <div className="cp-drop-prod-info">
                      <span className="cp-drop-nombre">{p.nombre}</span>
                      <span className="cp-drop-sub">{p.referencia}</span>
                    </div>
                    <div className="cp-drop-prod-right">
                      <span className="cp-drop-precio">{formatCurrency(p.precio_venta)}</span>
                      <span className={`cp-drop-stock ${p.stock_actual <= 5 ? 'stock-bajo' : ''}`}>
                        Stock: {p.stock_actual}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ══ TABLA DE LÍNEAS ══ */}
        <div className="cp-tabla-wrapper">
          <table className="cp-tabla-lineas">
            <thead>
              <tr>
                <th className="col-ref">Referencia</th>
                <th className="col-nombre">Producto</th>
                <th className="col-cant">Cantidad</th>
                <th className="col-precio">P. Unitario</th>
                <th className="col-iva">IVA %</th>
                <th className="col-subtotal">Subtotal</th>
                <th className="col-accion"></th>
              </tr>
            </thead>
            <tbody>
              {lineas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="cp-tabla-vacia">
                    <div className="cp-empty-state">
                      <FaPlus className="cp-empty-icon" />
                      <span>Busca y agrega productos para crear el pedido</span>
                    </div>
                  </td>
                </tr>
              ) : lineas.map(l => {
                const prodBD = productos.find(p => p.id === l.producto_id);
                const stockMax = prodBD?.stock_actual ?? 9999;
                return (
                  <tr key={l.producto_id}>
                    <td><span className="ref-tag">{l.referencia}</span></td>
                    <td className="col-nombre-cell">{l.nombre}</td>
                    <td>
                      <div className="cp-cant-control">
                        <button
                          className="cp-cant-btn"
                          onClick={() => cambiarCantidad(l.producto_id, l.cantidad - 1)}
                        >−</button>
                        <input
                          className="cp-cant-input"
                          type="number"
                          min={1}
                          max={stockMax}
                          value={l.cantidad}
                          onChange={e => cambiarCantidad(l.producto_id, Number(e.target.value), stockMax)}
                        />
                        <button
                          className="cp-cant-btn"
                          onClick={() => cambiarCantidad(l.producto_id, l.cantidad + 1, stockMax)}
                          disabled={l.cantidad >= stockMax}
                        >+</button>
                      </div>
                      {prodBD && (
                        <div className={`cp-stock-hint ${prodBD.stock_actual <= 5 ? 'stock-bajo' : ''}`}>
                          Stock: {prodBD.stock_actual}
                        </div>
                      )}
                    </td>
                    <td>
                      <input
                        className="cp-precio-input"
                        type="number"
                        min={0}
                        value={l.precio_unitario}
                        onChange={e => cambiarPrecio(l.producto_id, Number(e.target.value))}
                      />
                    </td>
                    <td className="text-center">{l.iva_porcentaje}%</td>
                    <td className="cp-subtotal">{formatCurrency(l.subtotal)}</td>
                    <td>
                      <button className="cp-btn-quitar" onClick={() => quitarLinea(l.producto_id)}>
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ══ PIE FACTURA ══ */}
        <div className="cp-factura-pie">
          {/* Notas */}
          <div className="cp-notas-col">
            <label className="cp-lbl-campo">Notas del pedido</label>
            <textarea
              className="cp-textarea"
              rows={4}
              placeholder="Observaciones, instrucciones de entrega, etc."
              value={notas}
              onChange={e => setNotas(e.target.value)}
            />
          </div>

          {/* Totales */}
          <div className="cp-totales-col">
            <div className="cp-total-fila">
              <span>Subtotal</span>
              <strong>{formatCurrency(subtotalGeneral)}</strong>
            </div>
            <div className="cp-total-fila">
              <span>IVA</span>
              <strong>{formatCurrency(ivaGeneral)}</strong>
            </div>
            <div className="cp-total-fila cp-total-final">
              <span>TOTAL</span>
              <strong>{formatCurrency(totalGeneral)}</strong>
            </div>
          </div>
        </div>

      </div>{/* fin cp-factura */}

      {/* Botones inferiores */}
      <div className="cp-bottom-actions">
        <button className="cp-btn-cancelar" onClick={() => navigate('/admin/pedidos')}>
          Cancelar
        </button>
        <button className="cp-btn-crear" onClick={handleCrear} disabled={creando}>
          {creando ? 'Guardando...' : 'Guardar Pedido'}
        </button>
      </div>

    </div>
  );
};

export default CrearPedido;