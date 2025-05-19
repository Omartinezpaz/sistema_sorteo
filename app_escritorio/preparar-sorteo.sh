#!/bin/bash

# Colores para terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo "====================================================="
echo "    SISTEMA DE SORTEOS - VERIFICACION PREVIA"
echo "====================================================="
echo ""
echo "Iniciando verificacion del sistema..."
echo ""

# Comprobar que Node.js está instalado
if ! command -v node &> /dev/null; then
    echo -e "${RED}[ERROR] Node.js no esta instalado o no se encuentra en el PATH.${NC}"
    echo "         Por favor, instale Node.js desde https://nodejs.org/"
    echo "         o use su gestor de paquetes:"
    echo "         - Ubuntu/Debian: sudo apt install nodejs npm"
    echo "         - MacOS: brew install node"
    echo ""
    exit 1
fi

# Verificar que PostgreSQL está en ejecución
echo "Verificando conexion con PostgreSQL..."
if command -v pg_isready &> /dev/null; then
    if ! pg_isready -h localhost -p 5432 &> /dev/null; then
        echo -e "${YELLOW}[ADVERTENCIA] PostgreSQL no parece estar en ejecucion.${NC}"
        echo "               Es posible que necesite iniciar el servicio de PostgreSQL:"
        echo "               - Linux: sudo systemctl start postgresql"
        echo "               - MacOS: brew services start postgresql"
        echo ""
        read -p "¿Desea continuar de todos modos? (s/N): " respuesta
        if [[ ! "$respuesta" =~ ^[Ss]$ ]]; then
            exit 1
        fi
        echo ""
    else
        echo -e "${GREEN}[OK] PostgreSQL esta activo.${NC}"
        echo ""
    fi
else
    echo -e "${YELLOW}[ADVERTENCIA] No se puede verificar el estado de PostgreSQL (pg_isready no disponible).${NC}"
    echo "               Asegúrese de que PostgreSQL esté en ejecución antes de continuar."
    echo ""
fi

# Ejecutar el script de verificación
echo "Ejecutando verificacion completa del sistema..."
echo ""
node verificar-preparacion.js
VERIFICACION_RESULT=$?

if [ $VERIFICACION_RESULT -ne 0 ]; then
    echo ""
    echo -e "${YELLOW}[ADVERTENCIA] La verificacion encontro problemas.${NC}"
    echo "               Consulte los mensajes anteriores para obtener mas detalles."
    echo ""
    echo "Revise los siguientes puntos:"
    echo "1. PostgreSQL esta en ejecucion y es accesible"
    echo "2. Los datos de conexion son correctos (usuario/contraseña)"
    echo "3. La base de datos 'sorteo_db' existe"
    echo "4. Hay suficiente espacio en disco"
    echo ""
else
    echo ""
    echo -e "${GREEN}[EXITO] La verificacion previa se completo correctamente.${NC}"
    echo "         El sistema esta listo para realizar sorteos."
    echo ""
fi

echo ""
echo "====================================================="
read -p "Presione Enter para continuar..." 