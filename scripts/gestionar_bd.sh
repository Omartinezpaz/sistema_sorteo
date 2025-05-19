#!/usr/bin/env bash
#
# Script de gestión de base de datos para Sorteo Pueblo Valiente
# Este script facilita la ejecución de los diferentes scripts SQL

# Colores para la terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # Sin color

# Configuración
DB_NAME="sorteo_db"
SCRIPTS_DIR="$(dirname "$(readlink -f "$0")")"

# Función para imprimir encabezado
print_header() {
  echo -e "${CYAN}=====================================================${NC}"
  echo -e "${YELLOW}     SISTEMA DE SORTEOS PUEBLO VALIENTE${NC}"
  echo -e "${YELLOW}     Herramienta de Gestión de Base de Datos${NC}"
  echo -e "${CYAN}=====================================================${NC}"
  echo ""
}

# Verificar si PostgreSQL está instalado
check_psql() {
  if ! command -v psql &> /dev/null; then
    echo -e "${RED}ERROR: PostgreSQL no está instalado o no está en el PATH${NC}"
    echo "Por favor, instale PostgreSQL y asegúrese de que 'psql' esté disponible"
    echo "En Ubuntu/Debian: sudo apt install postgresql postgresql-client"
    echo "En macOS: brew install postgresql"
    exit 1
  fi
}

# Solicitar credenciales
get_credentials() {
  read -p "Ingrese nombre de usuario de PostgreSQL: " DB_USER
  read -sp "Ingrese contraseña: " DB_PASSWORD
  echo ""
  export PGPASSWORD="$DB_PASSWORD"
}

# Verificar conexión a base de datos
verify_connection() {
  echo "Verificando conexión a PostgreSQL..."
  if ! psql -U "$DB_USER" -d postgres -c "SELECT version();" &> /dev/null; then
    echo -e "${RED}ERROR: No se pudo conectar a PostgreSQL.${NC}"
    echo "Verifique sus credenciales y que el servidor esté en ejecución."
    return 1
  else
    echo -e "${GREEN}Conexión exitosa a PostgreSQL.${NC}"
    
    # Verificar si la base de datos existe
    if ! psql -U "$DB_USER" -d postgres -c "SELECT datname FROM pg_database WHERE datname='$DB_NAME';" | grep -q "$DB_NAME"; then
      echo ""
      echo "La base de datos '$DB_NAME' no existe."
      read -p "¿Desea crearla ahora? (s/n): " CREATE_DB
      if [[ "$CREATE_DB" =~ ^[Ss]$ ]]; then
        echo "Creando base de datos '$DB_NAME'..."
        if ! psql -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;" &> /dev/null; then
          echo -e "${RED}ERROR: No se pudo crear la base de datos.${NC}"
        else
          echo -e "${GREEN}Base de datos '$DB_NAME' creada exitosamente.${NC}"
        fi
      fi
    else
      echo "Base de datos '$DB_NAME' encontrada."
    fi
    return 0
  fi
}

# Adecuar estructura de base de datos
adapt_structure() {
  echo "Adecuando estructura de base de datos..."
  if ! psql -U "$DB_USER" -d "$DB_NAME" -f "${SCRIPTS_DIR}/adecuar_bd_pgadmin.sql"; then
    echo -e "${RED}ERROR: No se pudo ejecutar el script de adecuación.${NC}"
  else
    echo -e "${GREEN}Estructura de base de datos actualizada correctamente.${NC}"
  fi
}

# Cargar datos de prueba
load_test_data() {
  echo -e "${YELLOW}ADVERTENCIA: Esta acción puede sobrescribir datos existentes.${NC}"
  read -p "¿Está seguro de que desea cargar datos de prueba? (s/n): " CONFIRM
  if [[ ! "$CONFIRM" =~ ^[Ss]$ ]]; then
    return
  fi

  echo "Cargando datos de prueba..."
  if ! psql -U "$DB_USER" -d "$DB_NAME" -f "${SCRIPTS_DIR}/cargar_datos_prueba.sql"; then
    echo -e "${RED}ERROR: No se pudieron cargar los datos de prueba.${NC}"
  else
    echo -e "${GREEN}Datos de prueba cargados correctamente.${NC}"
  fi
}

# Generar respaldo de base de datos
generate_backup() {
  echo "Generando vistas de respaldo..."
  if ! psql -U "$DB_USER" -d "$DB_NAME" -f "${SCRIPTS_DIR}/respaldar_bd.sql"; then
    echo -e "${RED}ERROR: No se pudo ejecutar el script de respaldo.${NC}"
  else
    echo -e "${GREEN}Vistas de respaldo generadas correctamente.${NC}"
    echo ""
    
    # Generar nombre de archivo con timestamp
    TIMESTAMP=$(date "+%Y%m%d_%H%M%S")
    BACKUP_FILE="$(pwd)/respaldo_sorteo_${TIMESTAMP}.sql"
    
    read -p "¿Desea generar un archivo de respaldo completo ahora? (s/n): " FULL_BACKUP
    if [[ "$FULL_BACKUP" =~ ^[Ss]$ ]]; then
      echo "Generando respaldo completo..."
      if ! pg_dump -U "$DB_USER" -d "$DB_NAME" -F p --column-inserts --inserts > "$BACKUP_FILE"; then
        echo -e "${RED}ERROR: No se pudo generar el archivo de respaldo.${NC}"
      else
        echo -e "${GREEN}Respaldo guardado en: $BACKUP_FILE${NC}"
      fi
    fi
  fi
}

# Verificar tablas existentes
verify_tables() {
  echo "Verificando tablas existentes en la base de datos..."
  psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT table_name, table_type FROM information_schema.tables WHERE table_schema='public' ORDER BY table_type, table_name;"
}

# Menú principal
main_menu() {
  while true; do
    clear
    print_header
    echo "Opciones disponibles:"
    echo ""
    echo "1. Verificar conexión a base de datos"
    echo "2. Adecuar estructura de base de datos"
    echo "3. Cargar datos de prueba"
    echo "4. Generar respaldo de base de datos"
    echo "5. Verificar tablas existentes"
    echo "6. Salir"
    echo ""
    read -p "Seleccione una opción (1-6): " OPTION
    echo ""
    
    case $OPTION in
      1)
        verify_connection
        ;;
      2)
        adapt_structure
        ;;
      3)
        load_test_data
        ;;
      4)
        generate_backup
        ;;
      5)
        verify_tables
        ;;
      6)
        echo "Gracias por utilizar la herramienta de gestión de base de datos."
        echo "Saliendo..."
        exit 0
        ;;
      *)
        echo -e "${RED}Opción no válida. Por favor, intente de nuevo.${NC}"
        ;;
    esac
    
    echo ""
    read -p "Presione Enter para continuar..."
  done
}

# Inicio del script
check_psql
print_header
get_credentials
main_menu 