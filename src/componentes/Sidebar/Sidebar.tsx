// Este Sidebar si esta en uso
// Se renderiza en el MainLayout general o por roles
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
  // Se agregó 'facturador' a los roles permitidos
  rol: 'administrador' | 'vendedor' | 'facturador';
}

interface UsuarioInfo {
  nombre: string;
  correo: string;
}

const Sidebar: React.FC<SidebarProps> = ({ onCerrarSesion, rol }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<UsuarioInfo>({ nombre: '...', correo: '' });
  const [collapsed, setCollapsed] = useState(false); 

  // Solo conservamos el estado de expansión de usuarios para el Administrador
  const [usuariosExp, setUsuariosExp] = useState(false);

  // Mapa de rutas base según el rol
  const baseMap: Record<string, string> = {
    administrador: '/admin',
    vendedor:      '/vendedor',
    facturador:    '/facturador',
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

  // Al colapsar, cerramos el submenú de administrador si está abierto
  const handleCollapse = () => {
    setCollapsed(prev => {
      if (!prev) {
        setUsuariosExp(false);
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

        {/* Dashboard — todos los roles lo tienen */}
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
                    navigate(`${base}/usuarios`);
                  } else {
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
          </>
        )}

        {/* ── Solo Facturador ── */}
        {rol === 'facturador' && (
          <>
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