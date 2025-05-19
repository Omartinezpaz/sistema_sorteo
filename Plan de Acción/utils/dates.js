/**
 * Utilidades para el manejo de fechas en la aplicación
 */
import dayjs from 'dayjs';

/**
 * Formatea una fecha para mostrarla en la interfaz de usuario
 * @param {Date|string|dayjs.Dayjs} fecha - La fecha a formatear
 * @param {string} formato - El formato deseado (por defecto: DD/MM/YYYY HH:mm)
 * @returns {string} La fecha formateada o un mensaje de error
 */
export const formatearFecha = (fecha, formato = 'DD/MM/YYYY HH:mm') => {
  try {
    // Si es null o undefined, devolver un mensaje
    if (!fecha) return 'Fecha no especificada';
    
    // Si ya es un objeto dayjs, usarlo directamente
    if (typeof fecha === 'object' && typeof fecha.format === 'function') {
      return fecha.format(formato);
    }
    
    // Si es un string, convertirlo a dayjs
    if (typeof fecha === 'string') {
      const fechaDayjs = dayjs(fecha);
      if (fechaDayjs.isValid()) {
        return fechaDayjs.format(formato);
      } else {
        console.warn("Error al parsear string de fecha en formatearFecha:", fecha);
        return 'Fecha inválida';
      }
    }
    
    // Si es un objeto Date, convertirlo a dayjs
    if (fecha instanceof Date) {
      return dayjs(fecha).format(formato);
    }
    
    // Si llegamos aquí, el formato no es reconocido
    console.warn('Fecha con formato no reconocido en formatearFecha:', fecha);
    return 'Formato de fecha no reconocido';
  } catch (e) {
    console.error('Error en formatearFecha:', e);
    return 'Error al formatear fecha';
  }
};

/**
 * Convierte una fecha a formato ISO para guardar en la base de datos
 * @param {Date|string|dayjs.Dayjs} fecha - La fecha a convertir
 * @returns {string|null} La fecha en formato ISO o null si es inválida
 */
export const fechaToISOString = (fecha) => {
  try {
    // Si es null o undefined, devolver null
    if (!fecha) return null;
    
    // Si ya es un objeto dayjs, usar su método format
    if (typeof fecha === 'object' && typeof fecha.format === 'function') {
      return fecha.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
    }
    
    // Si es un string, verificar si ya está en formato ISO
    if (typeof fecha === 'string') {
      // Intentar convertir a Date y luego a ISO
      const tempDate = new Date(fecha);
      if (!isNaN(tempDate.getTime())) {
        return tempDate.toISOString();
      } else {
        console.warn('Formato de fecha string inválido:', fecha);
        return null;
      }
    }
    
    // Si es un objeto Date, usar toISOString
    if (fecha instanceof Date) {
      return fecha.toISOString();
    }
    
    // Si llegamos aquí, el formato no es reconocido
    console.warn('Fecha con formato no reconocido en fechaToISOString:', fecha);
    return null;
  } catch (e) {
    console.error('Error en fechaToISOString:', e);
    return null;
  }
};