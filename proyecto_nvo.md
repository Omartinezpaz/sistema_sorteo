# Proyecto: Sistema de Sorteos

## 1. Descripción General

El proyecto consiste en el desarrollo de un sistema integral para la gestión de sorteos. La plataforma permitirá configurar sorteos, administrar premios, gestionar participantes, realizar los sorteos de forma automatizada o manual, y visualizar los resultados y ganadores.

Basado en el análisis de la interfaz de usuario previa, el sistema contará con las siguientes funcionalidades principales desde la perspectiva del usuario:

*   **Página Principal/Dashboard:** Interfaz inicial con acceso a las principales funcionalidades como configurar sorteos o ver el historial.
*   **Configuración de Sorteo:**
    *   Asignación de cantidad de tiques (tickets) por estado/región.
    *   Establecimiento de rangos y porcentajes de distribución.
    *   Configuración de la fecha y hora del sorteo.
*   **Configuración de Premios:**
    *   Definición de diferentes tipos de premios (ej. Nacional, Por Estado, etc.).
    *   Establecimiento de la cantidad de premios por categoría (ej. primer, segundo, tercer lugar).
    *   Asociación de imágenes y descripciones a los premios.
*   **Gestión de Sorteos:**
    *   Visualización del estado de los sorteos (pendiente, activo, en progreso, finalizado, cancelado).
    *   Control para iniciar un sorteo, con posible cuenta regresiva.
*   **Visualización de Resultados:**
    *   Presentación de premios distribuidos por estados/regiones.
    *   Tablas de ganadores organizadas por premio, mostrando detalles relevantes (código, estado, número ganador, etc.).
*   **Pantalla Final/Notificaciones:** Mensajes de felicitación a los ganadores e información relevante.
*   **Gestión de Usuarios y Autenticación:** Roles para administradores y operadores, con funcionalidades protegidas.
*   **Gestión de Participantes:** Registro, actualización, validación e importación de participantes.
*   **Reportes:** Generación de reportes en formatos como Excel, CSV, PDF.
*   **Configuración de Diseño de Tiques Impresos:** Permitir al usuario personalizar el diseño de los tiques que se imprimirán para las rifas, incluyendo la selección de numeraciones, возможно, la adición de logos o textos específicos.

## 2. Arquitectura del Proyecto

La arquitectura propuesta se basa en una **aplicación de escritorio para el cliente (para funcionamiento offline en equipos sencillos)** y un posible backend para funciones centralizadas o de sincronización (opcional, dependiendo de la necesidad de consolidación de datos). La aplicación cliente utilizará una base de datos local.

### 2.1. Estructura de Carpetas General (Ajustada para Aplicación de Escritorio)

```
sorteo_pueblo_valiente/
├── app_escritorio/               # Aplicación de escritorio (Electron/Tauri con React)
│   ├── public/                   # Archivos estáticos (index.html para el renderer)
│   ├── src_renderer/             # Código del proceso renderer (React, UI)
│   │   ├── api/                  # Lógica de interacción con el proceso principal y BD local
│   │   ├── assets/               # Recursos estáticos (imágenes, fuentes)
│   │   ├── components/           # Componentes React
│   │   │   ├── auth/             # (Si hay login local)
│   │   │   ├── sorteo/
│   │   │   ├── dashboard/
│   │   │   ├── shared/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/             # Servicios (interacción con BD local)
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── index.jsx
│   ├── src_main/                 # Código del proceso principal (Electron/Tauri)
│   │   ├── database/             # Configuración y acceso a BD local (SQLite)
│   │   ├── utils/
│   │   └── main.js               # Punto de entrada del proceso principal
│   ├── package.json              # Dependencias y scripts de la app de escritorio
│
├── server/                       # Backend (Node.js, Express) - OPCIONAL
│   │                             # (Para sincronización, API central, administración web)
│   ├── config/
│   ├── controllers/
│   ├── database/                 # (Si usa una BD central diferente, ej. PostgreSQL)
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   └── server.js
│
├── docs/                         # Documentación del proyecto
├── scripts/                      # Scripts de utilidad (ej. build de app escritorio)
├── .env                          # (Podría ser específico para el server o la app)
├── package.json                  # (Nivel raíz, podría gestionar ambos o solo el server)
└── README.md                     # Información general del proyecto
```

### 2.2. Tecnologías Principales (Ajustadas)

*   **Aplicación de Escritorio (Cliente):**
    *   Framework: **Electron.js** o **Tauri**
    *   UI: **React**
    *   Base de Datos Local: **PostgreSQL** (requiere instancia local en el equipo cliente)
*   **Backend (Opcional - para sincronización/API central):** Node.js, Express.js
*   **Base de Datos Central (Opcional - si hay backend):** PostgreSQL
*   **Autenticación:**
    *   Local: Puede ser simple o no existir si es un solo usuario por equipo.
    *   Centralizada (si hay backend con sincro): JWT
*   **Gestión de Dependencias:** npm o yarn

## 3. API Endpoints

La definición de API Endpoints se vuelve más compleja.

*   **Interacción Proceso Principal <-> Proceso Renderer (App de Escritorio):**
    *   Se usarán mecanismos de IPC (Inter-Process Communication) de Electron/Tauri en lugar de HTTP API para la mayoría de las operaciones. Por ejemplo, el renderer pedirá al proceso principal que acceda a la base de datos SQLite.
*   **API HTTP (Si existe el `server/` opcional):**
    *   Los endpoints listados previamente (Autenticación, Sorteos, etc.) aplicarían si se implementa el servidor central para sincronización o una interfaz de administración web. La aplicación de escritorio actuaría como un cliente de esta API cuando esté online.

## 4. Base de Datos

*   **Base de Datos Local Principal:** Se utilizará **PostgreSQL** para la aplicación de escritorio, requiriendo una instancia de PostgreSQL Server instalada y corriendo localmente en cada equipo cliente. El script `database/migrations/initial.sql` (ya escrito para PostgreSQL) se aplicará a esta base de datos local. Incluirá tablas para usuarios, sorteos, premios, participantes, ganadores, categorías, ubicaciones, registro de actividades y configuraciones de diseño de tiques.
*   **Base de Datos Central (Opcional):** Si se implementa el `server/` para sincronización, podría usar otra instancia de PostgreSQL (posiblemente remota) como se definió antes. La lógica de sincronización entre la instancia local de PostgreSQL y la central deberá ser diseñada.

**Nota:** El requisito de funcionamiento offline y en equipos sencillos se logrará utilizando una instancia local de PostgreSQL en cada cliente. Esto implica que el cliente deberá tener PostgreSQL Server instalado. El backend centralizado se convierte en un componente secundario o de soporte. 