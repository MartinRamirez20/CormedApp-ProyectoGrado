import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../../componentes/Sidebar/Sidebar';
import './MainLayout.css';

interface MainLayoutProps {
  onCerrarSesion: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ onCerrarSesion }) => {
  return (
    <div className="main-layout">
      {/* Sidebar fija a la izquierda */}
      <Sidebar onCerrarSesion={onCerrarSesion} />

      {/* Área de contenido dinámico */}
      <div className="main-content">
        <header className="main-header">
          <div className="header-inner">
            <h1 className="header-logo">CormedAPP</h1>
            <div className="header-actions">
              <button className="btn-header-outline">Perfil</button>
              <button className="btn-header-danger" onClick={onCerrarSesion}>
                Cerrar Sesión
              </button>
            </div>
          </div>
        </header>

        {/* Aquí se renderiza Dashboard, Usuarios, Tienda, etc. */}
        <main className="main-outlet">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;