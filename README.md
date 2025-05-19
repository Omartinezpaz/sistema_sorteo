# Sistema de Sorteos Pueblo Valiente

Aplicación de escritorio para la gestión integral de sorteos, desarrollada con Electron/React y PostgreSQL.

## Requisitos

- Node.js (v14.0 o superior)
- PostgreSQL (v12.0 o superior)
- NPM (v6.0 o superior)

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
git clone https://github.com/tu-usuario/sorteo_pueblo_valiente.git
cd sorteo_pueblo_valiente
```

2. Instalar dependencias:
```
cd app_escritorio
npm install
```

3. Configurar la base de datos:
   - Crear una base de datos PostgreSQL
   - Ejecutar el script SQL en `scripts/base_datos.sql`
   - Configurar las credenciales en `app_escritorio/.env`

## Ejecución

```
cd app_escritorio
npm start
```

## Desarrollo

Para desarrollo con recarga en caliente:
```
npm run dev
```

## Construcción de Distribución

Para generar un ejecutable:
```
npm run make
```
Los archivos distribuibles estarán disponibles en la carpeta `out/`. 