// components/ControlPanel/DataTable.jsx

import React from 'react';
import '../../styles/controlPanel/DataTable.css';

const DataTable = ({ headers, data, actions }) => {
  // Filtrar el campo 'id' de los valores mostrados
  const getRowValues = (row) => {
    const { id: _, ...rest } = row;
    return Object.values(rest);
  };

  return (
    <div className="tableContainer">
      <table className="dataTable">
        <thead>
          <tr className="theadRow">
            {headers.map((header, index) => (
              <th key={index} className="th">{header}</th>
            ))}
            {actions && <th className="th">Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={headers.length + (actions ? 1 : 0)} className="td" style={{ textAlign: 'center', padding: '40px' }}>
                No hay datos para mostrar
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr key={row.id || index} className="tbodyRow">
                {getRowValues(row).map((value, i) => (
                  <td key={i} className="td">{value}</td>
                ))}
                {actions && (
                  <td className="td">
                    <div className="actions">
                      {actions.onEdit && (
                        <button 
                          className="btnEdit" 
                          onClick={() => actions.onEdit(row)}
                          title="Editar"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                      )}
                      {actions.onCancel && (
                        <button 
                          className="btnCancel" 
                          onClick={() => actions.onCancel(row)}
                          title="Cancelar"
                        >
                          <i className="bi bi-x-circle"></i>
                        </button>
                      )}
                      {actions.onDelete && (
                        <button 
                          className="btnDelete" 
                          onClick={() => actions.onDelete(row)}
                          title="Eliminar"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;