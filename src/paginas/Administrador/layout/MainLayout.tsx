import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../../../componentes/Sidebar/Sidebar';
import './MainLayout.css';

interface MainLayoutProps {
  onCerrarSesion: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ onCerrarSesion }) => {
  const navigate = useNavigate();

  return (
    <div className="main-layout">
      <Sidebar rol="administrador" onCerrarSesion={onCerrarSesion} />
      <div className="main-content">
        <header className="main-header">
          <div className="header-inner">
            <h1 className="header-logo">CormedAPP</h1>
            <div className="header-actions">
              <button className="btn-header-outline" onClick={() => navigate('/admin/perfil')}>
                Perfil
              </button>
              <button className="btn-header-danger" onClick={onCerrarSesion}>
                Cerrar Sesión
              </button>
            </div>
          </div>
        </header>
        <main className="main-outlet">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;