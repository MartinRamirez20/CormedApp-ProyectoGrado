import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../../supabase.ts';
import './Sidebar.css';

interface SidebarProps {
  onCerrarSesion: () => void;
}

interface UsuarioInfo {
  nombre: string;
  correo: string;
}

const Sidebar: React.FC<SidebarProps> = ({ onCerrarSesion }) => {
  const location = useLocation();
  const [usuario, setUsuario] = useState<UsuarioInfo>({ nombre: '...', correo: '' });

  // Secciones expandibles
  const [usuariosExp, setUsuariosExp] = useState(false);
  const [tiendaExp, setTiendaExp] = useState(false);
  const [pedidosExp, setPedidosExp] = useState(false);
  const [documentosExp, setDocumentosExp] = useState(false);

  // Trae el nombre real del usuario desde public.usuarios
  useEffect(() => {
    const cargarUsuario = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('usuarios')
        .select('nombre_razon_social, correo')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setUsuario({
          nombre: data.nombre_razon_social,
          correo: data.correo,
        });
      }
    };

    cargarUsuario();
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="sidebar">
      {/* Info del usuario */}
      <div className="sidebar-user">
        <div className="sidebar-avatar">👤</div>
        <div className="sidebar-user-info">
          <p className="sidebar-user-name">{usuario.nombre}</p>
          <p className="sidebar-user-email">{usuario.correo}</p>
        </div>
      </div>

      <hr className="sidebar-divider" />

      {/* Navegación */}
      <nav className="sidebar-nav">
        <Link
          to="/admin/dashboard"
          className={`sidebar-link ${isActive('/admin/dashboard') ? 'active' : ''}`}
        >
          <i className="bi bi-speedometer2"></i>
          <span>Dashboard</span>
        </Link>

        {/* Usuarios */}
        <div className="sidebar-section">
          <button
            className="sidebar-link sidebar-toggle"
            onClick={() => setUsuariosExp(!usuariosExp)}
          >
            <i className="bi bi-people"></i>
            <span>Usuarios</span>
            <i className={`bi bi-chevron-${usuariosExp ? 'down' : 'right'} sidebar-chevron`}></i>
          </button>
          {usuariosExp && (
            <div className="sidebar-submenu">
              <Link to="/admin/usuarios" className={`sidebar-sublink ${isActive('/admin/usuarios') ? 'active' : ''}`}>
                Todos
              </Link>
              <Link to="/admin/usuarios/roles" className={`sidebar-sublink ${isActive('/admin/usuarios/roles') ? 'active' : ''}`}>
                Roles
              </Link>
            </div>
          )}
        </div>

        {/* Tienda */}
        <div className="sidebar-section">
          <button
            className="sidebar-link sidebar-toggle"
            onClick={() => setTiendaExp(!tiendaExp)}
          >
            <i className="bi bi-shop"></i>
            <span>Tienda</span>
            <i className={`bi bi-chevron-${tiendaExp ? 'down' : 'right'} sidebar-chevron`}></i>
          </button>
          {tiendaExp && (
            <div className="sidebar-submenu">
              <Link to="/admin/tienda" className={`sidebar-sublink ${isActive('/admin/tienda') ? 'active' : ''}`}>
                Todos
              </Link>
              <Link to="/admin/tienda/categorias" className={`sidebar-sublink ${isActive('/admin/tienda/categorias') ? 'active' : ''}`}>
                Categorías
              </Link>
              <Link to="/admin/tienda/faltantes" className={`sidebar-sublink ${isActive('/admin/tienda/faltantes') ? 'active' : ''}`}>
                Faltantes
              </Link>
            </div>
          )}
        </div>

        {/* Pedidos */}
        <div className="sidebar-section">
          <button
            className="sidebar-link sidebar-toggle"
            onClick={() => setPedidosExp(!pedidosExp)}
          >
            <i className="bi bi-cart3"></i>
            <span>Pedidos</span>
            <i className={`bi bi-chevron-${pedidosExp ? 'down' : 'right'} sidebar-chevron`}></i>
          </button>
          {pedidosExp && (
            <div className="sidebar-submenu">
              <Link to="/admin/pedidos" className={`sidebar-sublink ${isActive('/admin/pedidos') ? 'active' : ''}`}>
                Pedidos
              </Link>
              <Link to="/admin/pedidos/ordenes" className={`sidebar-sublink ${isActive('/admin/pedidos/ordenes') ? 'active' : ''}`}>
                Órdenes de compra
              </Link>
            </div>
          )}
        </div>

        {/* Documentos */}
        <div className="sidebar-section">
          <button
            className="sidebar-link sidebar-toggle"
            onClick={() => setDocumentosExp(!documentosExp)}
          >
            <i className="bi bi-file-earmark-text"></i>
            <span>Documentos y registros</span>
            <i className={`bi bi-chevron-${documentosExp ? 'down' : 'right'} sidebar-chevron`}></i>
          </button>
          {documentosExp && (
            <div className="sidebar-submenu">
              <Link to="/admin/documentos/internos" className={`sidebar-sublink ${isActive('/admin/documentos/internos') ? 'active' : ''}`}>
                Documentos internos
              </Link>
              <Link to="/admin/documentos/iso" className={`sidebar-sublink ${isActive('/admin/documentos/iso') ? 'active' : ''}`}>
                Normas ISO
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Botón cerrar sesión al fondo */}
      <div className="sidebar-footer">
        <hr className="sidebar-divider" />
        <button className="sidebar-link sidebar-signout" onClick={onCerrarSesion}>
          <i className="bi bi-box-arrow-right"></i>
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;