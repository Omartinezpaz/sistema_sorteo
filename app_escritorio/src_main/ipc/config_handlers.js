const { ipcMain } = require('electron');
const db = require('../database/db');

function setupConfigHandlers() {
  // Obtener lista de estados
  ipcMain.handle('config:getEstados', async () => {
    try {
      const result = await db.query(`
        SELECT cod_estado, nombre, poblacion
        FROM estados
        ORDER BY nombre
      `);
      return result.rows;
    } catch (error) {
      console.error('Error al obtener estados:', error);
      throw error;
    }
  });

  // Obtener municipios por estado
  ipcMain.handle('config:getMunicipios', async (event, codEstado) => {
    try {
      let query = `
        SELECT cod_municipio, nombre, poblacion, cod_estado
        FROM municipios
      `;
      
      const params = [];
      
      // Si se proporciona un código de estado, filtrar por ese estado
      if (codEstado) {
        query += ' WHERE cod_estado = $1';
        params.push(codEstado);
      }
      
      query += ' ORDER BY nombre';
      
      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error al obtener municipios:', error);
      throw error;
    }
  });

  // Obtener parroquias por municipio
  ipcMain.handle('config:getParroquias', async (event, codMunicipio) => {
    try {
      let query = `
        SELECT cod_parroquia, nombre, poblacion, cod_municipio, cod_estado
        FROM parroquias
      `;
      
      const params = [];
      
      // Si se proporciona un código de municipio, filtrar por ese municipio
      if (codMunicipio) {
        query += ' WHERE cod_municipio = $1';
        params.push(codMunicipio);
      }
      
      query += ' ORDER BY nombre';
      
      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error al obtener parroquias:', error);
      throw error;
    }
  });
}

module.exports = setupConfigHandlers; 