import React from 'react';
import '../Administrador/Dashboard.css';

interface Pedido {
  cliente: string;
  estado: string;
  monto: string;
  numero: number;
}

const Dashboard: React.FC = () => {
  const pedidos: Pedido[] = [
    { cliente: 'Cliente Ejemplo 1', estado: 'Pendiente',  monto: '$20,000', numero: 1 },
    { cliente: 'Cliente Ejemplo 2', estado: 'Confirmado', monto: '$35,000', numero: 2 },
    { cliente: 'Cliente Ejemplo 3', estado: 'Cancelado',  monto: '$15,000', numero: 3 },
  ];

  const getEstadoClass = (estado: string) => {
    switch (estado) {
      case 'Pendiente':  return 'badge-pendiente';
      case 'Confirmado': return 'badge-confirmado';
      case 'Cancelado':  return 'badge-cancelado';
      default:           return '';
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header">
        <h2 className="dashboard-page-title">Dashboard — Vendedor</h2>
      </div>

      <div className="dashboard-grid">

        {/* Acciones rápidas */}
        <div className="dash-card resumen-card">
          <h5 className="dash-card-title">Acciones Rápidas</h5>
          <div className="resumen-list">
            <button className="resumen-item">
              <span className="resumen-icon">▶</span>
              <span>Registrar Nuevo Pedido</span>
            </button>
            <button className="resumen-item">
              <span className="resumen-icon">👥</span>
              <span>Mis Clientes</span>
            </button>
            <button className="resumen-item">
              <span className="resumen-icon">📊</span>
              <span>Resumen de Ventas</span>
            </button>
          </div>
        </div>

        {/* Mis Pedidos */}
        <div className="dash-card pedidos-card">
          <div className="dash-card-header">
            <h5 className="dash-card-title">Mis Pedidos Recientes</h5>
          </div>
          <div className="table-wrapper">
            <table className="pedidos-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Estado</th>
                  <th>Monto</th>
                  <th>#</th>
                  <th>Ver</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map((pedido, index) => (
                  <tr key={index}>
                    <td className="cliente-cell">
                      {pedido.cliente.split('\n').map((line, i) => (
                        <div key={i}>{line}</div>
                      ))}
                    </td>
                    <td>
                      {pedido.estado && (
                        <span className={`estado-badge ${getEstadoClass(pedido.estado)}`}>
                          {pedido.estado}
                        </span>
                      )}
                    </td>
                    <td>{pedido.monto}</td>
                    <td>{pedido.numero || 'N/A'}</td>
                    <td>
                      <input type="checkbox" className="checkbox-ver" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;