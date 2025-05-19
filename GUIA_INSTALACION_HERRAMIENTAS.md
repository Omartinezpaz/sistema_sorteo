# Guía de Instalación de Herramientas de Desarrollo

Esta guía describe cómo instalar las herramientas esenciales para desarrollar el Sistema de Sorteos. Se asume que estás trabajando en un entorno Windows, como se indica en la información de tu sistema.

## 1. Node.js y npm (Node Package Manager)

*   **Propósito:**
    *   `Node.js`: Es el entorno de ejecución para el backend de tu aplicación (escrito en JavaScript/Express.js).
    *   `npm`: Es el gestor de paquetes de Node.js. Se utiliza para instalar y gestionar las dependencias (librerías y herramientas) de tu proyecto, tanto para el backend como para el frontend.
*   **Descarga:**
    *   Ve a [https://nodejs.org/](https://nodejs.org/)
    *   Descarga la versión **LTS** (Long Term Support). Es la más estable y recomendada para la mayoría de los usuarios.
*   **Instalación (Windows):**
    1.  Ejecuta el instalador `.msi` que descargaste.
    2.  Sigue las instrucciones del asistente de instalación.
    3.  **Importante:** Asegúrate de que la opción para añadir Node.js y npm al `PATH` del sistema esté seleccionada. Esto suele estar marcado por defecto ("Add to PATH"). Es crucial para poder ejecutar los comandos `node` y `npm` desde cualquier directorio en tu terminal.
    4.  **Ruta de Instalación:** La ruta por defecto (generalmente `C:\Program Files\nodejs\`) es adecuada. No necesitas cambiarla a menos que tengas una razón específica.
*   **Verificación:**
    1.  Abre una **nueva** ventana de PowerShell o Símbolo del sistema (CMD) *después* de completar la instalación.
    2.  Ejecuta el comando: `node -v`
        *   Deberías ver la versión de Node.js instalada (ej: `v18.17.0`).
    3.  Ejecuta el comando: `npm -v`
        *   Deberías ver la versión de npm instalada (ej: `9.6.7`).

## 2. PostgreSQL (Servidor de Base de Datos)

*   **Propósito:** Es el sistema de gestión de base de datos relacional donde se almacenarán todos los datos de tu aplicación (usuarios, sorteos, premios, participantes, configuraciones de tiques, etc.).
*   **Descarga:**
    *   Ve a [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/).
    *   El sitio te dirigirá al instalador proporcionado por EnterpriseDB (EDB), que es el recomendado para Windows.
*   **Instalación (Windows):**
    1.  Descarga y ejecuta el instalador.
    2.  Durante la instalación:
        *   **Componentes a instalar:** Deja seleccionados los componentes por defecto, que usualmente incluyen:
            *   `PostgreSQL Server`
            *   `pgAdmin` (herramienta gráfica de administración)
            *   `Stack Builder` (opcional, puedes desmarcarlo si no planeas instalar extensiones adicionales inmediatamente)
            *   `Command Line Tools` (incluye `psql`, la interfaz de línea de comandos)
        *   **Directorio de Instalación:** La ruta por defecto (ej. `C:\Program Files\PostgreSQL\15\`) está bien.
        *   **Directorio de Datos:** Elige dónde se guardarán los datos de tus bases de datos (ej. `C:\Program Files\PostgreSQL\15\data\`).
        *   **Contraseña:** Se te pedirá establecer una contraseña para el superusuario de la base de datos (el usuario por defecto es `postgres`). **Esta contraseña es muy importante.** Guárdala de forma segura. La necesitarás para conectar tu aplicación a la base de datos y para administrarla con pgAdmin. (Anteriormente se mencionó `Ap3r1t1v02025`; asegúrate de usar la que establezcas aquí).
        *   **Puerto:** El puerto por defecto es `5432`. Mantenlo a menos que tengas otro servicio usando ese puerto.
        *   **Locale:** Puedes seleccionar el "Default locale" o uno específico si lo prefieres.
    3.  Completa la instalación.
*   **Verificación:**
    1.  Busca "pgAdmin" en tu menú de inicio y ejecútalo.
    2.  Al abrirse, te pedirá la contraseña del superusuario (`postgres`) que estableciste durante la instalación para acceder al servidor local.
    3.  Una vez conectado, puedes usar pgAdmin para crear tu base de datos (por ejemplo, `sorteo_db`).
    4.  Alternativamente, puedes abrir "SQL Shell (psql)", conectarte al servidor y crear la base de datos mediante comandos SQL.

## 3. Git (Sistema de Control de Versiones)

*   **Propósito:** Git es esencial para el control de versiones de tu código. Te permite guardar un historial de cambios, revertir a versiones anteriores, trabajar en diferentes funcionalidades en paralelo (ramas) y colaborar con otros desarrolladores (si aplica).
*   **Descarga:**
    *   Ve a [https://git-scm.com/download/win](https://git-scm.com/download/win).
*   **Instalación (Windows):**
    1.  Ejecuta el instalador descargado.
    2.  Durante la instalación, puedes aceptar la mayoría de las opciones por defecto. Presta atención a:
        *   **Choosing the default editor used by Git:** Puedes seleccionar VS Code si ya lo tienes instalado, o dejar Vim (puedes cambiarlo después).
        *   **Adjusting your PATH environment:** Se recomienda la opción "Git from the command line and also from 3rd-party software". Esto asegura que puedas usar comandos `git` desde PowerShell o CMD.
    3.  **Ruta de Instalación:** La ruta por defecto (generalmente `C:\Program Files\Git\`) es adecuada.
*   **Verificación:**
    1.  Abre una **nueva** ventana de PowerShell o CMD.
    2.  Ejecuta el comando: `git --version`
        *   Deberías ver la versión de Git instalada (ej: `git version 2.41.0.windows.1`).

## 4. Editor de Código (Recomendado: Visual Studio Code)

*   **Propósito:** Es la herramienta donde escribirás y editarás todo el código de tu proyecto (JavaScript, HTML, CSS, SQL, Markdown, etc.).
*   **Descarga (VS Code):**
    *   Ve a [https://code.visualstudio.com/](https://code.visualstudio.com/).
*   **Instalación (Windows):**
    1.  Ejecuta el instalador.
    2.  Acepta el acuerdo de licencia y sigue las instrucciones.
    3.  **Opciones recomendadas durante la instalación:**
        *   "Add 'Open with Code' action to Windows Explorer file context menu"
        *   "Add 'Open with Code' action to Windows Explorer directory context menu"
        *   "Register Code as an editor for supported file types"
        *   **"Add to PATH"** (muy importante para poder lanzar VS Code desde la terminal con el comando `code .`).
    4.  **Ruta de Instalación:** La ruta por defecto (generalmente en `C:\Users\<TuUsuario>\AppData\Local\Programs\Microsoft VS Code\`) está bien.
*   **Extensiones Útiles para VS Code en este Proyecto:**
    *   `ESLint` (para análisis estático de código JavaScript y JSX).
    *   `Prettier - Code formatter` (para formateo automático de código).
    *   `DotENV` (para resaltar la sintaxis de archivos `.env`).
    *   `PostgreSQL` (por Chris Kolkman o similar, para interactuar con tu base de datos PostgreSQL directamente desde VS Code).
    *   `Live Server` (para previsualizar páginas HTML estáticas, útil para el frontend inicialmente).
    *   `Material Icon Theme` o similar (para iconos de archivos y carpetas).

## 5. Navegador Web Moderno

*   **Propósito:** Necesario para visualizar y depurar la interfaz de usuario (frontend) de tu aplicación.
*   **Opciones:** Google Chrome, Mozilla Firefox, Microsoft Edge (basado en Chromium).
*   **Instalación:** Usualmente ya vienen instalados o se pueden descargar fácilmente desde sus sitios web oficiales. Asegúrate de tener la versión más reciente.
*   **Herramientas de Desarrollador:** Todos estos navegadores incluyen potentes herramientas de desarrollador (accesibles generalmente presionando `F12`) que son cruciales para el desarrollo frontend (inspeccionar elementos, depurar JavaScript, analizar el rendimiento de la red, etc.).

---

**Nota General sobre Rutas de Instalación y el PATH:**

Para la mayoría de estas herramientas, aceptar la ruta de instalación por defecto es seguro y recomendable. Lo más importante es que durante la instalación te asegures de que la opción para **añadir la herramienta al PATH del sistema** esté seleccionada. Esto permite que los comandos ejecutables de cada herramienta (como `node`, `npm`, `psql`, `git`, `code`) puedan ser invocados desde cualquier directorio en tu terminal sin necesidad de especificar su ruta completa. Si un comando no es reconocido después de la instalación (en una nueva terminal), el problema más común es que la herramienta no se añadió correctamente al PATH. 