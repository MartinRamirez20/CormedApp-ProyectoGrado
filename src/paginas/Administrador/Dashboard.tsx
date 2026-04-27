import React from 'react';
import './Dashboard.css';

// Iconos
import { FaPlus } from "react-icons/fa"; //Boton Crear Pedido
import { FaUsersGear } from "react-icons/fa6"; //Boton Crear Usuario
import { FaUsers } from "react-icons/fa6"; //Boton Crear Cliente
import { FaBagShopping } from "react-icons/fa6"; //Boton Agregar Productos

interface Pedido {
  cliente: string;
  estado: string;
  monto: string;
  numero: number;
}

const Dashboard: React.FC = () => {
  const pedidos: Pedido[] = [
    { cliente: 'Geronimo Guillizzoni', estado: 'Pendiente', monto: '$30,000', numero: 1 },
    { cliente: 'Founder & CEO\nMarco Botton', estado: 'Confirmado', monto: '$40,000', numero: 2 },
    { cliente: 'Tuttiofore\nHannah Macallan', estado: 'Cancelado', monto: '$120,000', numero: 3 },
    { cliente: 'Better Half\nValerie Liberty', estado: 'Confirmado', monto: '$50,000', numero: 4 },
    { cliente: 'Head Chef\nDale Grid Dove', estado: '', monto: '', numero: 0 },
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
        <h2 className="dashboard-page-title">Dashboard — Tienda Virtual</h2>
      </div>

      <div className="dashboard-grid">
        {/* Resumen General */}
        <div className="dash-card resumen-card">
          <h5 className="dash-card-title">Funciones Principales</h5>
          <div className="resumen-list">
            <button className="resumen-item">
              <FaPlus className="icons"/>
              <span>Crear Pedidos</span>
            </button>
            <button className="resumen-item">
              <FaUsersGear className="icons"/>
              <span>Crear Usuarios</span>
            </button>
            <button className="resumen-item">
              <FaBagShopping className="icons"/>
              <span>Agregar Productos</span>
            </button>
            <button className="resumen-item">
              <FaUsers className="icons"/>
              <span>Crear Clientes</span>
            </button>
          </div>
        </div>

        {/* Últimos Pedidos */}
        <div className="dash-card pedidos-card">
          <div className="dash-card-header">
            <h5 className="dash-card-title">Últimos Pedidos</h5>
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