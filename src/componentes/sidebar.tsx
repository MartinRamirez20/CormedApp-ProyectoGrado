import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar: React.FC = () => {
  const location = useLocation();

  // Función para verificar si la ruta es la activa
  const isActive = (path: string) => location.pathname === path ? 'active' : 'text-white';

  return (
    <div 
      className="d-flex flex-column flex-shrink-0 p-3 text-white bg-dark" 
      style={{ width: '280px', height: '100vh' }}
    >
      <a href="/" className="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-white text-decoration-none">
        <span className="fs-4">Sidebar</span>
      </a>
      <hr />
      <ul className="nav nav-pills flex-column mb-auto">
        <li className="nav-item">
          <Link to="/" className={`nav-link ${isActive('/')}`} aria-current="page">
            <i className="bi bi-house me-2"></i> Home
          </Link>
        </li>
        <li>
          <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`}>
            <i className="bi bi-speedometer2 me-2"></i> Dashboard
          </Link>
        </li>
        <li>
          <Link to="/orders" className={`nav-link ${isActive('/orders')}`}>
            <i className="bi bi-table me-2"></i> Orders
          </Link>
        </li>
        <li>
          <Link to="/products" className={`nav-link ${isActive('/products')}`}>
            <i className="bi bi-grid me-2"></i> Products
          </Link>
        </li>
        <li>
          <Link to="/customers" className={`nav-link ${isActive('/customers')}`}>
            <i className="bi bi-person-circle me-2"></i> Customers
          </Link>
        </li>
      </ul>
      <hr />
      <div className="dropdown">
        <a href="#" className="d-flex align-items-center text-white text-decoration-none dropdown-toggle" id="dropdownUser1" data-bs-toggle="dropdown" aria-expanded="false">
          <img src="https://github.com/mdo.png" alt="" width="32" height="32" className="rounded-circle me-2" />
          <strong>Usuario</strong>
        </a>
        <ul className="dropdown-menu dropdown-menu-dark text-small shadow" aria-labelledby="dropdownUser1">
          <li><a className="dropdown-item" href="#">New project...</a></li>
          <li><a className="dropdown-item" href="#">Settings</a></li>
          <li><hr className="dropdown-divider" /></li>
          <li><a className="dropdown-item" href="#">Sign out</a></li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;