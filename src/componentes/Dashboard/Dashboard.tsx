import React, { useState } from 'react';
import './Dashboard.css';

interface Usuario {
  nombre: string;
  rol: string;
}

interface Pedido {
  cliente: string;
  estado: string;
  monto: string;
  numero: number;
}

const Dashboard: React.FC = () => {
  const [seccionActiva, setSeccionActiva] = useState('dashboard');
  const [usuariosExpanded, setUsuariosExpanded] = useState(false);
  const [tiendaExpanded, setTiendaExpanded] = useState(false);
  const [pedidosExpanded, setPedidosExpanded] = useState(false);
  const [documentosExpanded, setDocumentosExpanded] = useState(false);

  const usuario: Usuario = {
    nombre: 'Usuario_nombre',
    rol: 'Administrador'
  };

  const pedidos: Pedido[] = [
    { cliente: 'Geronimo Guillizzoni', estado: 'Pendiente', monto: '$30,000', numero: 1 },
    { cliente: 'Founder & CEO\nMarco Botton', estado: 'Confirmado', monto: '$40,000', numero: 2 },
    { cliente: 'Tuttiofore\nHannah Macallan', estado: 'Cancelado', monto: '$120,000', numero: 3 },
    { cliente: 'Better Half\nValerie Liberty', estado: 'Confirmado', monto: '$50,000', numero: 4 },
    { cliente: 'Head Chef\nDale Grid Dove', estado: '', monto: '', numero: 0 }
  ];

  const getEstadoClass = (estado: string) => {
    switch (estado) {
      case 'Pendiente': return 'estado-pendiente';
      case 'Confirmado': return 'estado-confirmado';
      case 'Cancelado': return 'estado-cancelado';
      default: return '';
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Header */}
      <header className="dashboard-header">
        <h1 className="dashboard-logo">CormedAPP</h1>
        <div className="header-actions">
          <button className="btn-header">Modo Oscuro/Claro</button>
          <button className="btn-header">Perfil</button>
          <button className="btn-header">Tienda</button>
          <button className="btn-header">Cerrar Sesión</button>
        </div>
      </header>

      <div className="dashboard-container">
        {/* Sidebar */}
        <aside className="dashboard-sidebar">
          <div className="usuario-info">
            <div className="usuario-avatar">👤</div>
            <div className="usuario-datos">
              <p className="usuario-nombre">{usuario.nombre}</p>
              <p className="usuario-rol">{usuario.rol}</p>
            </div>
          </div>

          <nav className="sidebar-nav">
            <button 
              className={`nav-item ${seccionActiva === 'dashboard' ? 'active' : ''}`}
              onClick={() => setSeccionActiva('dashboard')}
            >
              Dashboard
            </button>

            <div className="nav-section">
              <button 
                className="nav-item"
                onClick={() => setUsuariosExpanded(!usuariosExpanded)}
              >
                <span>Usuarios</span>
                <span className="nav-arrow">{usuariosExpanded ? '▼' : '▶'}</span>
              </button>
              {usuariosExpanded && (
                <div className="nav-submenu">
                  <label className="nav-checkbox">
                    <input type="checkbox" />
                    <span>Todos</span>
                  </label>
                  <label className="nav-checkbox">
                    <input type="checkbox" />
                    <span>Roles</span>
                  </label>
                </div>
              )}
            </div>

            <div className="nav-section">
              <button 
                className="nav-item"
                onClick={() => setTiendaExpanded(!tiendaExpanded)}
              >
                <span>Tienda</span>
                <span className="nav-arrow">{tiendaExpanded ? '▼' : '▶'}</span>
              </button>
              {tiendaExpanded && (
                <div className="nav-submenu">
                  <label className="nav-checkbox">
                    <input type="checkbox" />
                    <span>Todos</span>
                  </label>
                  <label className="nav-checkbox">
                    <input type="checkbox" />
                    <span>Categoría</span>
                  </label>
                  <label className="nav-checkbox">
                    <input type="checkbox" />
                    <span>Faltantes</span>
                  </label>
                </div>
              )}
            </div>

            <div className="nav-section">
              <button 
                className="nav-item"
                onClick={() => setPedidosExpanded(!pedidosExpanded)}
              >
                <span>Pedidos</span>
                <span className="nav-arrow">{pedidosExpanded ? '▼' : '▶'}</span>
              </button>
              {pedidosExpanded && (
                <div className="nav-submenu">
                  <label className="nav-checkbox">
                    <input type="checkbox" />
                    <span>Pedidos</span>
                  </label>
                  <label className="nav-checkbox">
                    <input type="checkbox" />
                    <span>Órdenes de compra</span>
                  </label>
                </div>
              )}
            </div>

            <div className="nav-section">
              <button 
                className="nav-item"
                onClick={() => setDocumentosExpanded(!documentosExpanded)}
              >
                <span>Documentos y registros</span>
                <span className="nav-arrow">{documentosExpanded ? '▼' : '▶'}</span>
              </button>
              {documentosExpanded && (
                <div className="nav-submenu">
                  <label className="nav-checkbox">
                    <input type="checkbox" />
                    <span>Documentos internos</span>
                  </label>
                  <label className="nav-checkbox">
                    <input type="checkbox" />
                    <span>Normas ISO</span>
                  </label>
                </div>
              )}
            </div>
          </nav>
        </aside>

        {/* Contenido Principal */}
        <main className="dashboard-main">
          <div className="dashboard-title-bar">
            <h2 className="dashboard-title">Dashboard - Tienda Virtual</h2>
          </div>

          <div className="dashboard-content">
            <div className="content-left">
              <h3 className="section-title">Resumen General</h3>
              
              <div className="resumen-cards">
                <div className="resumen-card">
                  <div className="card-icon yellow">▶</div>
                  <p className="card-text">Realizar Nuevo Pedido</p>
                </div>

                <div className="resumen-card">
                  <div className="card-icon yellow">📅</div>
                  <p className="card-text">Calendario de Eventos</p>
                </div>

                <div className="resumen-card">
                  <div className="card-icon yellow">📝</div>
                  <p className="card-text">Notas Adicionales</p>
                </div>
              </div>
            </div>

            <div className="content-right">
              <div className="pedidos-header">
                <h3 className="section-title">Últimos Pedidos</h3>
                <button className="btn-ver-detalle">Ver Detalle</button>
              </div>

              <div className="pedidos-table-wrapper">
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
        </main>
      </div>
    </div>
  );
};

export default Dashboard;