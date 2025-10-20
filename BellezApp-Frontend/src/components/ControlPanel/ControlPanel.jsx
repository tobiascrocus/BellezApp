// components/ControlPanel/controlPanel.jsx

import React, { useState, useEffect } from 'react';
import '../../styles/controlPanel/ControlPanel.css';
import DataTable from './DataTable';
import { getTurnos, deleteTurno, cancelTurno, getUsuarios, deleteUsuario, getPeluqueros } from '../../services/controlPanel';

const ControlPanel = () => {
  const [activeTab, setActiveTab] = useState('turnos');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Estados para cada tipo de datos
  const [turnosData, setTurnosData] = useState([]);
  const [clientesData, setClientesData] = useState([]);
  const [peluquerosData, setPeluquerosData] = useState([]);

  // Cargar datos cuando cambia la pestaña activa
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      switch (activeTab) {
        case 'turnos':
          await loadTurnos();
          break;
        case 'clientes':
          await loadClientes();
          break;
        case 'peluqueros':
          await loadPeluqueros();
          break;
        default:
          break;
      }
    } catch (err) {
      setError(err.message);
      console.error('Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTurnos = async () => {
    const turnos = await getTurnos({ limit: 50 });
    // Formatear los datos para la tabla
    const formattedTurnos = turnos.map(turno => ({
      id: turno.id,
      cliente: turno.cliente,
      peluquero: turno.peluquero,
      fechaHora: formatFechaHora(turno.fecha_hora),
      estado: turno.estado
    }));
    setTurnosData(formattedTurnos);
  };

  const loadClientes = async () => {
    const usuarios = await getUsuarios({ limit: 50 });
    // Filtrar solo clientes
    const clientes = usuarios.filter(u => u.rol === 'cliente');
    const formattedClientes = clientes.map(cliente => ({
      id: cliente.id,
      nombre: `${cliente.nombre} ${cliente.apellido}`,
      telefono: cliente.telefono || 'N/A',
      email: cliente.email
    }));
    setClientesData(formattedClientes);
  };

  const loadPeluqueros = async () => {
    const peluqueros = await getPeluqueros();
    const formattedPeluqueros = peluqueros.map(peluquero => ({
      id: peluquero.id,
      nombre: `${peluquero.nombre} ${peluquero.apellido}`,
      telefono: peluquero.telefono || 'N/A',
      email: peluquero.email
    }));
    setPeluquerosData(formattedPeluqueros);
  };

  // Formatear fecha y hora
  const formatFechaHora = (fechaHora) => {
    const fecha = new Date(fechaHora);
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const anio = fecha.getFullYear();
    const horas = String(fecha.getHours()).padStart(2, '0');
    const minutos = String(fecha.getMinutes()).padStart(2, '0');
    return `${dia}/${mes}/${anio} - ${horas}:${minutos}`;
  };

  const handleEdit = (row) => {
    console.log('Editar', row);
    // Aquí puedes abrir un modal o navegar a un formulario de edición
    alert(`Editar registro con ID: ${row.id}`);
  };

  const handleDelete = async (row) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este registro?')) {
      return;
    }

    try {
      setLoading(true);
      
      switch (activeTab) {
        case 'turnos':
          await deleteTurno(row.id);
          await loadTurnos();
          alert('Turno eliminado correctamente');
          break;
        case 'clientes':
          await deleteUsuario(row.id);
          await loadClientes();
          alert('Cliente eliminado correctamente');
          break;
        case 'peluqueros':
          await deleteUsuario(row.id);
          await loadPeluqueros();
          alert('Peluquero eliminado correctamente');
          break;
        default:
          break;
      }
    } catch (err) {
      alert(`Error al eliminar: ${err.message}`);
      console.error('Error eliminando:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (row) => {
    if (!window.confirm('¿Está seguro de que desea cancelar este turno?')) {
      return;
    }

    try {
      setLoading(true);
      await cancelTurno(row.id);
      await loadTurnos();
      alert('Turno cancelado correctamente');
    } catch (err) {
      alert(`Error al cancelar: ${err.message}`);
      console.error('Error cancelando turno:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="loadingContainer">
          <p>Cargando datos...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="errorContainer">
          <p>Error: {error}</p>
          <button onClick={loadData}>Reintentar</button>
        </div>
      );
    }

    switch (activeTab) {
      case 'turnos':
        return (
          <DataTable
            headers={['Cliente', 'Peluquero', 'Fecha y Hora', 'Estado']}
            data={turnosData}
            actions={{ 
              onEdit: handleEdit, 
              onDelete: handleDelete,
              onCancel: handleCancel 
            }}
          />
        );
      case 'clientes':
        return (
          <DataTable
            headers={['Nombre', 'Teléfono', 'Email']}
            data={clientesData}
            actions={{ onEdit: handleEdit, onDelete: handleDelete }}
          />
        );
      case 'peluqueros':
        return (
          <DataTable
            headers={['Nombre', 'Teléfono', 'Email']}
            data={peluquerosData}
            actions={{ onEdit: handleEdit, onDelete: handleDelete }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <link 
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css" 
        rel="stylesheet"
      />
      <div className="controlPanel">
        <div className="tabsContainer">
          <button 
            className={`tab ${activeTab === 'turnos' ? 'tabActive' : ''}`} 
            onClick={() => setActiveTab('turnos')}
            disabled={loading}
          >
            Turnos
          </button>
          <button 
            className={`tab ${activeTab === 'clientes' ? 'tabActive' : ''}`} 
            onClick={() => setActiveTab('clientes')}
            disabled={loading}
          >
            Clientes
          </button>
          <button 
            className={`tab ${activeTab === 'peluqueros' ? 'tabActive' : ''}`} 
            onClick={() => setActiveTab('peluqueros')}
            disabled={loading}
          >
            Peluqueros
          </button>
        </div>
        <div className="contentContainer">
          {renderContent()}
        </div>
      </div>
    </>
  );
};

export default ControlPanel;

