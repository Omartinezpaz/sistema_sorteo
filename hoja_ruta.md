# Hoja de Ruta del Proyecto: Sistema de Sorteos (Arquitectura de Escritorio con Electron y PostgreSQL Local)

Este documento describe las fases y pasos principales para el desarrollo del Sistema de Sorteos como una aplicación de escritorio Electron con funcionamiento offline y PostgreSQL local.

## Fase 1: Planificación y Configuración Inicial de la App de Escritorio Electron

*   **Semana 1-2**
    *   [ ] **Definición y Consolidación de Requisitos:**
        *   [ ] Revisar `proyecto_nvo.md` (versión app de escritorio con Electron y PostgreSQL local) para alinear la visión.
        *   [X] **Framework de escritorio decidido:** Electron.js.
        *   [ ] **Esquema de BD `initial.sql` (PostgreSQL):** Confirmar que el script está completo y es adecuado para la instancia local de PostgreSQL en cada cliente.
        *   [ ] Detallar historias de usuario para las funcionalidades clave de la app de escritorio.
    *   [ ] **Configuración del Entorno de Desarrollo:**
        *   [ ] Configurar repositorio Git para `app_escritorio/` (o monorepo).
        *   [ ] Establecer guía de estilos de código y linters (ESLint, Prettier).
    *   [ ] **Configuración Técnica Inicial de la App Electron (según `checklist_nvo.md`):**
        *   [ ] Crear estructura de carpetas `app_escritorio/` con `src_main`, `src_renderer`, `public`.
        *   [ ] Inicializar proyecto Node.js en `app_escritorio/` e instalar `electron`, `react`, `react-dom`, `pg`.
        *   [ ] Configurar `package.json` con script de inicio para Electron.
        *   [ ] Crear `main.js` (proceso principal) y `index.html` (para renderer) básicos.
        *   [ ] Establecer la conexión a la instancia local de PostgreSQL desde `src_main/main.js` (o un módulo de base de datos).
        *   [ ] Implementar la lógica para ejecutar `initial.sql` en la BD PostgreSQL local del cliente.

## Fase 2: Desarrollo del Proceso Principal Electron y Lógica de Negocio Local

*   **Semana 3-5**
    *   [ ] **Módulo de Base de Datos Local (PostgreSQL con `pg`) en `src_main`:**
        *   [ ] Implementar funciones CRUD completas para todas las tablas de `initial.sql`.
        *   [ ] Configurar pool de conexiones.
    *   [ ] **Comunicación IPC (`src_main/main.js` y `src_main/preload.js`):**
        *   [ ] Definir y exponer manejadores IPC (`ipcMain.handle`) para todas las operaciones de BD.
        *   [ ] Configurar `preload.js` para exponer las funciones IPC al renderer.
    *   [ ] **Lógica de Negocio Central en `src_main`:**
        *   [ ] Implementar `realizar_sorteo`, `validar_ganador` (consultando PostgreSQL local).
        *   [ ] Lógica para subida/manejo de archivos (logo, fondo de tique).
        *   [ ] Desarrollo de funciones para generar reportes (PDF, CSV) usando librerías Node.js.

## Fase 3: Desarrollo de la Interfaz de Usuario (Proceso Renderer - React)

*   **Semana 6-10**
    *   [ ] **Configuración Inicial del Renderer (`src_renderer`):**
        *   [ ] Estructura de carpetas (`components`, `pages`, `services` que usan IPC, `context`).
        *   [ ] Configuración de React Router (si es necesario para la navegación interna).
        *   [ ] Implementación de Layout principal de la aplicación.
        *   [ ] Definición de tema base o sistema de diseño.
    *   [ ] **Módulo de Autenticación Local (si aplica, contra PostgreSQL local vía IPC):**
        *   [ ] UI para login local.
        *   [ ] Interacción con proceso principal vía IPC para validar.
    *   [ ] **Desarrollo de Componentes y Páginas (UI para funcionalidades CRUD):**
        *   [ ] **Dashboard/Página Principal.**
        *   [ ] **Gestión de Sorteos:**
            *   Formularios para Crear/Editar Sorteo (datos enviados vía IPC).
            *   **Interfaz para Configuración de Diseño de Tiques Impresos:**
                *   Componente de previsualización en tiempo real.
                *   Interacción con IPC para guardar configuración JSON en PostgreSQL y para subida de archivos.
            *   Listado y filtros de Sorteos (datos obtenidos vía IPC).
        *   [ ] **Gestión de Premios, Participantes, Ganadores** (interfaces CRUD que interactúan vía IPC).
        *   [ ] **Visualización de Reportes** (si los datos son preparados por el proceso main).
    *   [ ] **Generación de PDF de Tiques:**
        *   [ ] Invocar vía IPC la función en `src_main` para generar PDF en lote a partir de datos de PostgreSQL.
        *   (Opcional: Previsualización de un tique en el renderer con `jsPDF`).

## Fase 4: Pruebas, Refinamiento y Empaquetado de la App Electron

*   **Semana 11-13**
    *   [ ] **Pruebas exhaustivas de la App Electron:**
        *   [ ] Pruebas unitarias (`src_main` con `pg`, y `src_renderer` con React Testing Library).
        *   [ ] Pruebas de integración IPC.
        *   [ ] Pruebas E2E (Spectron/Playwright).
        *   [ ] Pruebas funcionales y de usabilidad (considerando el requisito de PostgreSQL local en el cliente).
    *   [ ] **Refinamiento:**
        *   [ ] Corrección de bugs.
        *   [ ] Optimización de rendimiento (uso de SQLite, carga de UI, empaquetado).
    *   [ ] **Empaquetado y Distribución con `electron-builder`:**
        *   [ ] Configurar `electron-builder`.
        *   [ ] Generar instaladores para Windows.
        *   [ ] Probar el proceso de instalación (incluyendo dependencia implícita de PostgreSQL en el cliente).

## Fase 5: (OPCIONAL) Desarrollo del Backend Centralizado y Sincronización

*   **Semana (paralela o posterior, si se decide implementar)**
    *   [ ] **Desarrollo del Servidor (`server/` con Node.js/Express/PostgreSQL):**
        *   [ ] Implementar modelos, controladores y rutas API para las entidades principales.
        *   [ ] Implementar autenticación JWT para la API.
    *   [ ] **Lógica de Sincronización:**
        *   [ ] En la app de escritorio (`src_main`): Lógica para detectar cambios locales y enviarlos al servidor.
        *   [ ] En la app de escritorio (`src_main`): Lógica para solicitar y aplicar cambios del servidor.
        *   [ ] En el servidor: Endpoints para manejar la sincronización, resolver conflictos (estrategia básica).
    *   [ ] **Pruebas de Sincronización.**

## Fase 6: Documentación Final y Entrega

*   **Semana 14**
    *   [ ] **Documentación:**
        *   [ ] Finalizar `README.md` (setup de Electron, build, y **guía/requisito de instalación de PostgreSQL para el usuario final**).
        *   [ ] Manual de usuario de la aplicación de escritorio (incluyendo cómo asegurarse de que PostgreSQL local esté corriendo).
        *   [ ] (Opcional) Documentación de API del backend central.

**Nota:** Esta hoja de ruta prioriza la funcionalidad offline en la aplicación Electron con PostgreSQL local. La sincronización y el backend central son opcionales. 