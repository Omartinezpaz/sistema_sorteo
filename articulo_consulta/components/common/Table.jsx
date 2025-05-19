import React from 'react';
import PropTypes from 'prop-types';
import { EstadoBadge } from './Chip';

/**
 * Componente TableContainer que envuelve las tablas
 */
export const TableContainer = ({ children, className = '', ...props }) => {
  return (
    <div className={`table-container ${className}`} {...props}>
      {children}
    </div>
  );
};

/**
 * Componente Table estandarizado
 */
const Table = ({ 
  columns, 
  data, 
  onRowClick, 
  keyField = 'id',
  isLoading = false,
  emptyMessage = 'No hay datos disponibles',
  className = '',
  ...props 
}) => {
  // Si no hay datos y no está cargando
  if (data.length === 0 && !isLoading) {
    return (
      <div className="p-8 text-center text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  // Si está cargando
  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-2 text-gray-500">Cargando datos...</p>
      </div>
    );
  }

  return (
    <table className={`table ${className}`} {...props}>
      <thead>
        <tr>
          {columns.map((column, index) => (
            <th 
              key={index}
              style={{ 
                width: column.width || 'auto',
                textAlign: column.align || 'left'
              }}
            >
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row) => (
          <tr 
            key={row[keyField] || Math.random().toString(36)} 
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            style={{ cursor: onRowClick ? 'pointer' : 'default' }}
          >
            {columns.map((column, index) => (
              <td 
                key={index}
                style={{ 
                  textAlign: column.align || 'left'
                }}
              >
                {renderCell(row, column)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

/**
 * Renderiza el contenido de una celda según su tipo
 */
const renderCell = (row, column) => {
  // Si tiene un renderizador específico
  if (column.render) {
    return column.render(row);
  }

  // Si es un campo anidado (por ejemplo "usuario.nombre")
  if (column.field && column.field.includes('.')) {
    const fields = column.field.split('.');
    let value = { ...row };
    for (const field of fields) {
      value = value[field];
      if (value === undefined || value === null) break;
    }
    return value || '-';
  }

  // Si es un campo simple
  if (column.field) {
    const value = row[column.field];
    
    // Si es un campo de estado con valores predefinidos
    if (column.type === 'estado') {
      return <EstadoBadge estado={value} />;
    }
    
    // Si es un campo de fecha
    if (column.type === 'date' && value) {
      return new Date(value).toLocaleDateString();
    }
    
    // Si es un campo fecha-hora
    if (column.type === 'datetime' && value) {
      return new Date(value).toLocaleString();
    }
    
    // Si es un campo booleano
    if (column.type === 'boolean') {
      return value ? 'Sí' : 'No';
    }
    
    // Para cualquier otro tipo de dato
    return value !== undefined && value !== null ? value : '-';
  }

  return null;
};

/**
 * Componente de paginación para tablas
 */
export const TablePagination = ({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
  className = '',
  ...props
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  if (totalPages <= 1) return null;
  
  const pageNumbers = [];
  const maxPages = 5;
  
  let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
  let endPage = Math.min(totalPages, startPage + maxPages - 1);
  
  if (endPage - startPage + 1 < maxPages) {
    startPage = Math.max(1, endPage - maxPages + 1);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }
  
  return (
    <div className={`flex items-center justify-between py-3 ${className}`} {...props}>
      <div className="text-sm text-gray-500">
        Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} a {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} resultados
      </div>
      <div className="flex space-x-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={`px-2 py-1 rounded ${
            currentPage === 1
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-primary hover:bg-primary-transparent'
          }`}
        >
          &laquo;
        </button>
        
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-2 py-1 rounded ${
            currentPage === 1
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-primary hover:bg-primary-transparent'
          }`}
        >
          &lsaquo;
        </button>
        
        {pageNumbers.map(number => (
          <button
            key={number}
            onClick={() => onPageChange(number)}
            className={`px-3 py-1 rounded ${
              number === currentPage
                ? 'bg-primary text-white'
                : 'text-primary hover:bg-primary-transparent'
            }`}
          >
            {number}
          </button>
        ))}
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-2 py-1 rounded ${
            currentPage === totalPages
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-primary hover:bg-primary-transparent'
          }`}
        >
          &rsaquo;
        </button>
        
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={`px-2 py-1 rounded ${
            currentPage === totalPages
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-primary hover:bg-primary-transparent'
          }`}
        >
          &raquo;
        </button>
      </div>
    </div>
  );
};

TableContainer.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

Table.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      header: PropTypes.node.isRequired,
      field: PropTypes.string,
      render: PropTypes.func,
      width: PropTypes.string,
      align: PropTypes.oneOf(['left', 'center', 'right']),
      type: PropTypes.oneOf(['text', 'date', 'datetime', 'estado', 'boolean'])
    })
  ).isRequired,
  data: PropTypes.array.isRequired,
  onRowClick: PropTypes.func,
  keyField: PropTypes.string,
  isLoading: PropTypes.bool,
  emptyMessage: PropTypes.string,
  className: PropTypes.string
};

TablePagination.propTypes = {
  totalItems: PropTypes.number.isRequired,
  itemsPerPage: PropTypes.number.isRequired,
  currentPage: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  className: PropTypes.string
};

export default Table; 