# Sistema de Sorteos Pueblo Valiente

Sistema integral para la gestión de sorteos, desarrollado como una aplicación de escritorio que permite configurar sorteos, administrar premios, gestionar participantes, realizar sorteos y visualizar resultados.

## Características Principales

- **Gestión de Sorteos:** Creación, configuración y administración de sorteos.
- **Gestión de Premios:** Configuración de premios nacionales y regionales.
- **Distribución de Tiques:** Generación y distribución de tiques por estado/región.
- **Realización de Sorteos:** Ejecución de sorteos con diferentes algoritmos.
- **Visualización de Resultados:** Consulta de ganadores y reportes.
- **Funcionamiento Offline:** Capacidad para funcionar sin conexión a internet.

## Requisitos del Sistema

- Node.js (v14.x o superior)
- PostgreSQL (v12.x o superior)
- Electron (v23.x o superior)

## Estructura de la Aplicación

La aplicación está estructurada de la siguiente manera:

```
sorteo_pueblo_valiente/
├── app_escritorio/             # Aplicación de escritorio (Electron con React)
│   ├── public/                 # Archivos estáticos
│   ├── src_renderer/          # Código del proceso renderer (React, UI)
│   │   ├── api/               # Lógica de interacción con el proceso principal y BD local
│   │   ├── assets/            # Recursos estáticos (imágenes, fuentes, CSS)
│   │   ├── components/        # Componentes React
│   │   │   ├── auth/          # Componentes de autenticación
│   │   │   ├── dashboard/     # Componentes del dashboard
│   │   │   ├── sorteo/        # Componentes para la gestión de sorteos
│   │   │   ├── shared/        # Componentes compartidos
│   │   ├── pages/             # Páginas principales
│   │   ├── App.jsx            # Componente principal
│   │   └── index.jsx          # Punto de entrada
│   ├── src_main/             # Código del proceso principal (Electron)
│   │   ├── database/         # Configuración y acceso a BD local
│   │   └── main.js           # Punto de entrada del proceso principal
│   ├── package.json
└── scripts/                   # Scripts utilitarios (SQL, etc.)
```

## Requisitos de Base de Datos

La aplicación requiere una base de datos PostgreSQL con la siguiente estructura:

- **sorteos**: Almacena la información principal de los sorteos
- **premios**: Almacena los premios asociados a cada sorteo
- **participantes**: Registro de participantes en cada sorteo
- **ganadores**: Registro de ganadores de los sorteos
- **usuarios**: Usuarios del sistema

## Módulos Implementados

### Autenticación
- Login de usuarios
- Gestión de sesiones

### Dashboard
- Estadísticas generales
- Resumen de sorteos activos y recientes

### Gestión de Sorteos
- Listado de sorteos con filtrado
- Creación de sorteos mediante un proceso de pasos:
  1. **Información Básica**: Nombre, descripción, fecha, tipo (nacional/regional/mixto)
  2. **Configuración de Tickets**: Formato de numeración, rangos por estado, prefijos
  3. **Gestión de Premios**: Premios nacionales y regionales, con categorías
  4. **Método de Selección**: Configuración del algoritmo y reglas de sorteo
  5. **Revisión y Confirmación**: Resumen de toda la configuración

### Acciones sobre Sorteos
- Visualización de detalles
- Edición (solo en estado borrador)
- Duplicación
- Cancelación
- Eliminación (solo en estado borrador)

## Instalación

1. Clonar el repositorio:
   ```
   git clone https://github.com/Omartinezpaz/sistema_sorteo.git
   cd sistema_sorteo
   ```

2. Instalar dependencias:
   ```
   cd app_escritorio
   npm install
   ```

3. Configurar la base de datos PostgreSQL:
   - Crear una base de datos para el sistema
   - Ejecutar los scripts de migración en `app_escritorio/src_main/database/migrations/`

4. Iniciar la aplicación en modo desarrollo:
   ```
   npm run dev
   ```

5. Generar la aplicación para producción:
   ```
   npm run build
   ```

## Estructura del Proyecto

- `app_escritorio/`: Aplicación de escritorio Electron/React
  - `src_main/`: Código del proceso principal de Electron
  - `src_renderer/`: Código de la interfaz de usuario React
  - `database/`: Scripts y migraciones de la base de datos
  - `public/`: Archivos estáticos

## Licencia

Todos los derechos reservados.

## Contacto

Para más información o soporte, contactar a: omar.mtzpaz@gmail.com 