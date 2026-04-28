import React from 'react';
import '../Administrador/Dashboard.css';

const Dashboard: React.FC = () => {
  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header">
        <h2 className="dashboard-page-title">Dashboard — Facturador</h2>
      </div>

      <div className="dashboard-grid">

        {/* Acciones disponibles */}
        <div className="dash-card resumen-card">
          <h5 className="dash-card-title">Funciones Principales</h5>
          <div className="resumen-list">
            <button className="resumen-item">
              <span className="resumen-icon">🛒</span>
              <span>Ver Catálogo</span>
            </button>
            <button className="resumen-item">
              <span className="resumen-icon">📦</span>
              <span>Mis Pedidos</span>
            </button>
            <button className="resumen-item">
              <span className="resumen-icon">📞</span>
              <span>Contactar Soporte</span>
            </button>
          </div>
        </div>

        {/* Estado de pedidos */}
        <div className="dash-card pedidos-card">
          <div className="dash-card-header">
            <h5 className="dash-card-title">Estado de Mis Pedidos</h5>
            <button className="btn-detalle">Ver Todos</button>
          </div>
          <div className="table-wrapper">
            <table className="pedidos-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Estado</th>
                  <th>Monto</th>
                  <th>#</th>
                  <th>Ver</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="cliente-cell">
                    <div>Sin pedidos aún</div>
                    <div>Realiza tu primer pedido</div>
                  </td>
                  <td></td>
                  <td>—</td>
                  <td>—</td>
                  <td><input type="checkbox" className="checkbox-ver" disabled /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;