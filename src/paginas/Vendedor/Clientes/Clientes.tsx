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

// Función centralizada para mostrar errores específicos
const validarCliente = (form: FormCliente): string | null => {
  if (!form.nombre_personal.trim()) return 'El nombre personal es obligatorio.';
  
  const idLimpia = form.numero_identificacion.trim();
  
  const soloNumeros = idLimpia.replace(/-/g, ''); // 1. Creamos una versión que solo tenga los números para contar cuántos hay
  if (soloNumeros.length < 3 || soloNumeros.length > 10) { 
    return 'La identificación debe tener entre 3 y 10 números.'; // 2. Validamos la cantidad de números (Independiente de si hay guion o no)
  }
  if (!/^[\d-]+$/.test(idLimpia)) { // 3. Validamos que no haya caracteres raros (solo números y guion permitido)
    return 'La identificación solo permite números y el carácter "-".';
  }
  if ((idLimpia.match(/-/g) || []).length > 1) { // 4. Validamos que solo haya un guion (como pediste antes)
    return 'Solo se permite un guion en la identificación.';
  }

  if (!form.telefono_principal.trim()) return 'El teléfono principal es obligatorio.';
  if (!/^\d{1,10}$/.test(form.telefono_principal)) return 'El teléfono principal debe contener solo números (máximo 10).';

  if (form.telefono_alternativo && !/^\d{1,10}$/.test(form.telefono_alternativo)) {
    return 'El teléfono alternativo debe contener solo números (máximo 10).';
  }

  if (form.correo && form.correo.trim() !== '') {
    // Regex básica para validar correo con '@' y '.'
    const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!correoRegex.test(form.correo)) return 'El correo debe tener un formato válido (incluir "@" y un dominio como ".com").';
  }

  if (!form.vendedor_id) return 'Debe asignar un vendedor.';

  return null; // Null significa que todo está perfecto
};

/* ── Componente ─────────────────────────────────────────────────────────── */
const ClientesVendedor: React.FC = () => {
  const [clientes, setClientes]         = useState<Cliente[]>([]);
  const [filtrados, setFiltrados]       = useState<Cliente[]>([]);
  const [cargando, setCargando]         = useState(true);
  const [busqueda, setBusqueda]         = useState('');
  const [pagina, setPagina]             = useState(1);

  // Modales
  const [modalDetalle, setModalDetalle]   = useState<Cliente | null>(null);
  const [modalEditar, setModalEditar]     = useState<Cliente | null>(null);
  const [modalEliminar, setModalEliminar] = useState<Cliente | null>(null);
  const [modalCrear, setModalCrear]       = useState(false);

  // Formularios
  const [formEditar, setFormEditar]     = useState<FormCliente>(FORM_VACIO);
  const [formCrear, setFormCrear]       = useState<FormCliente>(FORM_VACIO);

  // Vendedores para el select
  const [vendedores, setVendedores]     = useState<{ id: string; nombre: string }[]>([]);

  // Estado de carga / mensajes
  const [guardando, setGuardando]       = useState(false);
  const [creando, setCreando]           = useState(false);
  const [mensajeEditar, setMensajeEditar] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [mensajeCrear, setMensajeCrear]   = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  //Link Dashboard
  const location = useLocation(); 
  const navigate = useNavigate();

  // Ordenamiento
  const [orden, setOrden] = useState<{ columna: ColOrdenable; direccion: 'asc' | 'desc' }>({
    columna: 'id',
    direccion: 'asc',
  });

  /* ── Cargar clientes ──────────────────────────────────────────────────── */
  const cargarClientes = async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('id', { ascending: true });

    if (!error && data) {
      setClientes(data as Cliente[]);
      setFiltrados(data as Cliente[]);
    }
    setCargando(false);
  };

  /* ── Cargar vendedores ────────────────────────────────────────────────── */
  const cargarVendedores = async () => {
    const { data } = await supabase
      .from('usuarios')
      .select('id, nombre_razon_social')
      .order('nombre_razon_social');

    if (data) {
      setVendedores(data.map(v => ({ id: v.id, nombre: v.nombre_razon_social })));
    }
  };

  //Link Dashboard
    useEffect(() => {
      // Si en la navegación enviamos el estado 'abrirModalCrear'
      if (location.state && location.state.abrirModalCrear) {
        setModalCrear(true); // Activamos el modal
        
        // Limpiamos el estado de la navegación para que no se abra 
        // infinitamente si el usuario refresca la página (F5)
        navigate(location.pathname, { replace: true, state: {} });
      }
    }, [location, navigate]); // Solo depende de estos dos hooks
    
  useEffect(() => {
    cargarClientes();
    cargarVendedores();
  }, []);

  /* ── Buscador ─────────────────────────────────────────────────────────── */
  useEffect(() => {
    const q = busqueda.toLowerCase();
    setFiltrados(
      clientes.filter(c =>
        c.nombre_personal.toLowerCase().includes(q) ||
        (c.nombre_comercial ?? '').toLowerCase().includes(q) ||
        c.numero_identificacion.toLowerCase().includes(q) ||
        (c.correo ?? '').toLowerCase().includes(q) ||
        c.vendedor_nombre.toLowerCase().includes(q) ||
        c.telefono_principal.includes(q)
      )
    );
    setPagina(1);
  }, [busqueda, clientes]);

  /* ── Ordenamiento ─────────────────────────────────────────────────────── */
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
    return orden.direccion === 'asc' ? 
      <FaSortUp style={{ marginLeft: '4px', verticalAlign: 'middle' }} /> : 
      <FaSortDown style={{ marginLeft: '4px', verticalAlign: 'middle' }} />;
  };

  /* ── Paginación ───────────────────────────────────────────────────────── */
  const totalPaginas = Math.ceil(filtrados.length / REGISTROS_POR_PAGINA);
  const inicio       = (pagina - 1) * REGISTROS_POR_PAGINA;
  const paginados    = clientesOrdenados.slice(inicio, inicio + REGISTROS_POR_PAGINA);

  /* ── Abrir edición ────────────────────────────────────────────────────── */
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

  /* ── Guardar edición ──────────────────────────────────────────────────── */
  const handleGuardarEdicion = async () => {
    if (!modalEditar) return;

    // Ejecutar nueva validación detallada
    const errorValidacion = validarCliente(formEditar);
    if (errorValidacion) {
      setMensajeEditar({ tipo: 'error', texto: errorValidacion });
      return;
    }

    setGuardando(true);
    setMensajeEditar(null);

    // Resolver nombre del vendedor si cambió
    const vendedorSeleccionado = vendedores.find(v => v.id === formEditar.vendedor_id);

    const { error } = await supabase
      .from('clientes')
      .update({
        nombre_personal:       formEditar.nombre_personal,
        nombre_comercial:      formEditar.nombre_comercial || null,
        tipo_identificacion:   formEditar.tipo_identificacion,
        numero_identificacion: formEditar.numero_identificacion,
        correo:                formEditar.correo || null,
        telefono_principal:    formEditar.telefono_principal,
        telefono_alternativo:  formEditar.telefono_alternativo || null,
        direccion:             formEditar.direccion || null,
        notas:                 formEditar.notas || null,
        vendedor_id:           formEditar.vendedor_id,
        vendedor_nombre:       vendedorSeleccionado?.nombre ?? formEditar.vendedor_nombre,
        fecha_actualizacion:   new Date().toISOString(),
      })
      .eq('id', modalEditar.id);

    if (error) {
      setMensajeEditar({ tipo: 'error', texto: `Error: ${error.message}` });
    } else {
      setMensajeEditar({ tipo: 'ok', texto: '¡Cliente actualizado correctamente!' });
      await cargarClientes();
      setTimeout(() => { setModalEditar(null); setMensajeEditar(null); }, 1200);
    }
    setGuardando(false);
  };

  /* ── Eliminar ─────────────────────────────────────────────────────────── */
  const handleEliminar = async () => {
    if (!modalEliminar) return;
    setGuardando(true);

    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', modalEliminar.id);

    if (!error) {
      await cargarClientes();
      setModalEliminar(null);
    }
    setGuardando(false);
  };

  /* ── Crear cliente ────────────────────────────────────────────────────── */
  const handleCrearCliente = async () => {
    // Ejecutar nueva validación detallada
    const errorValidacion = validarCliente(formCrear);
    if (errorValidacion) {
      setMensajeCrear({ tipo: 'error', texto: errorValidacion });
      return;
    }

    setCreando(true);
    setMensajeCrear(null);

    const vendedorSeleccionado = vendedores.find(v => v.id === formCrear.vendedor_id);

    const { error } = await supabase.from('clientes').insert({
      nombre_personal:       formCrear.nombre_personal,
      nombre_comercial:      formCrear.nombre_comercial || null,
      tipo_identificacion:   formCrear.tipo_identificacion,
      numero_identificacion: formCrear.numero_identificacion,
      correo:                formCrear.correo || null,
      telefono_principal:    formCrear.telefono_principal,
      telefono_alternativo:  formCrear.telefono_alternativo || null,
      direccion:             formCrear.direccion || null,
      notas:                 formCrear.notas || null,
      vendedor_id:           formCrear.vendedor_id,
      vendedor_nombre:       vendedorSeleccionado?.nombre ?? '',
    });

    if (error) {
      setMensajeCrear({ tipo: 'error', texto: `Error: ${error.message}` });
    } else {
      setMensajeCrear({ tipo: 'ok', texto: '¡Cliente creado exitosamente!' });
      await cargarClientes();
      setTimeout(() => {
        setModalCrear(false);
        setMensajeCrear(null);
        setFormCrear(FORM_VACIO);
      }, 1200);
    }
    setCreando(false);
  };

  /* ── Render ────────────────────────────────────────────────────────────── */
  return (
    <div className="clientes-page">

      {/* Encabezado */}
      <div className="clientes-header">
        <h2 className="clientes-title">
          Clientes
        </h2>
        <button className="btn-nuevo-cliente" onClick={() => { setFormCrear(FORM_VACIO); setMensajeCrear(null); setModalCrear(true); }}>
          <FaPlus /> Nuevo Cliente
        </button>
      </div>

      {/* Tabla principal */}
      <div className="dash-card">
        <div className="clientes-toolbar">
          <div className="clientes-toolbar-left">
            <span className="toolbar-label">Mostrando</span>
            <span className="toolbar-count">{filtrados.length}</span>
            <span className="toolbar-label">registros</span>
          </div>
          <div className="clientes-toolbar-right">
            <span className="toolbar-label">Buscar:</span>
            <input
              className="clientes-buscador"
              type="text"
              placeholder="Nombre, identificación, vendedor..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        {cargando ? (
          <p className="clientes-cargando">Cargando clientes...</p>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="pedidos-table clientes-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('id')} style={{ cursor: 'pointer' }}>
                      ID{iconoOrden('id')}
                    </th>
                    <th onClick={() => handleSort('nombre_personal')} style={{ cursor: 'pointer' }}>
                      Nombre{iconoOrden('nombre_personal')}
                    </th>
                    <th onClick={() => handleSort('nombre_comercial')} style={{ cursor: 'pointer' }}>
                      Nombre Comercial{iconoOrden('nombre_comercial')}
                    </th>
                    <th onClick={() => handleSort('numero_identificacion')} style={{ cursor: 'pointer' }}>
                      Identificación{iconoOrden('numero_identificacion')}
                    </th>
                    <th>Teléfono</th>
                    <th onClick={() => handleSort('vendedor_nombre')} style={{ cursor: 'pointer' }}>
                      Vendedor{iconoOrden('vendedor_nombre')}
                    </th>
                    <th onClick={() => handleSort('fecha_creacion')} style={{ cursor: 'pointer' }}>
                      Creado{iconoOrden('fecha_creacion')}
                    </th>
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

                        {/* Nombre personal con avatar */}
                        <td>
                          <div className="cliente-nombre-cell">
                            <div className="cliente-nombre-stack">
                              <span className="cliente-nombre-principal">{c.nombre_personal}</span>
                              {c.correo && (
                                <span className="cliente-nombre-comercial">{c.correo}</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Nombre comercial */}
                        <td>{c.nombre_comercial || <span style={{ color: '#bbb' }}>—</span>}</td>

                        {/* Identificación */}
                        <td>
                          <span className="badge-id">{c.tipo_identificacion ?? '—'}</span>
                          {c.numero_identificacion}
                        </td>

                        {/* Teléfono */}
                        <td>{c.telefono_principal}</td>

                        {/* Vendedor */}
                        <td>
                          <span className="badge-vendedor-link">
                            {c.vendedor_nombre}
                          </span>
                        </td>

                        {/* Fecha */}
                        <td>{formatFecha(c.fecha_creacion)}</td>

                        {/* Acciones */}
                        <td>
                          <div className="clientes-acciones">
                            <button
                              className="btn-accion btn-ver"
                              title="Ver detalle"
                              onClick={() => setModalDetalle(c)}
                            ><FaEye /></button>
                            <button
                              className="btn-accion btn-editar"
                              title="Editar"
                              onClick={() => handleAbrirEditar(c)}
                            ><FaEdit /></button>
                            <button
                              className="btn-accion btn-eliminar"
                              title="Eliminar"
                              onClick={() => setModalEliminar(c)}
                            ><FaTrash /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div className="clientes-paginacion">
              <span className="paginacion-info">
                Mostrando {filtrados.length === 0 ? 0 : inicio + 1} al{' '}
                {Math.min(inicio + REGISTROS_POR_PAGINA, filtrados.length)} de{' '}
                {filtrados.length} registros
              </span>
              <div className="paginacion-botones">
                <button className="btn-pagina" disabled={pagina === 1} onClick={() => setPagina(p => p - 1)}>
                  Anterior
                </button>
                {Array.from({ length: totalPaginas }, (_, i) => (
                  <button
                    key={i + 1}
                    className={`btn-pagina ${pagina === i + 1 ? 'activa' : ''}`}
                    onClick={() => setPagina(i + 1)}
                  >{i + 1}</button>
                ))}
                <button className="btn-pagina" disabled={pagina === totalPaginas || totalPaginas === 0} onClick={() => setPagina(p => p + 1)}>
                  Siguiente
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Modal Ver Detalle ──────────────────────────────────────────── */}
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
              <div className="detalle-fila">
                <span>Identificación</span>
                <strong><span className="badge-id">{modalDetalle.tipo_identificacion}</span>{modalDetalle.numero_identificacion}</strong>
              </div>

              <p className="detalle-seccion-titulo">Contacto</p>
              <div className="detalle-fila"><span>Correo</span><strong>{modalDetalle.correo || '—'}</strong></div>
              <div className="detalle-fila"><span>Teléfono principal</span><strong>{modalDetalle.telefono_principal}</strong></div>
              <div className="detalle-fila"><span>Teléfono alternativo</span><strong>{modalDetalle.telefono_alternativo || '—'}</strong></div>
              <div className="detalle-fila"><span>Dirección</span><strong>{modalDetalle.direccion || '—'}</strong></div>

              <p className="detalle-seccion-titulo">Vendedor</p>
              <div className="detalle-fila">
                <span>Registrado por</span>
                <strong><span className="badge-vendedor-link">{modalDetalle.vendedor_nombre}</span></strong>
              </div>

              <p className="detalle-seccion-titulo">Auditoría</p>
              <div className="detalle-fila"><span>Fecha creación</span><strong>{formatFecha(modalDetalle.fecha_creacion)}</strong></div>
              <div className="detalle-fila"><span>Última actualización</span><strong>{formatFecha(modalDetalle.fecha_actualizacion)}</strong></div>

              {modalDetalle.notas && (
                <>
                  <p className="detalle-seccion-titulo">Notas internas</p>
                  <div className="detalle-notas">{modalDetalle.notas}</div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-modal-cancelar" onClick={() => setModalDetalle(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Editar ──────────────────────────────────────────────── */}
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
                <input value={formEditar.nombre_personal} onChange={e => setFormEditar(p => ({ ...p, nombre_personal: e.target.value }))} />
              </div>
              <div className="perfil-campo">
                <label>Nombre comercial</label>
                <input value={formEditar.nombre_comercial} placeholder="Razón social o marca" onChange={e => setFormEditar(p => ({ ...p, nombre_comercial: e.target.value }))} />
              </div>
              <div className="form-fila">
                <div className="perfil-campo">
                  <label>Tipo de ID</label>
                  <select value={formEditar.tipo_identificacion} onChange={e => setFormEditar(p => ({ ...p, tipo_identificacion: e.target.value }))}>
                    {['CC', 'NIT', 'PASAPORTE', 'CE'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="perfil-campo">
                  <label>Número identificación *</label>
                  <input 
                    placeholder="123456789" 
                    value={formEditar.numero_identificacion} // Correcto para editar
                    onChange={e => {
                      const val = e.target.value;
                      // 1. Solo permite números y guiones
                      const filtrado = val.replace(/[^\d-]/g, '');
                      
                      // 2. Solo permite un guion
                      const partes = filtrado.split('-');
                      let final = partes.length > 2 
                        ? partes[0] + '-' + partes.slice(1).join('') 
                        : filtrado;

                      // 3. LIMITAR A 10 NÚMEROS (sin contar el guion)
                      const soloNumeros = final.replace(/-/g, '');
                      if (soloNumeros.length > 10) {
                        // Si se pasa de 10, reconstruimos el string respetando el guion pero cortando el exceso
                        const indiceGuion = final.indexOf('-');
                        const limpia = soloNumeros.slice(0, 10);
                        if (indiceGuion !== -1) {
                          final = limpia.slice(0, indiceGuion) + '-' + limpia.slice(indiceGuion);
                        } else {
                          final = limpia;
                        }
                      }

                      setFormEditar(p => ({ ...p, numero_identificacion: final }));
                    }} 
                  />
                </div>
              </div>

              <p className="detalle-seccion-titulo">Contacto</p>
              <div className="perfil-campo">
                <label>Correo</label>
                <input type="email" value={formEditar.correo} onChange={e => setFormEditar(p => ({ ...p, correo: e.target.value }))} />
              </div>
              <div className="form-fila">
                <div className="perfil-campo">
                  <label>Teléfono principal *</label>
                  <input 
                    value={formEditar.telefono_principal} 
                    // Remueve todo lo que no sea número y limita a 10 dígitos
                    onChange={e => setFormEditar(p => ({ ...p, telefono_principal: e.target.value.replace(/\D/g, '').slice(0, 10) }))} 
                  />
                </div>
                <div className="perfil-campo">
                  <label>Teléfono alternativo</label>
                  <input 
                    value={formEditar.telefono_alternativo} 
                    // Remueve todo lo que no sea número y limita a 10 dígitos
                    onChange={e => setFormEditar(p => ({ ...p, telefono_alternativo: e.target.value.replace(/\D/g, '').slice(0, 10) }))} 
                  />
                </div>
              </div>
              <div className="perfil-campo">
                <label>Dirección</label>
                <input value={formEditar.direccion} onChange={e => setFormEditar(p => ({ ...p, direccion: e.target.value }))} />
              </div>

              <p className="detalle-seccion-titulo">Vendedor</p>
              <div className="perfil-campo">
                <label>Vendedor asignado *</label>
                <select
                  value={formEditar.vendedor_id}
                  onChange={e => setFormEditar(p => ({ ...p, vendedor_id: e.target.value }))}
                >
                  <option value="">— Seleccionar vendedor —</option>
                  {vendedores.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
                </select>
              </div>

              <p className="detalle-seccion-titulo">Notas internas</p>
              <div className="perfil-campo">
                <label>Observaciones</label>
                <textarea value={formEditar.notas} placeholder="Notas internas del cliente..." onChange={e => setFormEditar(p => ({ ...p, notas: e.target.value }))} />
              </div>

              {mensajeEditar && (
                <p className={`perfil-mensaje ${mensajeEditar.tipo === 'ok' ? 'perfil-ok' : 'perfil-error'}`}>
                  {mensajeEditar.texto}
                </p>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-modal-cancelar" onClick={() => setModalEditar(null)}>Cancelar</button>
              <button className="perfil-btn-guardar" onClick={handleGuardarEdicion} disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Confirmar Eliminar ───────────────────────────────────── */}
      {modalEliminar && (
        <div className="modal-overlay" onClick={() => setModalEliminar(null)}>
          <div className="modal-box modal-pequeño" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Eliminar Cliente</h3>
              <button className="modal-cerrar" onClick={() => setModalEliminar(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p>¿Estás seguro de eliminar a <strong>{modalEliminar.nombre_personal}</strong>?</p>
              <p className="clientes-aviso">Esta acción no se puede deshacer.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-modal-cancelar" onClick={() => setModalEliminar(null)}>Cancelar</button>
              <button className="btn-modal-eliminar" onClick={handleEliminar} disabled={guardando}>
                {guardando ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Crear Cliente ────────────────────────────────────────── */}
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
                <input placeholder="Nombre completo" value={formCrear.nombre_personal} onChange={e => setFormCrear(p => ({ ...p, nombre_personal: e.target.value }))} />
              </div>
              <div className="perfil-campo">
                <label>Nombre comercial</label>
                <input placeholder="Razón social o marca (opcional)" value={formCrear.nombre_comercial} onChange={e => setFormCrear(p => ({ ...p, nombre_comercial: e.target.value }))} />
              </div>
              <div className="form-fila">
                <div className="perfil-campo">
                  <label>Tipo de ID</label>
                  <select value={formCrear.tipo_identificacion} onChange={e => setFormCrear(p => ({ ...p, tipo_identificacion: e.target.value }))}>
                    {['CC', 'NIT', 'PASAPORTE', 'CE'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="perfil-campo">
                  <label>Número identificación *</label>
                  <input 
                    placeholder="123456789" 
                    value={formCrear.numero_identificacion} 
                    onChange={e => {
                      const val = e.target.value;
                      const filtrado = val.replace(/[^\d-]/g, '');
                      const partes = filtrado.split('-');
                      let final = partes.length > 2 
                        ? partes[0] + '-' + partes.slice(1).join('') 
                        : filtrado;

                      // Limitar a 10 números efectivos
                      const soloNumeros = final.replace(/-/g, '');
                      if (soloNumeros.length > 10) {
                        const indiceGuion = final.indexOf('-');
                        const limpia = soloNumeros.slice(0, 10);
                        if (indiceGuion !== -1) {
                          final = limpia.slice(0, indiceGuion) + '-' + limpia.slice(indiceGuion);
                        } else {
                          final = limpia;
                        }
                      }

                      setFormCrear(p => ({ ...p, numero_identificacion: final }));
                    }} 
                  />
                </div>
              </div>

              <p className="detalle-seccion-titulo">Contacto</p>
              <div className="perfil-campo">
                <label>Correo</label>
                <input type="email" placeholder="correo@ejemplo.com" value={formCrear.correo} onChange={e => setFormCrear(p => ({ ...p, correo: e.target.value }))} />
              </div>
              <div className="form-fila">
                <div className="perfil-campo">
                  <label>Teléfono principal *</label>
                  <input 
                    placeholder="3001234567" 
                    value={formCrear.telefono_principal} 
                    // Remueve todo lo que no sea número y limita a 10 dígitos
                    onChange={e => setFormCrear(p => ({ ...p, telefono_principal: e.target.value.replace(/\D/g, '').slice(0, 10) }))} 
                  />
                </div>
                <div className="perfil-campo">
                  <label>Teléfono alternativo</label>
                  <input 
                    placeholder="3009876543" 
                    value={formCrear.telefono_alternativo} 
                    // Remueve todo lo que no sea número y limita a 10 dígitos
                    onChange={e => setFormCrear(p => ({ ...p, telefono_alternativo: e.target.value.replace(/\D/g, '').slice(0, 10) }))} 
                  />
                </div>
              </div>
              <div className="perfil-campo">
                <label>Dirección</label>
                <input placeholder="Calle 123 # 45-67" value={formCrear.direccion} onChange={e => setFormCrear(p => ({ ...p, direccion: e.target.value }))} />
              </div>

              <p className="detalle-seccion-titulo">Vendedor</p>
              <div className="perfil-campo">
                <label>Vendedor asignado *</label>
                <select value={formCrear.vendedor_id} onChange={e => setFormCrear(p => ({ ...p, vendedor_id: e.target.value }))}>
                  <option value="">— Seleccionar vendedor —</option>
                  {vendedores.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
                </select>
              </div>

              <p className="detalle-seccion-titulo">Notas internas</p>
              <div className="perfil-campo">
                <label>Observaciones</label>
                <textarea placeholder="Notas internas del cliente..." value={formCrear.notas} onChange={e => setFormCrear(p => ({ ...p, notas: e.target.value }))} />
              </div>

              {mensajeCrear && (
                <p className={`perfil-mensaje ${mensajeCrear.tipo === 'ok' ? 'perfil-ok' : 'perfil-error'}`}>
                  {mensajeCrear.texto}
                </p>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-modal-cancelar" onClick={() => setModalCrear(false)}>Cancelar</button>
              <button className="perfil-btn-guardar" onClick={handleCrearCliente} disabled={creando}>
                {creando ? 'Creando...' : 'Crear Cliente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientesVendedor;