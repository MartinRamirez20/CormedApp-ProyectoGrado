import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../../supabase.ts';
import '../../Administrador/Clientes/Clientes.css';

import { FaEdit, FaTrash, FaPlus, FaEye, FaSortUp, FaSortDown } from 'react-icons/fa';

/* ── Tipos ──────────────────────────────────────────────────────────────── */
interface Cliente {
  id: number;
  nombre_personal: string;
  nombre_comercial: string | null;
  tipo_identificacion: string | null;
  numero_identificacion: string;
  correo: string | null;
  telefono_principal: string;
  telefono_alternativo: string | null;
  direccion: string | null;
  notas: string | null;
  vendedor_id: string;
  vendedor_nombre: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

type ColOrdenable =
  | 'id'
  | 'nombre_personal'
  | 'nombre_comercial'
  | 'numero_identificacion'
  | 'vendedor_nombre'
  | 'fecha_creacion';

interface FormCliente {
  nombre_personal: string;
  nombre_comercial: string;
  tipo_identificacion: string;
  numero_identificacion: string;
  correo: string;
  telefono_principal: string;
  telefono_alternativo: string;
  direccion: string;
  notas: string;
  vendedor_id: string;
  vendedor_nombre: string;
}

const FORM_VACIO: FormCliente = {
  nombre_personal: '',
  nombre_comercial: '',
  tipo_identificacion: 'CC',
  numero_identificacion: '',
  correo: '',
  telefono_principal: '',
  telefono_alternativo: '',
  direccion: '',
  notas: '',
  vendedor_id: '',
  vendedor_nombre: '',
};

const REGISTROS_POR_PAGINA = 10;

/* ── Helpers de Validación y Formateo ───────────────────────────────────── */
const formatFecha = (iso: string) =>
  new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'numeric', year: 'numeric',
  });

const validarCliente = (form: FormCliente): string | null => {
  if (!form.nombre_personal.trim()) return 'El nombre personal es obligatorio.';
  const idLimpia = form.numero_identificacion.trim();
  const soloNumeros = idLimpia.replace(/-/g, ''); 
  if (soloNumeros.length < 3 || soloNumeros.length > 10) return 'La identificación debe tener entre 3 y 10 números.';
  if (!/^[\d-]+$/.test(idLimpia)) return 'La identificación solo permite números y el carácter "-".';
  if ((idLimpia.match(/-/g) || []).length > 1) return 'Solo se permite un guion en la identificación.';
  if (!form.telefono_principal.trim()) return 'El teléfono principal es obligatorio.';
  if (!/^\d{1,10}$/.test(form.telefono_principal)) return 'El teléfono principal debe contener solo números (máximo 10).';
  if (form.telefono_alternativo && !/^\d{1,10}$/.test(form.telefono_alternativo)) return 'El teléfono alternativo debe contener solo números (máximo 10).';
  if (form.correo && form.correo.trim() !== '') {
    const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!correoRegex.test(form.correo)) return 'El correo debe tener un formato válido.';
  }
  return null;
};

/* ── Componente ─────────────────────────────────────────────────────────── */
const ClientesVendedor: React.FC = () => {
  const [clientes, setClientes]         = useState<Cliente[]>([]);
  const [filtrados, setFiltrados]       = useState<Cliente[]>([]);
  const [cargando, setCargando]         = useState(true);
  const [busqueda, setBusqueda]         = useState('');
  const [pagina, setPagina]             = useState(1);

  // Vendedor en sesión
  const [vendedorSesion, setVendedorSesion] = useState<{ id: string; nombre: string } | null>(null);

  // Modales
  const [modalDetalle, setModalDetalle]   = useState<Cliente | null>(null);
  const [modalEditar, setModalEditar]     = useState<Cliente | null>(null);
  const [modalEliminar, setModalEliminar] = useState<Cliente | null>(null);
  const [modalCrear, setModalCrear]       = useState(false);

  // Formularios
  const [formEditar, setFormEditar]     = useState<FormCliente>(FORM_VACIO);
  const [formCrear, setFormCrear]       = useState<FormCliente>(FORM_VACIO);

  // Estado carga / mensajes
  const [guardando, setGuardando]       = useState(false);
  const [creando, setCreando]           = useState(false);
  const [mensajeEditar, setMensajeEditar] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [mensajeCrear, setMensajeCrear]   = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  const location = useLocation(); 
  const navigate = useNavigate();

  const [orden, setOrden] = useState<{ columna: ColOrdenable; direccion: 'asc' | 'desc' }>({
    columna: 'id',
    direccion: 'asc',
  });

  const cargarVendedorActual = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('usuarios').select('nombre_razon_social').eq('id', user.id).single();
      if (data) setVendedorSesion({ id: user.id, nombre: data.nombre_razon_social });
    }
  };

  const cargarClientes = async () => {
    setCargando(true);
    const { data, error } = await supabase.from('clientes').select('*').order('id', { ascending: true });
    if (!error && data) {
      setClientes(data as Cliente[]);
      setFiltrados(data as Cliente[]);
    }
    setCargando(false);
  };

  useEffect(() => {
    cargarVendedorActual();
    cargarClientes();
  }, []);

  useEffect(() => {
    if (location.state && location.state.abrirModalCrear) {
      setModalCrear(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  useEffect(() => {
    const q = busqueda.toLowerCase();
    setFiltrados(clientes.filter(c =>
        c.nombre_personal.toLowerCase().includes(q) ||
        (c.nombre_comercial ?? '').toLowerCase().includes(q) ||
        c.numero_identificacion.toLowerCase().includes(q) ||
        c.vendedor_nombre.toLowerCase().includes(q)
    ));
    setPagina(1);
  }, [busqueda, clientes]);

  const clientesOrdenados = [...filtrados].sort((a, b) => {
    const valA = (a[orden.columna] ?? '') as string | number;
    const valB = (b[orden.columna] ?? '') as string | number;
    if (valA < valB) return orden.direccion === 'asc' ? -1 : 1;
    if (valA > valB) return orden.direccion === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (columna: ColOrdenable) => {
    const esAsc = orden.columna === columna && orden.direccion === 'asc';
    setOrden({ columna, direccion: esAsc ? 'desc' : 'asc' });
  };

  const iconoOrden = (col: ColOrdenable) => {
    if (orden.columna !== col) return null;
    return orden.direccion === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  const totalPaginas = Math.ceil(filtrados.length / REGISTROS_POR_PAGINA);
  const inicio = (pagina - 1) * REGISTROS_POR_PAGINA;
  const paginados = clientesOrdenados.slice(inicio, inicio + REGISTROS_POR_PAGINA);

  const handleAbrirEditar = (c: Cliente) => {
    setModalEditar(c);
    setMensajeEditar(null);
    setFormEditar({
      nombre_personal:       c.nombre_personal,
      nombre_comercial:      c.nombre_comercial ?? '',
      tipo_identificacion:   c.tipo_identificacion ?? 'CC',
      numero_identificacion: c.numero_identificacion,
      correo:                c.correo ?? '',
      telefono_principal:    c.telefono_principal,
      telefono_alternativo:  c.telefono_alternativo ?? '',
      direccion:             c.direccion ?? '',
      notas:                 c.notas ?? '',
      vendedor_id:           c.vendedor_id,
      vendedor_nombre:       c.vendedor_nombre,
    });
  };

  const handleGuardarEdicion = async () => {
    if (!modalEditar) return;
    const errorValidacion = validarCliente(formEditar);
    if (errorValidacion) {
      setMensajeEditar({ tipo: 'error', texto: errorValidacion });
      return;
    }
    setGuardando(true);
    const { error } = await supabase.from('clientes').update({
      ...formEditar,
      nombre_comercial: formEditar.nombre_comercial || null,
      correo: formEditar.correo || null,
      telefono_alternativo: formEditar.telefono_alternativo || null,
      direccion: formEditar.direccion || null,
      notas: formEditar.notas || null,
      fecha_actualizacion: new Date().toISOString(),
    }).eq('id', modalEditar.id);

    if (error) {
      setMensajeEditar({ tipo: 'error', texto: error.message });
    } else {
      setMensajeEditar({ tipo: 'ok', texto: '¡Actualizado!' });
      await cargarClientes();
      setTimeout(() => setModalEditar(null), 1200);
    }
    setGuardando(false);
  };

  const handleCrearCliente = async () => {
    const errorValidacion = validarCliente(formCrear);
    if (errorValidacion) {
      setMensajeCrear({ tipo: 'error', texto: errorValidacion });
      return;
    }
    setCreando(true);
    const { error } = await supabase.from('clientes').insert({
      ...formCrear,
      nombre_comercial: formCrear.nombre_comercial || null,
      correo: formCrear.correo || null,
      vendedor_id: vendedorSesion?.id,
      vendedor_nombre: vendedorSesion?.nombre,
    });

    if (error) {
      setMensajeCrear({ tipo: 'error', texto: error.message });
    } else {
      setMensajeCrear({ tipo: 'ok', texto: '¡Creado!' });
      await cargarClientes();
      setTimeout(() => { setModalCrear(false); setFormCrear(FORM_VACIO); }, 1200);
    }
    setCreando(false);
  };

  const handleEliminar = async () => {
    if (!modalEliminar) return;
    setGuardando(true);
    const { error } = await supabase.from('clientes').delete().eq('id', modalEliminar.id);
    if (!error) {
      await cargarClientes();
      setModalEliminar(null);
    }
    setGuardando(false);
  };

  return (
    <div className="clientes-page">
      <div className="clientes-header">
        <h2 className="clientes-title">Clientes</h2>
        <button className="btn-nuevo-cliente" onClick={() => { setFormCrear(FORM_VACIO); setMensajeCrear(null); setModalCrear(true); }}>
          <FaPlus /> Nuevo Cliente
        </button>
      </div>

      <div className="dash-card">
        <div className="clientes-toolbar">
          <div className="clientes-toolbar-left">
            <span className="toolbar-label">Mostrando</span>
            <span className="toolbar-count">{filtrados.length}</span>
            <span className="toolbar-label">registros</span>
          </div>
          <div className="clientes-toolbar-right">
            <span className="toolbar-label">Buscar:</span>
            <input className="clientes-buscador" type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Nombre, identificación..." />
          </div>
        </div>

        {cargando ? (
          <p className="clientes-cargando">Cargando...</p>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="pedidos-table clientes-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('id')} style={{ cursor: 'pointer' }}>ID {iconoOrden('id')}</th>
                    <th onClick={() => handleSort('nombre_personal')} style={{ cursor: 'pointer' }}>Nombre {iconoOrden('nombre_personal')}</th>
                    <th onClick={() => handleSort('nombre_comercial')} style={{ cursor: 'pointer' }}>Comercial {iconoOrden('nombre_comercial')}</th>
                    <th onClick={() => handleSort('numero_identificacion')} style={{ cursor: 'pointer' }}>ID {iconoOrden('numero_identificacion')}</th>
                    <th>Teléfono</th>
                    <th onClick={() => handleSort('vendedor_nombre')} style={{ cursor: 'pointer' }}>Vendedor {iconoOrden('vendedor_nombre')}</th>
                    <th onClick={() => handleSort('fecha_creacion')} style={{ cursor: 'pointer' }}>Creado {iconoOrden('fecha_creacion')}</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginados.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="clientes-vacio">No se encontraron clientes.</td>
                    </tr>
                  ) : (
                    paginados.map(c => (
                      <tr key={c.id}>
                        <td>#{c.id}</td>
                        <td>{c.nombre_personal}</td>
                        <td>{c.nombre_comercial || '—'}</td>
                        <td><span className="badge-id">{c.tipo_identificacion}</span> {c.numero_identificacion}</td>
                        <td>{c.telefono_principal}</td>
                        <td><span className="badge-vendedor-link">{c.vendedor_nombre}</span></td>
                        <td>{formatFecha(c.fecha_creacion)}</td>
                        <td>
                          <div className="clientes-acciones">
                            <button className="btn-accion btn-ver" title="Ver detalle" onClick={() => setModalDetalle(c)}><FaEye /></button>
                            <button className="btn-accion btn-editar" title="Editar" onClick={() => handleAbrirEditar(c)}><FaEdit /></button>
                            <button className="btn-accion btn-eliminar" title="Eliminar" onClick={() => setModalEliminar(c)}><FaTrash /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación — Aquí es donde se usan las constantes */}
            <div className="clientes-paginacion">
              <span className="paginacion-info">
                Mostrando {filtrados.length === 0 ? 0 : inicio + 1} al{' '}
                {Math.min(inicio + REGISTROS_POR_PAGINA, filtrados.length)} de{' '}
                {filtrados.length} registros
              </span>
              <div className="paginacion-botones">
                <button 
                  className="btn-pagina" 
                  disabled={pagina === 1} 
                  onClick={() => setPagina(p => p - 1)}
                >
                  Anterior
                </button>
                {Array.from({ length: totalPaginas }, (_, i) => (
                  <button
                    key={i + 1}
                    className={`btn-pagina ${pagina === i + 1 ? 'activa' : ''}`}
                    onClick={() => setPagina(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button 
                  className="btn-pagina" 
                  disabled={pagina === totalPaginas || totalPaginas === 0} 
                  onClick={() => setPagina(p => p + 1)}
                >
                  Siguiente
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* MODAL CREAR */}
      {modalCrear && (
        <div className="modal-overlay" onClick={() => setModalCrear(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Nuevo Cliente</h3>
              <button className="modal-cerrar" onClick={() => setModalCrear(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="detalle-seccion-titulo">Datos personales</p>
              <div className="perfil-campo">
                <label>Nombre personal *</label>
                <input value={formCrear.nombre_personal} onChange={e => setFormCrear({...formCrear, nombre_personal: e.target.value})} />
              </div>
              <div className="perfil-campo">
                <label>Nombre comercial</label>
                <input value={formCrear.nombre_comercial} onChange={e => setFormCrear({...formCrear, nombre_comercial: e.target.value})} />
              </div>
              <div className="form-fila">
                <div className="perfil-campo">
                  <label>Tipo de ID</label>
                  <select value={formCrear.tipo_identificacion} onChange={e => setFormCrear({...formCrear, tipo_identificacion: e.target.value})}>
                    {['CC', 'NIT', 'PASAPORTE', 'CE'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="perfil-campo">
                  <label>Número identificación *</label>
                  <input value={formCrear.numero_identificacion} onChange={e => setFormCrear({...formCrear, numero_identificacion: e.target.value})} />
                </div>
              </div>
              <p className="detalle-seccion-titulo">Contacto</p>
              <div className="perfil-campo">
                <label>Correo</label>
                <input type="email" value={formCrear.correo} onChange={e => setFormCrear({...formCrear, correo: e.target.value})} />
              </div>
              <div className="form-fila">
                <div className="perfil-campo">
                  <label>Teléfono principal *</label>
                  <input value={formCrear.telefono_principal} onChange={e => setFormCrear({...formCrear, telefono_principal: e.target.value.replace(/\D/g, '').slice(0, 10)})} />
                </div>
                <div className="perfil-campo">
                  <label>Teléfono alternativo</label>
                  <input value={formCrear.telefono_alternativo} onChange={e => setFormCrear({...formCrear, telefono_alternativo: e.target.value.replace(/\D/g, '').slice(0, 10)})} />
                </div>
              </div>
              <div className="perfil-campo">
                <label>Dirección</label>
                <input value={formCrear.direccion} onChange={e => setFormCrear({...formCrear, direccion: e.target.value})} />
              </div>

              {/* CAMBIO AQUÍ: Vendedor bloqueado */}
              <p className="detalle-seccion-titulo">Vendedor</p>
              <div className="perfil-campo">
                <label>Vendedor asignado (Bloqueado)</label>
                <input value={vendedorSesion?.nombre || 'Cargando...'} disabled style={{ background: '#f5f5f5', cursor: 'not-allowed' }} />
              </div>

              <p className="detalle-seccion-titulo">Notas internas</p>
              <div className="perfil-campo">
                <label>Observaciones</label>
                <textarea value={formCrear.notas} onChange={e => setFormCrear({...formCrear, notas: e.target.value})} />
              </div>
              {mensajeCrear && <p className={`perfil-mensaje ${mensajeCrear.tipo === 'ok' ? 'perfil-ok' : 'perfil-error'}`}>{mensajeCrear.texto}</p>}
            </div>
            <div className="modal-footer">
              <button className="btn-modal-cancelar" onClick={() => setModalCrear(false)}>Cancelar</button>
              <button className="perfil-btn-guardar" onClick={handleCrearCliente} disabled={creando}>Crear Cliente</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR */}
      {modalEditar && (
        <div className="modal-overlay" onClick={() => setModalEditar(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Editar Cliente</h3>
              <button className="modal-cerrar" onClick={() => setModalEditar(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="detalle-seccion-titulo">Datos personales</p>
              <div className="perfil-campo">
                <label>Nombre personal *</label>
                <input value={formEditar.nombre_personal} onChange={e => setFormEditar({...formEditar, nombre_personal: e.target.value})} />
              </div>
              <div className="perfil-campo">
                <label>Nombre comercial</label>
                <input value={formEditar.nombre_comercial} onChange={e => setFormEditar({...formEditar, nombre_comercial: e.target.value})} />
              </div>
              <div className="form-fila">
                <div className="perfil-campo">
                  <label>Tipo de ID</label>
                  <select value={formEditar.tipo_identificacion} onChange={e => setFormEditar({...formEditar, tipo_identificacion: e.target.value})}>
                    {['CC', 'NIT', 'PASAPORTE', 'CE'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="perfil-campo">
                  <label>Número identificación *</label>
                  <input value={formEditar.numero_identificacion} onChange={e => setFormEditar({...formEditar, numero_identificacion: e.target.value})} />
                </div>
              </div>

              <p className="detalle-seccion-titulo">Contacto</p>
              <div className="perfil-campo">
                <label>Correo</label>
                <input type="email" value={formEditar.correo} onChange={e => setFormEditar({...formEditar, correo: e.target.value})} />
              </div>
              <div className="form-fila">
                <div className="perfil-campo">
                  <label>Teléfono principal *</label>
                  <input value={formEditar.telefono_principal} onChange={e => setFormEditar({...formEditar, telefono_principal: e.target.value.replace(/\D/g, '').slice(0, 10)})} />
                </div>
                <div className="perfil-campo">
                  <label>Teléfono alternativo</label>
                  <input value={formEditar.telefono_alternativo} onChange={e => setFormEditar({...formEditar, telefono_alternativo: e.target.value.replace(/\D/g, '').slice(0, 10)})} />
                </div>
              </div>
              <div className="perfil-campo">
                <label>Dirección</label>
                <input value={formEditar.direccion} onChange={e => setFormEditar({...formEditar, direccion: e.target.value})} />
              </div>

              {/* CAMBIO AQUÍ: Vendedor bloqueado */}
              <p className="detalle-seccion-titulo">Vendedor</p>
              <div className="perfil-campo">
                <label>Vendedor asignado (Bloqueado)</label>
                <input value={formEditar.vendedor_nombre} disabled style={{ background: '#f5f5f5', cursor: 'not-allowed' }} />
              </div>

              <p className="detalle-seccion-titulo">Notas internas</p>
              <div className="perfil-campo">
                <label>Observaciones</label>
                <textarea value={formEditar.notas} onChange={e => setFormEditar({...formEditar, notas: e.target.value})} />
              </div>
              {mensajeEditar && <p className={`perfil-mensaje ${mensajeEditar.tipo === 'ok' ? 'perfil-ok' : 'perfil-error'}`}>{mensajeEditar.texto}</p>}
            </div>
            <div className="modal-footer">
              <button className="btn-modal-cancelar" onClick={() => setModalEditar(null)}>Cancelar</button>
              <button className="perfil-btn-guardar" onClick={handleGuardarEdicion} disabled={guardando}>Guardar Cambios</button>
            </div>
          </div>
        </div>
      )}

      {/* Los modales de Detalle y Eliminar se mantienen igual que los tenías originalmente */}
      {modalDetalle && (
        <div className="modal-overlay" onClick={() => setModalDetalle(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detalle del Cliente</h3>
              <button className="modal-cerrar" onClick={() => setModalDetalle(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="detalle-seccion-titulo">Datos personales</p>
              <div className="detalle-fila"><span>Nombre personal</span><strong>{modalDetalle.nombre_personal}</strong></div>
              <div className="detalle-fila"><span>Nombre comercial</span><strong>{modalDetalle.nombre_comercial || '—'}</strong></div>
              <div className="detalle-fila"><span>Identificación</span><strong><span className="badge-id">{modalDetalle.tipo_identificacion}</span>{modalDetalle.numero_identificacion}</strong></div>
              <p className="detalle-seccion-titulo">Contacto</p>
              <div className="detalle-fila"><span>Correo</span><strong>{modalDetalle.correo || '—'}</strong></div>
              <div className="detalle-fila"><span>Teléfono principal</span><strong>{modalDetalle.telefono_principal}</strong></div>
              <div className="detalle-fila"><span>Dirección</span><strong>{modalDetalle.direccion || '—'}</strong></div>
              <p className="detalle-seccion-titulo">Vendedor</p>
              <div className="detalle-fila"><span>Registrado por</span><strong>{modalDetalle.vendedor_nombre}</strong></div>
            </div>
            <div className="modal-footer">
              <button className="btn-modal-cancelar" onClick={() => setModalDetalle(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {modalEliminar && (
        <div className="modal-overlay" onClick={() => setModalEliminar(null)}>
          <div className="modal-box modal-pequeño" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Eliminar Cliente</h3></div>
            <div className="modal-body"><p>¿Eliminar a <strong>{modalEliminar.nombre_personal}</strong>?</p></div>
            <div className="modal-footer">
              <button className="btn-modal-cancelar" onClick={() => setModalEliminar(null)}>Cancelar</button>
              <button className="btn-modal-eliminar" onClick={handleEliminar}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientesVendedor;