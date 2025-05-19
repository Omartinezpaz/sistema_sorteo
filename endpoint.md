Ran tool
Ahora veamos la configuración actual de las rutas de sorteos:

Read file: server/routes/sorteos.js

Read file: server/routes/premios.js

Read file: server/routes/participantes.js

Read file: server/routes/reportes.js
Ahora, vamos a revisar los modelos para tener una visión completa del sistema:

Ran tool
Basado en mi análisis de lo que ya tienes implementado, vamos a crear o mejorar los endpoints necesarios. Ya tienes una buena base, pero podemos mejorar algunos aspectos:

1. Primero, vamos a asegurarnos de que la ruta de autenticación funcione correctamente. Creemos un archivo para probar la API:


2. Ahora, creemos una ruta de usuario para gestionar usuarios (actualmente solo tienes rutas de autenticación):


3. Ahora, creemos las rutas para gestionar usuarios:


4. Ahora actualicemos el archivo `server.js` para incluir las nuevas rutas de usuarios:


5. Ahora, vamos a actualizar el archivo de test para incluir las pruebas de las nuevas rutas:


6. Finalmente, vamos a asegurarnos de que el modelo Usuario tenga todos los métodos necesarios:

Read file: server/models/Usuario.js


¡Perfecto! Ahora hemos creado todos los endpoints necesarios para el sistema de sorteos. Aquí está el resumen de lo que hemos implementado:

## Endpoints implementados:

### Autenticación y Usuarios:
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar un nuevo usuario (solo admin)
- `GET /api/auth/me` - Obtener usuario actual
- `GET /api/usuarios` - Listar todos los usuarios (solo admin)
- `GET /api/usuarios/:id` - Obtener un usuario por ID
- `PUT /api/usuarios/:id` - Actualizar datos de usuario
- `PATCH /api/usuarios/:id/password` - Cambiar contraseña
- `DELETE /api/usuarios/:id` - Eliminar un usuario (solo admin)

### Sorteos:
- `GET /api/sorteos` - Listar todos los sorteos
- `GET /api/sorteos/mis-sorteos` - Obtener los sorteos del usuario autenticado
- `GET /api/sorteos/publicos` - Obtener sorteos públicos (accesible sin autenticación)
- `GET /api/sorteos/:id` - Obtener un sorteo por ID
- `POST /api/sorteos` - Crear un nuevo sorteo
- `PUT /api/sorteos/:id` - Actualizar un sorteo
- `PATCH /api/sorteos/:id/estado` - Actualizar el estado de un sorteo
- `DELETE /api/sorteos/:id` - Eliminar un sorteo
- `POST /api/sorteos/:id/realizar-sorteo` - Realizar un sorteo

### Premios:
- `GET /api/premios` - Listar todos los premios
- `GET /api/premios/categorias` - Obtener categorías de premios
- `GET /api/premios/:id` - Obtener un premio por ID
- `GET /api/premios/sorteo/:sorteoId` - Obtener premios de un sorteo
- `GET /api/premios/sorteo/:sorteoId/disponibles` - Obtener premios disponibles
- `POST /api/premios` - Crear un nuevo premio
- `PUT /api/premios/:id` - Actualizar un premio
- `DELETE /api/premios/:id` - Eliminar un premio

### Participantes:
- `GET /api/participantes` - Listar todos los participantes
- `GET /api/participantes/buscar` - Buscar participantes
- `GET /api/participantes/:id` - Obtener un participante por ID
- `GET /api/participantes/sorteo/:sorteoId` - Obtener participantes de un sorteo
- `POST /api/participantes` - Crear un nuevo participante
- `PUT /api/participantes/:id` - Actualizar un participante
- `PATCH /api/participantes/:id/validar` - Validar un participante
- `DELETE /api/participantes/:id` - Eliminar un participante
- `POST /api/participantes/sorteo/:sorteoId/importar` - Importar participantes en lote

### Reportes:
- `GET /api/reportes/sorteo/:id/excel` - Generar reporte Excel de un sorteo
- `GET /api/reportes/sorteo/:id/csv` - Generar reporte CSV de un sorteo
- `GET /api/reportes/sorteo/:id/pdf` - Generar reporte PDF de un sorteo

## Archivos para pruebas:
- Creamos `server/test-api.http` con ejemplos para probar todas las rutas API

¿Quieres probar estos endpoints para ver si están funcionando correctamente? O ¿prefieres que implementemos algo adicional?
