// Este Sidebar si esta en uso
// Se renderiza en el MainLayout de Administrador
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase.ts';
import './Sidebar.css';

import { MdDashboard } from "react-icons/md"; //Dashboard
import { FaUsersGear } from "react-icons/fa6"; //Usuarios
import { FaUsers } from "react-icons/fa6"; //Clientes
import { FaBagShopping } from "react-icons/fa6"; //Tienda
import { FaShoppingCart } from "react-icons/fa"; // Pedidos
import { IoMdMenu } from "react-icons/io"; //MenuHamburguesa
import { IoIosExit } from "react-icons/io"; //CerrarSesion

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
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<UsuarioInfo>({ nombre: '...', correo: '' });
  const [collapsed, setCollapsed] = useState(false); // ← nuevo estado hamburguesa

  const [usuariosExp, setUsuariosExp] = useState(false);
  const [tiendaExp,   setTiendaExp]   = useState(false);
  const [pedidosExp,  setPedidosExp]  = useState(false);

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

  // Al colapsar, también cerramos todos los submenús abiertos
  const handleCollapse = () => {
    setCollapsed(prev => {
      if (!prev) {
        setUsuariosExp(false);
        setTiendaExp(false);
        setPedidosExp(false);
      }
      return !prev;
    });
  };

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      {/* ── Header: perfil + botón hamburguesa ── */}
      <div className="sidebar-header">
        {!collapsed && (
          <div className="sidebar-user-info">
            <p className="sidebar-user-name">{usuario.nombre}</p>
            <p className="sidebar-user-email">{usuario.correo}</p>
          </div>
        )}
        <button className="sidebar-hamburger" onClick={handleCollapse} title="Menú">
          <IoMdMenu />
        </button>
      </div>

      <hr className="sidebar-divider" />

      <nav className="sidebar-nav">

        {/* Dashboard — todos los roles */}
        <Link
          to={`${base}/dashboard`}
          className={`sidebar-link ${isActive(`${base}/dashboard`) ? 'active' : ''}`}
          title="Dashboard"
        >
          <MdDashboard className="sidebar-icon" />
          {!collapsed && <span>Dashboard</span>}
        </Link>

        {/* ── Solo Administrador ── */}
        {rol === 'administrador' && (
          <>
            <Link
              to={`${base}/clientes`}
              className={`sidebar-link ${isActive(`${base}/clientes`) ? 'active' : ''}`}
              title="Clientes"
            >
              <FaUsers className="sidebar-icon" />
              {!collapsed && <span>Clientes</span>}
            </Link>

            <Link
              to={`${base}/tienda`}
              className={`sidebar-link ${isActive(`${base}/tienda`) ? 'active' : ''}`}
              title="Tienda"
            >
              <FaBagShopping className="sidebar-icon" />
              {!collapsed && <span>Tienda</span>}
            </Link>

            <Link
              to={`${base}/pedidos`}
              className={`sidebar-link ${isActive(`${base}/pedidos`) ? 'active' : ''}`}
              title="Pedidos"
            >
              <FaShoppingCart className="sidebar-icon" />
              {!collapsed && <span>Pedidos</span>}
            </Link>

            <div className="sidebar-section">
              <button
                className={`sidebar-link sidebar-toggle ${collapsed && isActive(`${base}/usuarios`) ? 'active' : ''}`}
                onClick={() => {
                  if (collapsed) {
                    // Si está encogido, funciona como un Link directo a Todos los usuarios
                    navigate(`${base}/usuarios`);
                  } else {
                    // Si está expandido, abre/cierra el submenú
                    setUsuariosExp(!usuariosExp);
                  }
                }}
                title="Usuarios"
              >
                <FaUsersGear className="sidebar-icon" />
                {!collapsed && (
                  <>
                    <span>Usuarios</span>
                    <i className={`bi bi-chevron-${usuariosExp ? 'down' : 'right'} sidebar-chevron`}></i>
                  </>
                )}
              </button>
              {!collapsed && usuariosExp && (
                <div className="sidebar-submenu">
                  <Link to={`${base}/usuarios`} className={`sidebar-sublink ${isActive(`${base}/usuarios`) ? 'active' : ''}`}>Todos</Link>
                  <Link to={`${base}/roles`}    className={`sidebar-sublink ${isActive(`${base}/roles`)    ? 'active' : ''}`}>Roles</Link>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Solo Vendedor ── */}
        {rol === 'vendedor' && (
          <>
            <div className="sidebar-section">
              <button
                className="sidebar-link sidebar-toggle"
                onClick={() => !collapsed && setTiendaExp(!tiendaExp)}
                title="Tienda"
              >
                <FaBagShopping className="sidebar-icon" />
                {!collapsed && (
                  <>
                    <span>Tienda</span>
                    <i className={`bi bi-chevron-${tiendaExp ? 'down' : 'right'} sidebar-chevron`}></i>
                  </>
                )}
              </button>
              {!collapsed && tiendaExp && (
                <div className="sidebar-submenu">
                  <Link to={`${base}/tienda`} className={`sidebar-sublink ${isActive(`${base}/tienda`)           ? 'active' : ''}`}>Catálogo</Link>
                  <Link to={`${base}/tienda/faltantes`} className={`sidebar-sublink ${isActive(`${base}/tienda/faltantes`) ? 'active' : ''}`}>Faltantes</Link>
                </div>
              )}
            </div>

            <div className="sidebar-section">
              <button
                className="sidebar-link sidebar-toggle"
                onClick={() => !collapsed && setPedidosExp(!pedidosExp)}
                title="Pedidos"
              >
                <FaShoppingCart className="sidebar-icon" />
                {!collapsed && (
                  <>
                    <span>Pedidos</span>
                    <i className={`bi bi-chevron-${pedidosExp ? 'down' : 'right'} sidebar-chevron`}></i>
                  </>
                )}
              </button>
              {!collapsed && pedidosExp && (
                <div className="sidebar-submenu">
                  <Link to={`${base}/pedidos`}         className={`sidebar-sublink ${isActive(`${base}/pedidos`)         ? 'active' : ''}`}>Mis Pedidos</Link>
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
              title="Catálogo"
            >
              <FaBagShopping className="sidebar-icon" />
              {!collapsed && <span>Catálogo</span>}
            </Link>
            <Link
              to={`${base}/pedidos`}
              className={`sidebar-link ${isActive(`${base}/pedidos`) ? 'active' : ''}`}
              title="Mis Pedidos"
            >
              <FaShoppingCart className="sidebar-icon" />
              {!collapsed && <span>Mis Pedidos</span>}
            </Link>
          </>
        )}

      </nav>

      <div className="sidebar-footer">
        <hr className="sidebar-divider" />
        <button className="sidebar-link sidebar-signout" onClick={onCerrarSesion} title="Cerrar Sesión">
          <IoIosExit className="sidebar-icon" />
          {!collapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;