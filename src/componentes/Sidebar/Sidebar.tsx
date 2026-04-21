// Este Sidebar si esta en uso
// Se renderiza en el MainLayout de Administrador
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../../supabase.ts';
import './Sidebar.css';

interface SidebarProps {
  onCerrarSesion: () => void;
  rol: 'administrador' | 'vendedor' | 'usuario';
}

interface UsuarioInfo {
  nombre: string;
  correo: string;
}

const Sidebar: React.FC<SidebarProps> = ({ onCerrarSesion, rol }) => {
  const location = useLocation();
  const [usuario, setUsuario] = useState<UsuarioInfo>({ nombre: '...', correo: '' });

  const [usuariosExp,   setUsuariosExp]   = useState(false);
  const [tiendaExp,     setTiendaExp]     = useState(false);
  const [pedidosExp,    setPedidosExp]    = useState(false);

  // Prefijo de ruta según rol
  const baseMap: Record<string, string> = {
  administrador: '/admin',
  vendedor:      '/vendedor',
  usuario:       '/usuario',
  };
  const base = baseMap[rol] ?? `/${rol}`;

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
        setUsuario({ nombre: data.nombre_razon_social, correo: data.correo });
      }
    };
    cargarUsuario();
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="sidebar">
      <div className="sidebar-user">
        <div className="sidebar-avatar">👤</div>
        <div className="sidebar-user-info">
          <p className="sidebar-user-name">{usuario.nombre}</p>
          <p className="sidebar-user-email">{usuario.correo}</p>
        </div>
      </div>

      <hr className="sidebar-divider" />

      <nav className="sidebar-nav">

        {/* Dashboard — todos los roles */}
        <Link to={`${base}/dashboard`} className={`sidebar-link ${isActive(`${base}/dashboard`) ? 'active' : ''}`}>
          <i className="bi bi-speedometer2"></i>
          <span>Dashboard</span>
        </Link>
        {/* ── Solo Administrador ── */}
        {rol === 'administrador' && (
          <>
            <div className="sidebar-section">
              <button className="sidebar-link sidebar-toggle" onClick={() => setUsuariosExp(!usuariosExp)}>
                <i className="bi bi-people"></i>
                <span>Usuarios</span>
                <i className={`bi bi-chevron-${usuariosExp ? 'down' : 'right'} sidebar-chevron`}></i>
              </button>
              {usuariosExp && (
                <div className="sidebar-submenu">
                  <Link to={`${base}/usuarios`} className={`sidebar-sublink ${isActive(`${base}/usuarios`) ? 'active' : ''}`}>Todos</Link>
                  <Link to={`${base}/roles`} className={`sidebar-sublink ${isActive(`${base}/roles`) ? 'active' : ''}`}>Roles</Link>
                </div>
              )}
            </div>

            <div className="sidebar-section">
              <button className="sidebar-link sidebar-toggle" onClick={() => setTiendaExp(!tiendaExp)}>
                <i className="bi bi-shop"></i>
                <span>Tienda</span>
                <i className={`bi bi-chevron-${tiendaExp ? 'down' : 'right'} sidebar-chevron`}></i>
              </button>
              {tiendaExp && (
                <div className="sidebar-submenu">
                  <Link to={`${base}/tienda`} className={`sidebar-sublink ${isActive(`${base}/tienda`) ? 'active' : ''}`}>Todos</Link>
                  <Link to={`${base}/tienda/categorias`} className={`sidebar-sublink ${isActive(`${base}/tienda/categorias`) ? 'active' : ''}`}>Categorías</Link>
                  <Link to={`${base}/tienda/faltantes`} className={`sidebar-sublink ${isActive(`${base}/tienda/faltantes`) ? 'active' : ''}`}>Faltantes</Link>
                </div>
              )}
            </div>

            <div className="sidebar-section">
              <button className="sidebar-link sidebar-toggle" onClick={() => setPedidosExp(!pedidosExp)}>
                <i className="bi bi-cart3"></i>
                <span>Pedidos</span>
                <i className={`bi bi-chevron-${pedidosExp ? 'down' : 'right'} sidebar-chevron`}></i>
              </button>
              {pedidosExp && (
                <div className="sidebar-submenu">
                  <Link to={`${base}/pedidos`} className={`sidebar-sublink ${isActive(`${base}/pedidos`) ? 'active' : ''}`}>Pedidos</Link>
                  <Link to={`${base}/pedidos/ordenes`} className={`sidebar-sublink ${isActive(`${base}/pedidos/ordenes`) ? 'active' : ''}`}>Órdenes de compra</Link>
                </div>
              )}
            </div>

            {/* ── Sección de Clientes como Botón Directo ── */}
            <Link to={`${base}/clientes`} className={`sidebar-link ${isActive(`${base}/clientes`) ? 'active' : ''}`}>
              <i className="bi bi-file-earmark-text"></i>
              <span>Clientes</span>
            </Link>
          </>
        )}

        {/* ── Solo Vendedor ── */}
        {rol === 'vendedor' && (
          <>
            <div className="sidebar-section">
              <button className="sidebar-link sidebar-toggle" onClick={() => setTiendaExp(!tiendaExp)}>
                <i className="bi bi-shop"></i>
                <span>Tienda</span>
                <i className={`bi bi-chevron-${tiendaExp ? 'down' : 'right'} sidebar-chevron`}></i>
              </button>
              {tiendaExp && (
                <div className="sidebar-submenu">
                  <Link to={`${base}/tienda`} className={`sidebar-sublink ${isActive(`${base}/tienda`) ? 'active' : ''}`}>Catálogo</Link>
                  <Link to={`${base}/tienda/faltantes`} className={`sidebar-sublink ${isActive(`${base}/tienda/faltantes`) ? 'active' : ''}`}>Faltantes</Link>
                </div>
              )}
            </div>

            <div className="sidebar-section">
              <button className="sidebar-link sidebar-toggle" onClick={() => setPedidosExp(!pedidosExp)}>
                <i className="bi bi-cart3"></i>
                <span>Pedidos</span>
                <i className={`bi bi-chevron-${pedidosExp ? 'down' : 'right'} sidebar-chevron`}></i>
              </button>
              {pedidosExp && (
                <div className="sidebar-submenu">
                  <Link to={`${base}/pedidos`} className={`sidebar-sublink ${isActive(`${base}/pedidos`) ? 'active' : ''}`}>Mis Pedidos</Link>
                  <Link to={`${base}/pedidos/ordenes`} className={`sidebar-sublink ${isActive(`${base}/pedidos/ordenes`) ? 'active' : ''}`}>Órdenes de compra</Link>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Solo Usuario ── */}
        {rol === 'usuario' && (
          <>
            <Link
              to={`${base}/tienda`}
              className={`sidebar-link ${isActive(`${base}/tienda`) ? 'active' : ''}`}
            >
              <i className="bi bi-shop"></i>
              <span>Catálogo</span>
            </Link>
            <Link
              to={`${base}/pedidos`}
              className={`sidebar-link ${isActive(`${base}/pedidos`) ? 'active' : ''}`}
            >
              <i className="bi bi-cart3"></i>
              <span>Mis Pedidos</span>
            </Link>
          </>
        )}

      </nav>

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