#!/usr/bin/env bash
#
# Script para verificar la preparación del sistema para realizar sorteos
# Para usar en Linux y macOS

# Colores para la terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m' # Sin color

echo -e "${CYAN}======================================================${NC}"
echo -e "${YELLOW}     SISTEMA DE SORTEOS PUEBLO VALIENTE${NC}"
echo -e "${YELLOW}     Verificación Previa al Sorteo${NC}"
echo -e "${CYAN}======================================================${NC}"
echo ""

# Verificar la existencia de Node.js
if command -v node &> /dev/null; then
    node_version=$(node --version)
    # echo -e "${GREEN}Node.js detectado: $node_version${NC}"
else
    echo -e "${RED}❌ ERROR: Node.js no está instalado o no está en el PATH${NC}"
    echo -e "${RED}Por favor, instale Node.js desde https://nodejs.org/${NC}"
    exit 1
fi

# Verificar si PostgreSQL está instalado
if ! command -v psql &> /dev/null; then
    echo "⚠️ ADVERTENCIA: PostgreSQL CLI (psql) no está en el PATH"
    echo "Esto no significa necesariamente que PostgreSQL no esté instalado,"
    echo "pero el sistema no puede verificar su disponibilidad directamente."
fi

echo "📋 Verificando dependencias..."
# Instalar dependencias si es necesario
if [ ! -d "node_modules" ]; then
    echo "Instalando dependencias..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ ERROR: No se pudieron instalar las dependencias"
        exit 1
    fi
fi

echo "🔍 Ejecutando verificaciones previas al sorteo..."
# Ejecutar el script de verificación
node app_escritorio/src_main/utils/run-checks.js

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Todas las verificaciones se completaron con éxito.${NC}"
    echo "   El sistema está listo para realizar sorteos."
elif [ $EXIT_CODE -eq 1 ]; then
    echo ""
    echo -e "${YELLOW}⚠️ Se encontraron advertencias durante las verificaciones.${NC}"
    echo "   Revise el informe para más detalles."
else
    echo ""
    echo -e "${RED}❌ Se encontraron errores críticos durante las verificaciones.${NC}"
    echo "   Por favor, resuelva los problemas antes de realizar un sorteo."
fi

echo ""
echo -e "${CYAN}Para más detalles, consulte el archivo de log generado.${NC}"
echo -e "${CYAN}======================================================${NC}"

exit $EXIT_CODE 