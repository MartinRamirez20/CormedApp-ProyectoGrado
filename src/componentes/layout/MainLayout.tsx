import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar'; // El componente de Bootstrap que hicimos

const MainLayout: React.FC = () => {
  return (
    <div className="d-flex">
      {/* Sidebar Fija */}
      <Sidebar />

      {/* Área de contenido dinámico */}
      <div className="flex-grow-1 vh-100 overflow-auto bg-light">
        {/* Aquí puedes poner tu Header si quieres que sea global */}
        <header className="p-3 mb-3 border-bottom bg-white">
            <div className="container-fluid d-flex justify-content-between">
                <h1 className="h4 m-0">CormedAPP</h1>
                <div>
                    <button className="btn btn-sm btn-outline-secondary me-2">Perfil</button>
                    <button className="btn btn-sm btn-danger">Cerrar Sesión</button>
                </div>
            </div>
        </header>

        <main className="container-fluid p-4">
          <Outlet /> {/* Aquí se renderizará tu Dashboard */}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;