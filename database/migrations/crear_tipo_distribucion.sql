-- Crear tipo personalizado para la distribución de tickets
CREATE TYPE tipo_distribucion AS (
    cod_estado INTEGER,
    nom_estado TEXT,
    cod_municipio INTEGER,
    nom_municipio TEXT,
    cod_parroquia INTEGER,
    nom_parroquia TEXT,
    poblacion INTEGER,
    porcentaje NUMERIC,
    tickets_asignados INTEGER
); 