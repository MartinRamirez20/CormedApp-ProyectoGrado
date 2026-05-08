import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../../supabase.ts'; 
import './Crearpedido.css'; 

import { FaSearch, FaPlus, FaTrash, FaArrowLeft, FaSave } from 'react-icons/fa';

interface Comprador {
  id: string | number;
  nombre: string;
  nombre_comercial?: string | null;
  identificacion: string;
  tipo_identificacion: string;
  correo: string | null;
  telefono: string;
  telefono_alternativo?: string | null;
  direccion: string | null;
  esVendedor: boolean;
}

interface ProductoBD {
  id: number;
  codigo: string;
  nombre: string;
  presentacion: string | null;
  precio: number;
  iva: number;
  stock: number;
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
  stock_disponible: number;
}

interface UsuarioSesion {
  id: string;
  nombre_razon_social: string;
  correo: string;
  telefono?: string;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v);

const EMPRESA = {
  nombre:    'Comercializadora Médica CORMED S.A.S.',
  nit:       '900.123.456-7',
  direccion: 'Calle 123 # 45-67, Bogotá D.C.',
  telefono:  '+57 601 234 5678',
  correo:    'ventas@miempresa.com',
  url:       'www.miempresa.com',
};

const EditarPedido: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [vendedor, setVendedor]           = useState<UsuarioSesion | null>(null);
  // ✅ FIX: referencia se guarda en estado y se muestra en el header de la factura
  const [referencia, setReferencia]       = useState('');
  const [estadoPedido, setEstadoPedido]   = useState<'pendiente' | 'confirmado'>('pendiente');

  const [compradores, setCompradores]        = useState<Comprador[]>([]);
  const [busqComprador, setBusqComprador]    = useState('');
  const [compradoresFilt, setCompradoresFilt]= useState<Comprador[]>([]);
  const [compradorSelec, setCompradorSelec]  = useState<Comprador | null>(null);
  const [dropComprador, setDropComprador]    = useState(false);

  const [productos, setProductos]        = useState<ProductoBD[]>([]);
  const [busqProducto, setBusqProducto]  = useState('');
  const [prodFiltrados, setProdFiltrados]= useState<ProductoBD[]>([]);
  const [dropProducto, setDropProducto]  = useState(false);

  const [lineas, setLineas] = useState<LineaPedido[]>([]);

  const [notas, setNotas]        = useState('');
  const [guardando, setGuardando]= useState(false);
  const [mensaje, setMensaje]    = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  useEffect(() => {
    const cargarTodo = async () => {
      setCargandoDatos(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: u } = await supabase
          .from('usuarios')
          .select('id, nombre_razon_social, correo, telefono')
          .eq('id', session.user.id)
          .single();
        if (u) setVendedor(u);
      }

      const { data: cls } = await supabase.from('clientes').select('*');
      const listaClientes: Comprador[] = (cls || []).map(c => ({
        id: c.id,
        nombre: c.nombre_personal,
        nombre_comercial: c.nombre_comercial,
        identificacion: c.numero_identificacion,
        tipo_identificacion: c.tipo_identificacion,
        correo: c.correo,
        telefono: c.telefono_principal,
        telefono_alternativo: c.telefono_alternativo,
        direccion: c.direccion,
        esVendedor: false,
      }));

      const { data: usrs, error: errUsrs } = await supabase.rpc('obtener_empleados_facturacion');
      
      if (errUsrs) {
        console.error("Error cargando empleados:", errUsrs);
      }

      const listaVendedores: Comprador[] = (usrs || []).map((u: any) => ({
        id: u.id,
        nombre: u.nombre_razon_social || 'Empleado',
        identificacion: u.numero_identificacion || 'N/A',
        tipo_identificacion: u.tipo_identificacion || '',
        correo: u.correo,
        telefono: u.telefono || '',
        direccion: 'Empleado Interno',
        esVendedor: true,
      }));

      const todosCompradores = [...listaClientes, ...listaVendedores];
      setCompradores(todosCompradores);

      const { data: prods } = await supabase
        .from('productos')
        .select('id, codigo, nombre, presentacion, precio, iva, stock, activo')
        .eq('activo', true)
        .order('nombre');
      const productosBD = (prods as ProductoBD[]) || [];
      setProductos(productosBD);

      if (id) {
        const { data: pedido } = await supabase
          .from('pedidos')
          .select('*')
          .eq('id', id)
          .single();

        if (pedido) {
          // ✅ referencia se usa aquí (setReferencia) y en el JSX abajo
          setReferencia(pedido.referencia);
          setEstadoPedido(pedido.estado);

          const compMatch = todosCompradores.find(
            c => c.id.toString() === pedido.cliente_id.toString()
          );
          if (compMatch) setCompradorSelec(compMatch);

          const lineasGuardadas: LineaPedido[] = (pedido.productos || []).map((pJSON: any) => {
            const pBD = productosBD.find(p => p.id === pJSON.id);
            const stockExtra = pBD ? pBD.stock : 0;
            return {
              producto_id:      pJSON.id,
              referencia:       pJSON.referencia,
              nombre:           pJSON.nombre,
              cantidad:         pJSON.cantidad,
              precio_unitario:  pJSON.precio_unitario,
              iva_porcentaje:   pJSON.iva_porcentaje,
              subtotal:         pJSON.subtotal,
              stock_disponible: pJSON.cantidad + stockExtra,
            };
          });
          setLineas(lineasGuardadas);

          let notasLimpias = pedido.notas || '';
          if (notasLimpias.includes('[DCTO EMPLEADO 12%] ')) {
            notasLimpias = notasLimpias.replace('[DCTO EMPLEADO 12%] ', '');
          }
          setNotas(notasLimpias);
        }
      }
      setCargandoDatos(false);
    };
    cargarTodo();
  }, [id]);

  useEffect(() => {
    const q = busqComprador.toLowerCase();
    setCompradoresFilt(
      compradores
        .filter(c =>
          c.nombre.toLowerCase().includes(q) ||
          c.identificacion.toLowerCase().includes(q)
        )
        .slice(0, 8)
    );
  }, [busqComprador, compradores]);

  useEffect(() => {
    const q = busqProducto.toLowerCase();
    setProdFiltrados(
      productos
        .filter(p =>
          p.nombre.toLowerCase().includes(q) ||
          p.codigo.toLowerCase().includes(q)
        )
        .slice(0, 8)
    );
  }, [busqProducto, productos]);

  const agregarProducto = (prod: ProductoBD) => {
    if (prod.stock <= 0) {
      setMensaje({ tipo: 'error', texto: `El producto ${prod.nombre} está agotado.` });
      return;
    }
    const yaExiste = lineas.find(l => l.producto_id === prod.id);
    if (yaExiste) {
      if (yaExiste.cantidad + 1 > yaExiste.stock_disponible) {
        setMensaje({ tipo: 'error', texto: `Stock insuficiente. Máximo: ${yaExiste.stock_disponible}` });
        return;
      }
      cambiarCantidad(prod.id, yaExiste.cantidad + 1, yaExiste.stock_disponible);
    } else {
      setLineas(prev => [
        ...prev,
        {
          producto_id:      prod.id,
          referencia:       prod.codigo,
          nombre:           prod.nombre,
          cantidad:         1,
          precio_unitario:  prod.precio,
          iva_porcentaje:   prod.iva,
          subtotal:         prod.precio,
          stock_disponible: prod.stock,
        },
      ]);
      setMensaje(null);
    }
    setBusqProducto('');
    setDropProducto(false);
  };

  const cambiarCantidad = useCallback(
    (prodId: number, nuevaCant: number, maxStock: number) => {
      if (nuevaCant < 1 || nuevaCant > maxStock) return;
      setLineas(prev =>
        prev.map(l =>
          l.producto_id === prodId
            ? { ...l, cantidad: nuevaCant, subtotal: nuevaCant * l.precio_unitario }
            : l
        )
      );
    },
    []
  );

  const cambiarPrecio = (prodId: number, nuevoPrecio: number) => {
    if (nuevoPrecio <= 0) return;
    setLineas(prev =>
      prev.map(l =>
        l.producto_id === prodId
          ? { ...l, precio_unitario: nuevoPrecio, subtotal: l.cantidad * nuevoPrecio }
          : l
      )
    );
  };

  const quitarLinea = (prodId: number) =>
    setLineas(prev => prev.filter(l => l.producto_id !== prodId));

  const subtotalBruto        = lineas.reduce((acc, l) => acc + l.subtotal, 0);
  const aplicarDescuento     = compradorSelec?.esVendedor;
  const descuentoPorcentaje  = aplicarDescuento ? 0.12 : 0;
  const montoDescuentoTotal  = subtotalBruto * descuentoPorcentaje;
  const subtotalConDescuento = subtotalBruto - montoDescuentoTotal;

  const ivaGeneral = lineas.reduce((acc, l) => {
    const baseIva = l.subtotal - l.subtotal * descuentoPorcentaje;
    return acc + (baseIva * l.iva_porcentaje) / 100;
  }, 0);
  const totalGeneral = subtotalConDescuento + ivaGeneral;

  const handleActualizar = async () => {
    if (!compradorSelec) {
      setMensaje({ tipo: 'error', texto: 'Debes seleccionar un cliente o vendedor.' });
      return;
    }
    if (lineas.length === 0) {
      setMensaje({ tipo: 'error', texto: 'Agrega al menos un producto.' });
      return;
    }
    if (!vendedor) return;

    setGuardando(true);
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

    const { error } = await supabase.rpc('actualizar_pedido_y_edicion_stock', {
      p_pedido_id:      id,
      p_cliente_id:     compradorSelec.id.toString(),
      p_cliente_nombre: compradorSelec.nombre,
      p_productos:      productosJSON,
      p_monto_subtotal: subtotalConDescuento,
      p_monto_iva:      ivaGeneral,
      p_monto_total:    totalGeneral,
      p_estado:         estadoPedido,
      p_notas:          notas
        ? `${compradorSelec.esVendedor ? '[DCTO EMPLEADO 12%] ' : ''}${notas}`
        : null,
    });

    if (error) {
      setMensaje({ tipo: 'error', texto: `Error: ${error.message}` });
      setGuardando(false);
    } else {
      setMensaje({ tipo: 'ok', texto: '¡Pedido actualizado y stock reajustado correctamente!' });
      setTimeout(() => navigate('/admin/pedidos'), 1500);
    }
  };

  if (cargandoDatos)
    return (
      <div className="crear-pedido-page">
        <p className="cp-cargando">Cargando pedido...</p>
      </div>
    );

  return (
    <div className="crear-pedido-page">
      <div className="cp-page-header">
        <button className="cp-btn-volver" onClick={() => navigate('/admin/pedidos')}>
          <FaArrowLeft /> Volver a Pedidos
        </button>
        {/* ✅ referencia se consume aquí, eliminando la advertencia del compilador */}
        <h2 className="cp-page-title">
          Editar Pedido {referencia && <span className="ref-tag">{referencia}</span>}
        </h2>
        <div className="cp-header-actions">
          <button className="cp-btn-crear" onClick={handleActualizar} disabled={guardando}>
            <FaSave /> {guardando ? 'Guardando...' : 'Actualizar Pedido'}
          </button>
        </div>
      </div>

      {mensaje && (
        <div className={`cp-mensaje ${mensaje.tipo === 'ok' ? 'cp-msg-ok' : 'cp-msg-error'}`}>
          {mensaje.texto}
        </div>
      )}

      <div className="cp-factura">
        <div className="cp-factura-header">
          {/* Columna Emisor */}
          <div className="cp-col-empresa">
            <div className="cp-seccion-titulo">Emisor</div>
            <div className="cp-datos-bloque">
              <h3 className="cp-empresa-nombre">{EMPRESA.nombre}</h3>
              <p><span className="cp-lbl">NIT:</span> {EMPRESA.nit}</p>
              <p><span className="cp-lbl">Dir:</span> {EMPRESA.direccion}</p>
              <p><span className="cp-lbl">Tel:</span> {EMPRESA.telefono}</p>
              <p><span className="cp-lbl">Email:</span> {EMPRESA.correo}</p>
            </div>
          </div>

          {/* Columna Vendedor */}
          <div className="cp-col-vendedor">
            <div className="cp-seccion-titulo">Vendedor</div>
            {vendedor ? (
              <div className="cp-datos-bloque">
                <p><span className="cp-lbl">Nombre:</span> {vendedor.nombre_razon_social}</p>
                <p><span className="cp-lbl">Email:</span> {vendedor.correo}</p>
                <p><span className="cp-lbl">Tel:</span> {vendedor.telefono || 'N/A'}</p>
              </div>
            ) : (
              <p className="cp-placeholder">Cargando sesión...</p>
            )}
          </div>

          {/* Columna Facturar A */}
          <div className="cp-col-pedido">
            <div className="cp-seccion-titulo">Facturar A</div>

            <div className="cp-cliente-buscador">
              <div className="cp-input-icon-wrap">
                <FaSearch className="cp-input-icon" />
                <input
                  className="cp-input"
                  type="text"
                  placeholder="Buscar comprador..."
                  value={compradorSelec ? compradorSelec.nombre : busqComprador}
                  onFocus={() => { setDropComprador(true); if (compradorSelec) setCompradorSelec(null); }}
                  onChange={e => setBusqComprador(e.target.value)}
                />
              </div>
              {dropComprador && compradoresFilt.length > 0 && (
                <div className="cp-dropdown">
                  {compradoresFilt.map(c => (
                    <div
                      key={c.id}
                      className="cp-dropdown-item"
                      onMouseDown={() => {
                        setCompradorSelec(c);
                        setBusqComprador('');
                        setDropComprador(false);
                      }}
                    >
                      <div className="cp-drop-prod-info">
                        <span className="cp-drop-nombre">
                          {c.nombre}{' '}
                          {c.esVendedor && <span className="ref-tag">Empleado (-12%)</span>}
                        </span>
                        <span className="cp-drop-sub">
                          {c.tipo_identificacion} {c.identificacion}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {compradorSelec && (
              <div className="cp-datos-bloque">
                <p><strong>{compradorSelec.nombre}</strong></p>
                {compradorSelec.nombre_comercial && (
                  <p><span className="cp-lbl">Comercial:</span> {compradorSelec.nombre_comercial}</p>
                )}
                <p>
                  <span className="cp-lbl">ID:</span> {compradorSelec.tipo_identificacion}{' '}
                  {compradorSelec.identificacion}
                </p>
                {compradorSelec.correo && (
                  <p><span className="cp-lbl">Email:</span> {compradorSelec.correo}</p>
                )}
                <p><span className="cp-lbl">Tel:</span> {compradorSelec.telefono}</p>
                {compradorSelec.telefono_alternativo && (
                  <p><span className="cp-lbl">Tel 2:</span> {compradorSelec.telefono_alternativo}</p>
                )}
                {compradorSelec.direccion && (
                  <p><span className="cp-lbl">Dir:</span> {compradorSelec.direccion}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Buscador de productos */}
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
                    className="cp-dropdown-item"
                    onMouseDown={() => agregarProducto(p)}
                  >
                    <div className="cp-drop-prod-info">
                      <span className="cp-drop-nombre">{p.nombre}</span>
                      <span className="cp-drop-sub">
                        {p.codigo} -{' '}
                        <span className="cp-drop-stock">Stock: {p.stock}</span>
                      </span>
                    </div>
                    <div className="cp-drop-prod-right">
                      <span className="cp-drop-precio">{formatCurrency(p.precio)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabla de líneas */}
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
                      <span>Agrega productos</span>
                    </div>
                  </td>
                </tr>
              ) : (
                lineas.map(l => (
                  <tr key={l.producto_id}>
                    <td><span className="ref-tag">{l.referencia}</span></td>
                    <td className="col-nombre-cell">{l.nombre}</td>
                    <td>
                      <div className="cp-cant-control">
                        <button
                          className="cp-cant-btn"
                          onClick={() =>
                            cambiarCantidad(l.producto_id, l.cantidad - 1, l.stock_disponible)
                          }
                        >
                          −
                        </button>
                        <input
                          className="cp-cant-input"
                          type="number"
                          min={1}
                          max={l.stock_disponible}
                          value={l.cantidad}
                          onChange={e =>
                            cambiarCantidad(
                              l.producto_id,
                              Number(e.target.value),
                              l.stock_disponible
                            )
                          }
                        />
                        <button
                          className="cp-cant-btn"
                          onClick={() =>
                            cambiarCantidad(l.producto_id, l.cantidad + 1, l.stock_disponible)
                          }
                          disabled={l.cantidad >= l.stock_disponible}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td>
                      <input
                        className="cp-precio-input"
                        type="number"
                        min={1}
                        value={l.precio_unitario}
                        onChange={e =>
                          cambiarPrecio(l.producto_id, Number(e.target.value))
                        }
                      />
                    </td>
                    <td className="text-center">{l.iva_porcentaje}%</td>
                    <td className="cp-subtotal">{formatCurrency(l.subtotal)}</td>
                    <td>
                      <button
                        className="cp-btn-quitar"
                        onClick={() => quitarLinea(l.producto_id)}
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pie de factura */}
        <div className="cp-factura-pie">
          <div className="cp-notas-col">
            <div className="perfil-campo">
              <label className="cp-lbl-campo">Estado del Pedido</label>
              <select
                className="cp-select-estado"
                value={estadoPedido}
                onChange={e =>
                  setEstadoPedido(e.target.value as 'pendiente' | 'confirmado')
                }
              >
                <option value="pendiente">Pendiente</option>
                <option value="confirmado">Confirmado</option>
              </select>
            </div>

            <div className="perfil-campo">
              <label className="cp-lbl-campo">Notas del pedido</label>
              <textarea
                className="cp-textarea"
                rows={3}
                value={notas}
                onChange={e => setNotas(e.target.value)}
              />
            </div>
          </div>

          <div className="cp-totales-col">
            <div className="cp-total-fila">
              <span>Subtotal Bruto</span>
              <strong>{formatCurrency(subtotalBruto)}</strong>
            </div>
            {aplicarDescuento && (
              <div className="cp-total-fila cp-descuento">
                <span>Dcto Empleado (12%)</span>
                <strong>- {formatCurrency(montoDescuentoTotal)}</strong>
              </div>
            )}
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
      </div>

      <div className="cp-bottom-actions">
        <button className="cp-btn-cancelar" onClick={() => navigate('/admin/pedidos')}>
          Cancelar
        </button>
        <button className="cp-btn-crear" onClick={handleActualizar} disabled={guardando}>
          <FaSave /> {guardando ? 'Guardando...' : 'Actualizar Pedido'}
        </button>
      </div>
    </div>
  );
};

export default EditarPedido;