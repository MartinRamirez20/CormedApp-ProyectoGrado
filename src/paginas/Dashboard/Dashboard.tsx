import React from 'react';
import './Dashboard.css';

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
    { cliente: 'Head Chef\nDale Grid Dove', estado: '', monto: '', numero: 0 }
  ];

  const getEstadoClass = (estado: string) => {
    switch (estado) {
      case 'Pendiente': return 'bg-warning text-dark';
      case 'Confirmado': return 'bg-success';
      case 'Cancelado': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  return (
    <div className="row">
      <div className="col-12 mb-4">
        <h2 className="h3">Dashboard - Tienda Virtual</h2>
      </div>

      {/* Resumen General (Cards) */}
      <div className="col-md-4 mb-4">
        <div className="card shadow-sm p-3">
          <h5 className="border-bottom pb-2">Resumen General</h5>
          <div className="list-group list-group-flush">
            <button className="list-group-item list-group-item-action border-0">
              <i className="bi bi-plus-circle me-2 text-warning"></i> Nuevo Pedido
            </button>
            <button className="list-group-item list-group-item-action border-0">
              <i className="bi bi-calendar-event me-2 text-warning"></i> Calendario
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de Pedidos */}
      <div className="col-md-8">
        <div className="card shadow-sm">
          <div className="card-header bg-white d-flex justify-content-between align-items-center">
            <h5 className="m-0">Últimos Pedidos</h5>
            <button className="btn btn-sm btn-primary">Ver Detalle</button>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
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
                      <td className="small">
                        {pedido.cliente.split('\n').map((line, i) => <div key={i}>{line}</div>)}
                      </td>
                      <td>
                        {pedido.estado && (
                          <span className={`badge ${getEstadoClass(pedido.estado)}`}>
                            {pedido.estado}
                          </span>
                        )}
                      </td>
                      <td>{pedido.monto}</td>
                      <td>{pedido.numero || 'N/A'}</td>
                      <td><input type="checkbox" className="form-check-input" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;