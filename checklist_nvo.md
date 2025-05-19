# Checklist del Sistema de Sorteos (Versión Nueva - Arquitectura de Escritorio con Electron y PostgreSQL Local)

## Configuración Inicial del Proyecto de Escritorio (Electron) ⚙️
- [X] **Framework de Escritorio Decidido:** Electron.js
- [ ] **Configurar Proyecto de Aplicación de Escritorio Electron:**
    - [ ] Inicializar proyecto Node.js con `npm init` en la carpeta `app_escritorio/`.
    - [ ] Instalar dependencias de Electron: `npm install --save-dev electron`.
    - [ ] Instalar dependencias de React para el renderer: `npm install react react-dom`.
    - [ ] Instalar `pg` (cliente PostgreSQL para Node.js) en `app_escritorio/`: `npm install pg`.
    - [ ] Configurar `package.json` en `app_escritorio/` con el script de inicio para Electron (ej. `"start": "electron ."`).
    - [ ] Crear estructura de carpetas base (`src_main`, `src_renderer`, `public`) dentro de `app_escritorio/`.
    - [ ] Crear archivo `main.js` básico en `app_escritorio/src_main/`.
    - [ ] Crear `index.html` básico en `app_escritorio/public/` para el renderer.
- [ ] **Base de Datos Local (PostgreSQL en cada cliente):**
    - [ ] Asegurar que el script `initial.sql` (para PostgreSQL) esté disponible y correcto.
    - [ ] El proceso principal (`src_main/main.js`) deberá conectarse a la instancia local de PostgreSQL del cliente.
    - [ ] Crear lógica o script (ej. en `src_main/database/`) para ejecutar `initial.sql` en la BD local del cliente (si no existe o se necesita reinicializar).
- [ ] **Configuración de Entorno y Herramientas:**
    - [ ] Configurar linters y formateadores (ESLint, Prettier) para el proyecto Electron (main y renderer).
- [ ] **(Opcional) Configuración del Backend Centralizado (si se decide implementar):**
    - [ ] (Mismas tareas que antes, si se opta por esta vía).

## Desarrollo de Aplicación de Escritorio Electron 🖥️
### Proceso Principal (`app_escritorio/src_main/`)
- [ ] **Configuración Inicial (`main.js`):**
    - [ ] Creación de `BrowserWindow` para la ventana principal.
    - [ ] Carga de `public/index.html` en la ventana.
    - [ ] Configuración de opciones de ventana (tamaño, etc.).
- [ ] **Manejo de Base de Datos Local (PostgreSQL con `pg`):**
    - [ ] Implementar funciones en `src_main/database/` para CRUD en todas las tablas necesarias usando `pg`.
    - [ ] Configurar pool de conexiones a PostgreSQL local.
- [ ] **Comunicación IPC (Inter-Process Communication):**
    - [ ] Definir y exponer funciones a través de `ipcMain.handle` para que el proceso renderer pueda solicitar operaciones de BD.
    - [ ] Configurar `preload.js` (en `src_main` o asociado al renderer) para exponer de forma segura las funciones IPC al renderer.
    - [ ] Manejo de subida de archivos (logo, fondo para tiques) si se gestiona desde el proceso principal (guardando en el sistema de archivos local y la ruta en BD).
- [ ] **Lógica de Negocio Principal:**
    - [ ] Implementar lógica de `realizar_sorteo` (seleccionando de la BD PostgreSQL local).
    - [ ] Implementar lógica de `validar_ganador`.
    - [ ] Lógica para generación de reportes (PDF, CSV, Excel) - puede usar librerías Node.js como `pdfkit`, `fast-csv`, `exceljs`.
- [ ] **(Opcional) Sincronización con Backend Central.**

### Proceso Renderer (`app_escritorio/src_renderer/` - React UI)
#### Componentes Base y Layout
- [ ] Navbar (si aplica para la app de escritorio).
- [ ] Layout principal.
- [ ] Componentes compartidos (Botones, Modales, Tablas, Inputs).
- [ ] Configuración de React Router (si la navegación es compleja dentro del renderer).
#### Autenticación (Local)
- [ ] Lógica de login local (si se requiere proteger la app o gestionar múltiples usuarios locales).
- [ ] Almacenamiento seguro de credenciales locales (si aplica).
#### Funcionalidades Principales (Páginas y Componentes)
- [ ] **Dashboard / Página Principal.**
- [ ] **Gestión de Sorteos:**
    - [ ] Formulario Crear/Editar Sorteo (llamando a IPC para guardar en SQLite).
    - [ ] **Sección/Componente para Configuración de Diseño de Tiques Impresos** (JSON `configuracion_diseno_tique`).
        - [ ] Interfaz para subir/seleccionar logo y fondo.
        - [ ] Previsualización en tiempo real del tique.
        - [ ] Funcionalidad para generar PDF de tiques para impresión (podría llamar a una función del proceso principal vía IPC, o hacerlo en el renderer para previsualización).
    - [ ] Listado de Sorteos (datos de SQLite).
    - [ ] Vista detallada de Sorteo.
- [ ] **Gestión de Premios** (CRUD vía IPC a SQLite).
- [ ] **Gestión de Participantes** (CRUD, validación, importación vía IPC a SQLite).
- [ ] **Resultados y Ganadores** (Visualización, selección de ganadores llamando a lógica en proceso principal).
- [ ] **Historial de Sorteos.**
- [ ] **Reportes** (Visualización de reportes generados por el proceso principal).
#### Estado y Servicios del Renderer
- [ ] Lógica de estado (Context API, Redux, Zustand, etc.).
- [ ] "Servicios" o módulos que encapsulan las llamadas IPC al proceso principal (`preload.js` para exponer funciones IPC de forma segura).
- [ ] Manejo de estado local en componentes.
#### UI y Estilos
- [ ] Implementar estilos (CSS, TailwindCSS, etc.).
- [ ] Asegurar responsividad si la ventana es redimensionable.

## (OPCIONAL) Backend Development - Servidor Centralizado 🖥️
(Solo si se necesita sincronización, una API central o administración web)
### Autenticación y Usuarios (Modelo `usuarios` - PostgreSQL)
- [ ] Modelo de Usuario (PostgreSQL).
- [ ] Controlador de Autenticación y Usuarios (API HTTP).
- [ ] Middleware JWT.
- [ ] Rutas API para Auth y Usuarios.
### Sincronización de Datos
- [ ] Endpoints API para recibir datos de las apps de escritorio.
- [ ] Endpoints API para enviar datos actualizados a las apps de escritorio.
- [ ] Lógica para manejar conflictos de sincronización.
### Modelos y Rutas API para entidades principales (Sorteos, Premios, etc. - PostgreSQL)
- [ ] Modelos, Controladores y Rutas para la gestión centralizada (si se requiere).

## Testing (Adaptado para Electron) 🧪
### Pruebas de Aplicación de Escritorio Electron
- [ ] **Proceso Principal:** Pruebas unitarias para lógica de negocio y acceso a BD PostgreSQL (Jest, Mocha).
- [ ] **Proceso Renderer:** Pruebas unitarias para componentes React (Jest, React Testing Library).
- [ ] **Pruebas de Integración:** Pruebas de la comunicación IPC.
- [ ] **Pruebas E2E:** Usando herramientas como Spectron o Playwright para probar la aplicación Electron completa.
### (Opcional) Pruebas Backend Centralizado
- [ ] Pruebas unitarias y de integración para la API (si se implementa).

## Empaquetado y Distribución de Aplicación Electron 📦
- [ ] Configurar scripts para empaquetar la aplicación con `electron-builder`.
- [ ] Generar instaladores para Windows.
- [ ] Considerar actualización automática (ej. con `electron-updater`).

## Documentación 📝
- [ ] `README.md` (actualizar con setup específico de Electron, scripts de build, y **requisito de instalación de PostgreSQL para el usuario final**).
- [ ] Guía de usuario para la aplicación de escritorio (incluyendo cómo instalar/configurar PostgreSQL local si es necesario).
- [ ] Documentación para desarrolladores (arquitectura de la app de escritorio, IPC).
- [ ] (Opcional) Documentación de API del backend central.

## Extras y Optimizaciones ⭐
- [ ] Optimización de rendimiento de la app de escritorio (uso de memoria, CPU).
- [ ] Mejoras de UI/UX.
- [ ] Backups de la base de datos SQLite local (ej. exportar a un archivo).
- [ ] Internacionalización (i18n) de la aplicación.

## Configuración Inicial ⚙️
- [X] Crear estructura de carpetas (ver `proyecto_nvo.md` para detalle)
- [X] Crear archivo `server.js` (punto de entrada backend)
- [X] Configurar archivo `.env` (variables de entorno para BD, JWT, etc.)
- [ ] **Consolidar y Finalizar Esquema de Base de Datos (`initial.sql`)**
- [ ] Instalar dependencias backend (`package.json` nivel raíz y `server/`)
    - [ ] `express`, `pg`, `jsonwebtoken`, `bcryptjs`, `cors`, `dotenv`, `nodemon` (dev)
    - [ ] (Otras según se necesiten: `express-validator`, `multer`, etc.)
- [ ] Instalar dependencias frontend (`client/package.json`)
    - [ ] `react`, `react-dom`, `react-router-dom`, `axios`, `vite` (dev), `@vitejs/plugin-react` (dev)
    - [ ] (Librerías UI como `@mui/material` o `tailwindcss`, si se decide)
- [ ] Verificar conexión y configuración inicial de PostgreSQL
- [ ] Ejecutar migración inicial de la base de datos (`initial.sql`)
- [ ] Configurar scripts en `package.json` (dev, start, server, client, migrate, seed)

## Backend Development 🖥️
### Autenticación y Usuarios (Modelo `usuarios`)
- [ ] Modelo de Usuario (basado en `initial.sql`, con campos de `migracion_sistema` si aplican)
- [ ] Controlador de Autenticación (`authController.js`)
    - [ ] Registro (con validación y hashing de contraseña)
    - [ ] Login (con generación de JWT)
    - [ ] Obtener usuario actual (`/me`)
- [ ] Controlador de Usuarios (`userController.js`)
    - [ ] CRUD para usuarios (listar, obtener por ID, actualizar, eliminar - con restricciones de admin)
    - [ ] Cambiar contraseña
- [ ] Middleware JWT (`auth.js`) para proteger rutas
- [ ] Rutas de Auth y Usuarios (`auth.js`, `usuarios.js`)
    - [ ] `POST /api/auth/login`
    - [ ] `POST /api/auth/register`
    - [ ] `GET /api/auth/me`
    - [ ] `GET /api/usuarios`, `GET /api/usuarios/:id`, `PUT /api/usuarios/:id`, `DELETE /api/usuarios/:id`
    - [ ] `PATCH /api/usuarios/:id/password`

### Sorteos (Modelo `sorteos`)
- [ ] Modelo de Sorteo (basado en `initial.sql`)
- [ ] Controlador de Sorteos (`sorteoController.js`)
    - [ ] CRUD (crear, leer todos, leer mis sorteos, leer públicos, leer por ID, actualizar, eliminar)
    - [ ] Actualizar estado del sorteo (`PATCH /api/sorteos/:id/estado`)
    - [ ] Lógica para `POST /api/sorteos/:id/realizar-sorteo` (usando función `realizar_sorteo` de `initial.sql`)
- [ ] Rutas API para Sorteos (`sorteos.js`)
- [ ] Validaciones para la creación y actualización de sorteos

### Diseño de Tiques Impresos (asociado a Sorteos)
- [ ] **Backend:**
    - [ ] Modelo para Plantillas de Tiques (opcional, si se guardan múltiples diseños por usuario/sorteo)
    - [ ] Campos en modelo `Sorteo` para almacenar configuración de diseño del tique (ej. numeración, textos personalizados, referencia a logo).
    - [ ] Controlador y Rutas API para gestionar la configuración del diseño de tiques (si es compleja o se guardan plantillas).
    - [ ] Considerar librería para generación de PDF/imagen en backend si la previsualización o generación final se hace allí.
- [ ] **Frontend:**
    - [ ] Interfaz para configurar el diseño del tique (dentro de la configuración del sorteo).
        - [ ] Selección de tipo de numeración.
        - [ ] Campos para textos personalizables.
        - [ ] Opción para subir/seleccionar un logo.
        - [ ] Previsualización en tiempo real del diseño del tique.
    - [ ] Lógica para aplicar la configuración y generar una vista previa.
    - [ ] Funcionalidad para exportar la configuración o una hoja de tiques (ej. a PDF para imprimir).

### Premios (Modelo `premios` y `categorias_premios`)
- [ ] Modelo de Premio (basado en `initial.sql`)
- [ ] Modelo de Categorías de Premios (basado en `initial.sql`)
- [ ] Controlador de Premios (`premioController.js`)
    - [ ] CRUD para premios
    - [ ] Listar categorías de premios
    - [ ] Obtener premios por sorteo y disponibles
- [ ] Rutas API para Premios (`premios.js`)
- [ ] Validaciones para la creación y actualización de premios

### Participantes (Modelo `participantes`)
- [ ] Modelo de Participantes (basado en `initial.sql`)
- [ ] Controlador de Participantes (`participanteController.js`)
    - [ ] CRUD para participantes
    - [ ] Buscar participantes
    - [ ] Obtener participantes por sorteo
    - [ ] Validar participante (`PATCH /api/participantes/:id/validar`)
    - [ ] Importar participantes en lote (`POST /api/participantes/sorteo/:sorteoId/importar`)
- [ ] Rutas API para Participantes (`participantes.js`)
- [ ] Validaciones para la creación y actualización de participantes

### Ganadores y Entrega (Modelos `ganadores`, `entregas_premios`)
- [ ] Modelo de Ganadores (basado en `initial.sql`)
- [ ] Modelo de Entregas de Premios (basado en `initial.sql`)
- [ ] Controlador de Ganadores (`ganadorController.js`)
    - [ ] Listar ganadores (general y por sorteo)
    - [ ] Validar ganador (usando función `validar_ganador` de `initial.sql`)
- [ ] Controlador de Entregas de Premios
    - [ ] Registrar entrega de premio
- [ ] Rutas API para Ganadores y Entregas

### Ubicaciones (Modelos `estados`, `municipios`, `parroquias`)
- [ ] Modelos para Estados, Municipios, Parroquias (basado en `initial.sql`)
- [ ] Controlador para Ubicaciones (`ubicacionController.js`)
    - [ ] Listar estados, municipios (por estado), parroquias (por municipio)
- [ ] Rutas API para Ubicaciones
- [ ] Seeds para cargar datos iniciales de ubicaciones (si aplica)

### Reportes y Auditoría (Modelo `actividades`)
- [ ] Lógica para generar reportes (`GET /api/reportes/sorteo/:id/...`)
    - [ ] Excel, CSV, PDF
- [ ] Modelo de Actividades (basado en `initial.sql`)
- [ ] Asegurar que el trigger `registrar_actividad` funcione correctamente
- [ ] Endpoint para consultar el log de actividades (opcional, con filtros)

### Configuración General Backend
- [ ] Configuración de Socket.io (si se requiere tiempo real)
- [ ] Middleware de manejo de errores (`errorHandler.js`)
- [ ] Sistema de Logging (más allá de la tabla `actividades`, ej. para errores de servidor)
- [ ] Middleware de validación de datos de entrada (`validation.js`)

## Frontend Development 🎨
### Componentes Base y Layout
- [ ] Navbar (`client/src/components/shared/Navbar.jsx` o similar)
- [ ] Layout principal (`client/src/components/shared/Layout.jsx`)
    - [ ] Incluir Header, Footer (si aplican), y área de contenido dinámico
- [ ] Componentes compartidos (Botones, Modales, Tablas, Inputs - `client/src/components/shared/`)
- [ ] Estructura de carpetas para componentes (Auth, Sorteo, Dashboard, etc. como en `proyecto_nvo.md`)
- [ ] Configuración de React Router (`App.jsx` o un archivo de rutas dedicado)

### Autenticación Frontend
- [ ] Página de Login (`client/src/pages/Login.jsx`)
- [ ] Página de Registro (si es accesible por usuarios, o panel admin para crear usuarios)
- [ ] Contexto de Autenticación (`client/src/context/AuthContext.jsx`) para manejar estado del usuario y token
- [ ] Protección de rutas (rutas privadas que requieren login)
- [ ] Funciones de utilidad para auth (guardar/remover token, `client/src/utils/auth.js`)
- [ ] Servicio API para autenticación (`client/src/services/authService.js`)

### Funcionalidades Principales (Páginas y Componentes)
**Dashboard / Página Principal (`client/src/pages/HomePage.jsx` o `DashboardPage.jsx`)**
- [ ] Vista general, accesos directos.

**Gestión de Sorteos**
- [ ] Página para Crear/Editar Sorteo (`client/src/pages/ConfiguracionSorteoPage.jsx`)
    - [ ] Formulario con todos los campos del modelo `sorteos`
    - [ ] Componente `ConfiguracionSorteo.jsx`
    - [ ] **Sección/Componente para Configuración de Diseño de Tiques Impresos**
- [ ] Página para Listar Sorteos (`client/src/pages/ListaSorteosPage.jsx`)
    - [ ] Tabla/Lista de sorteos con filtros y paginación
    - [ ] Componente `ListaSorteos.jsx`
- [ ] Página de Vista detallada de Sorteo (`client/src/pages/VerSorteoPage.jsx`)
    - [ ] Detalles del sorteo, premios asociados, participantes, opción de iniciar sorteo.
    - [ ] Componente `DetalleSorteo.jsx` (o similar)
- [ ] Componente `EsperaSorteo.jsx` (si se implementa cuenta regresiva)

**Gestión de Premios**
- [ ] Página/Componente para Configurar/Gestionar Premios (`client/src/pages/ConfiguracionPremiosPage.jsx`)
    - [ ] CRUD para premios asociados a un sorteo.
    - [ ] Componente `ConfiguracionPremios.jsx`

**Gestión de Participantes**
- [ ] Página/Componente para Gestionar Participantes de un Sorteo
    - [ ] CRUD, validación, importación.

**Resultados y Ganadores**
- [ ] Página para mostrar Ganadores del Sorteo (`client/src/pages/GanadoresSorteoPage.jsx`)
    - [ ] Componente `GanadoresSorteo.jsx` (tablas de ganadores)
- [ ] Página para Resultados por Estado/Región (`client/src/pages/SorteoPorEstadoPage.jsx`)
    - [ ] Componente `SorteoPorEstado.jsx`
- [ ] Página/Componente de Resultados Finales/Felicitaciones (`client/src/pages/ResultadosFinalPage.jsx`)
    - [ ] Componente `ResultadosFinal.jsx`

**Historial**
- [ ] Página para ver Historial de Sorteos (`client/src/pages/HistorialSorteosPage.jsx`)

**Administración (si aplica un panel separado)**
- [ ] Gestión de usuarios, logs, configuraciones globales.

### Estado y Servicios Frontend
- [ ] Configuración de Context API o Redux para estado global (si `AuthContext` no es suficiente)
- [ ] Servicios API (`client/src/services/`) para cada entidad: `sorteoService.js`, `premioService.js`, `participanteService.js`, etc.
- [ ] Cliente API configurado (`client/src/api/axiosConfig.js` o similar)
- [ ] Manejo de estado local en componentes (useState, useEffect)
- [ ] Implementación de Socket.io en cliente (si se usa para tiempo real)

### UI y Estilos
- [ ] Implementar estilos (CSS Modules, Styled Components, TailwindCSS, o librería UI como MUI)
- [ ] Asegurar responsividad del diseño.
- [ ] Mantener consistencia visual con el diseño de referencia (mencionado en `proyecto.md`).

## Testing 🧪
### Pruebas Backend
- [ ] Pruebas unitarias para controladores y modelos (Jest, Mocha)
- [ ] Pruebas de integración para API endpoints (Supertest)
- [ ] Pruebas para funciones de base de datos (si son complejas)

### Pruebas Frontend
- [ ] Pruebas unitarias para componentes (Jest, React Testing Library)
- [ ] Pruebas de integración para flujos de usuario
- [ ] Pruebas E2E (Cypress, Playwright) - opcional pero recomendado

### Pruebas Generales
- [ ] Pruebas de usabilidad
- [ ] Pruebas de rendimiento
- [ ] Pruebas de seguridad (OWASP Top 10, ej. XSS, CSRF, Inyección SQL)

## Despliegue 🚀
- [ ] Script de Build de producción para frontend (`npm run build` en `client/`)
- [ ] Configuración de servidor web (Nginx, Apache) para servir el frontend estático y proxy al backend
- [ ] Configuración de PM2 o similar para gestionar el proceso Node.js en producción
- [ ] Variables de entorno para producción
- [ ] Despliegue Backend en el servidor
- [ ] Despliegue Frontend en el servidor
- [ ] Configuración de HTTPS

## Documentación 📝
- [X] `README.md` (actualizar con setup, estructura, scripts)
- [ ] Documentación de API (Swagger/OpenAPI, o Postman Collection documentada)
- [ ] Manual de usuario (cómo usar el sistema)
- [ ] Guía de instalación y configuración detallada (basada en `migracion_sistema` y refinada)

## Extras y Optimizaciones ⭐
- [ ] Optimización de rendimiento (queries de BD, carga de frontend)
- [ ] SEO (si aplica para partes públicas)
- [ ] Analytics (si se necesita seguimiento de uso)
- [ ] Backups automáticos de la base de datos
- [ ] Mejoras de seguridad post-auditoría
- [ ] Internacionalización (i18n) si se prevé múltiples idiomas 