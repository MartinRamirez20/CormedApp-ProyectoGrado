import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase.ts';
import '../Administrador/Dashboard.css';

// Iconos
import { FaShoppingCart } from "react-icons/fa";
import { FaStore } from "react-icons/fa6";

interface Pedido {
  id: number;
  referencia: string;
  cliente_nombre: string;
  monto_total: number;
  estado: 'pendiente' | 'confirmado' | 'facturado';
  fecha_creacion: string;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const [pedidos, setPedidos]   = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarPedidos = async () => {
      // El facturador necesita ver los pedidos recientes a nivel general
      const { data, error } = await supabase
        .from('pedidos')
        .select('id, referencia, cliente_nombre, monto_total, estado, fecha_creacion')
        .order('fecha_creacion', { ascending: false })
        .limit(5);

      if (!error && data) setPedidos(data as Pedido[]);
      setCargando(false);
    };
    cargarPedidos();
  }, []);

  const getEstadoClass = (estado: string) => {
    switch (estado) {
      case 'pendiente':  return 'badge-pendiente';
      case 'confirmado': return 'badge-confirmado';
      case 'facturado':  return 'badge-facturado';
      default:           return '';
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
    <div className="dashboard-page">
      <div className="dashboard-page-header">
        <h2 className="dashboard-page-title">Dashboard — Facturador</h2>
      </div>

      <div className="dashboard-grid">
        {/* Funciones Principales */}
        <div className="dash-card resumen-card">
          <h5 className="dash-card-title">Funciones Principales</h5>
          <div className="resumen-list">
            <button className="resumen-item" onClick={() => navigate('/facturador/pedidos')}>
              <FaShoppingCart className="icons"/>
              <span>Consultar Pedidos</span>
            </button>
            <button className="resumen-item" onClick={() => navigate('/facturador/tienda')}>
              <FaStore className="icons"/>
              <span>Consultar Tienda</span>
            </button>
          </div>
        </div>

        {/* Últimos Pedidos */}
        <div className="dash-card pedidos-card">
          <div className="dash-card-header">
            <h5 className="dash-card-title">Últimos Pedidos</h5>
            <button
              className="dash-ver-todos"
              onClick={() => navigate('/facturador/pedidos')}
            >
              Ver todos
            </button>
          </div>

          <div className="table-wrapper">
            {cargando ? (
              <p className="dash-cargando">Cargando pedidos...</p>
            ) : pedidos.length === 0 ? (
              <p className="dash-vacio">No hay pedidos registrados aún.</p>
            ) : (
              <table className="pedidos-table">
                <thead>
                  <tr>
                    <th>Referencia</th>
                    <th>Cliente</th>
                    <th>Estado</th>
                    <th>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidos.map(p => (
                    <tr
                      key={p.id}
                      className="dash-pedido-row"
                      // Navega a la vista del facturador enviando el ID para abrir el modal
                      onClick={() => navigate('/facturador/pedidos', { state: { pedidoId: p.id } })}
                      title="Ver detalle del pedido"
                    >
                      <td>
                        <span className="dash-referencia">{p.referencia}</span>
                      </td>
                      <td className="cliente-cell">
                        <div>{p.cliente_nombre}</div>
                      </td>
                      <td>
                        <span className={`estado-badge ${getEstadoClass(p.estado)}`}>
                          {getEstadoLabel(p.estado)}
                        </span>
                      </td>
                      <td className="dash-monto">{formatCurrency(p.monto_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;