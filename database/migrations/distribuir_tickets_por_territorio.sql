-- Función para distribuir tickets proporcionalmente según territorio (estado, municipio o parroquia)
CREATE OR REPLACE FUNCTION distribuir_tickets_por_territorio(
  p_total_tickets INTEGER,
  p_nivel_detalle TEXT,
  p_territorio_ids INTEGER[],
  OUT cod_estado INTEGER,
  OUT nom_estado TEXT,
  OUT cod_municipio INTEGER,
  OUT nom_municipio TEXT,
  OUT cod_parroquia INTEGER,
  OUT nom_parroquia TEXT,
  OUT poblacion INTEGER,
  OUT porcentaje NUMERIC,
  OUT tickets_asignados INTEGER
)
RETURNS SETOF RECORD AS $$
DECLARE
  v_total_poblacion INTEGER := 0;
  v_tickets_asignados INTEGER := 0;
  v_tickets_restantes INTEGER := 0;
  v_territorio RECORD;
  v_territorio_mayor_poblacion RECORD;
  v_max_poblacion INTEGER := 0;
BEGIN
  -- Calcular la población total de los territorios seleccionados
  IF p_nivel_detalle = 'estado' THEN
    SELECT SUM(poblacion) INTO v_total_poblacion
    FROM estados
    WHERE cod_estado = ANY(p_territorio_ids);
  ELSIF p_nivel_detalle = 'municipio' THEN
    SELECT SUM(m.poblacion) INTO v_total_poblacion
    FROM municipios m
    WHERE m.cod_municipio = ANY(p_territorio_ids);
  ELSIF p_nivel_detalle = 'parroquia' THEN
    SELECT SUM(p.poblacion) INTO v_total_poblacion
    FROM parroquias p
    WHERE p.cod_parroquia = ANY(p_territorio_ids);
  END IF;
  
  -- Si no hay población o es cero, distribuir equitativamente
  IF v_total_poblacion IS NULL OR v_total_poblacion = 0 THEN
    v_total_poblacion := array_length(p_territorio_ids, 1);
    
    -- Distribuir tickets equitativamente
    IF p_nivel_detalle = 'estado' THEN
      FOR v_territorio IN 
        SELECT e.cod_estado, e.nom_estado, NULL::INTEGER AS cod_municipio, 
               NULL::TEXT AS nom_municipio, NULL::INTEGER AS cod_parroquia, 
               NULL::TEXT AS nom_parroquia, e.poblacion
        FROM estados e
        WHERE e.cod_estado = ANY(p_territorio_ids)
        ORDER BY e.nom_estado
      LOOP
        -- Guardar el territorio con mayor población
        IF v_territorio.poblacion > v_max_poblacion THEN
          v_max_poblacion := v_territorio.poblacion;
          v_territorio_mayor_poblacion := v_territorio;
        END IF;
        
        -- Calcular tickets asignados y asignarlos a la variable OUT
        cod_estado := v_territorio.cod_estado;
        nom_estado := v_territorio.nom_estado;
        cod_municipio := v_territorio.cod_municipio;
        nom_municipio := v_territorio.nom_municipio;
        cod_parroquia := v_territorio.cod_parroquia;
        nom_parroquia := v_territorio.nom_parroquia;
        poblacion := v_territorio.poblacion;
        porcentaje := 1.0 / v_total_poblacion;
        tickets_asignados := floor(p_total_tickets / v_total_poblacion);
        v_tickets_asignados := v_tickets_asignados + tickets_asignados;
        
        RETURN NEXT;
      END LOOP;
    ELSIF p_nivel_detalle = 'municipio' THEN
      FOR v_territorio IN 
        SELECT e.cod_estado, e.nom_estado, m.cod_municipio, m.nom_municipio, 
               NULL::INTEGER AS cod_parroquia, NULL::TEXT AS nom_parroquia, m.poblacion
        FROM municipios m
        JOIN estados e ON e.cod_estado = m.cod_estado
        WHERE m.cod_municipio = ANY(p_territorio_ids)
        ORDER BY e.nom_estado, m.nom_municipio
      LOOP
        -- Guardar el territorio con mayor población
        IF v_territorio.poblacion > v_max_poblacion THEN
          v_max_poblacion := v_territorio.poblacion;
          v_territorio_mayor_poblacion := v_territorio;
        END IF;
        
        -- Calcular tickets asignados y asignarlos a la variable OUT
        cod_estado := v_territorio.cod_estado;
        nom_estado := v_territorio.nom_estado;
        cod_municipio := v_territorio.cod_municipio;
        nom_municipio := v_territorio.nom_municipio;
        cod_parroquia := v_territorio.cod_parroquia;
        nom_parroquia := v_territorio.nom_parroquia;
        poblacion := v_territorio.poblacion;
        porcentaje := 1.0 / v_total_poblacion;
        tickets_asignados := floor(p_total_tickets / v_total_poblacion);
        v_tickets_asignados := v_tickets_asignados + tickets_asignados;
        
        RETURN NEXT;
      END LOOP;
    ELSIF p_nivel_detalle = 'parroquia' THEN
      FOR v_territorio IN 
        SELECT e.cod_estado, e.nom_estado, m.cod_municipio, m.nom_municipio, 
               p.cod_parroquia, p.nom_parroquia, p.poblacion
        FROM parroquias p
        JOIN municipios m ON m.cod_municipio = p.cod_municipio AND m.cod_estado = p.cod_estado
        JOIN estados e ON e.cod_estado = p.cod_estado
        WHERE p.cod_parroquia = ANY(p_territorio_ids)
        ORDER BY e.nom_estado, m.nom_municipio, p.nom_parroquia
      LOOP
        -- Guardar el territorio con mayor población
        IF v_territorio.poblacion > v_max_poblacion THEN
          v_max_poblacion := v_territorio.poblacion;
          v_territorio_mayor_poblacion := v_territorio;
        END IF;
        
        -- Calcular tickets asignados y asignarlos a la variable OUT
        cod_estado := v_territorio.cod_estado;
        nom_estado := v_territorio.nom_estado;
        cod_municipio := v_territorio.cod_municipio;
        nom_municipio := v_territorio.nom_municipio;
        cod_parroquia := v_territorio.cod_parroquia;
        nom_parroquia := v_territorio.nom_parroquia;
        poblacion := v_territorio.poblacion;
        porcentaje := 1.0 / v_total_poblacion;
        tickets_asignados := floor(p_total_tickets / v_total_poblacion);
        v_tickets_asignados := v_tickets_asignados + tickets_asignados;
        
        RETURN NEXT;
      END LOOP;
    END IF;
  ELSE
    -- Distribuir tickets proporcionalmente según población
    IF p_nivel_detalle = 'estado' THEN
      FOR v_territorio IN 
        SELECT e.cod_estado, e.nom_estado, NULL::INTEGER AS cod_municipio, 
               NULL::TEXT AS nom_municipio, NULL::INTEGER AS cod_parroquia, 
               NULL::TEXT AS nom_parroquia, e.poblacion
        FROM estados e
        WHERE e.cod_estado = ANY(p_territorio_ids)
        ORDER BY e.nom_estado
      LOOP
        -- Guardar el territorio con mayor población
        IF v_territorio.poblacion > v_max_poblacion THEN
          v_max_poblacion := v_territorio.poblacion;
          v_territorio_mayor_poblacion := v_territorio;
        END IF;
        
        -- Calcular tickets asignados y asignarlos a la variable OUT
        cod_estado := v_territorio.cod_estado;
        nom_estado := v_territorio.nom_estado;
        cod_municipio := v_territorio.cod_municipio;
        nom_municipio := v_territorio.nom_municipio;
        cod_parroquia := v_territorio.cod_parroquia;
        nom_parroquia := v_territorio.nom_parroquia;
        poblacion := v_territorio.poblacion;
        porcentaje := COALESCE(v_territorio.poblacion::NUMERIC / v_total_poblacion, 0);
        tickets_asignados := floor(p_total_tickets * porcentaje);
        v_tickets_asignados := v_tickets_asignados + tickets_asignados;
        
        RETURN NEXT;
      END LOOP;
    ELSIF p_nivel_detalle = 'municipio' THEN
      FOR v_territorio IN 
        SELECT e.cod_estado, e.nom_estado, m.cod_municipio, m.nom_municipio, 
               NULL::INTEGER AS cod_parroquia, NULL::TEXT AS nom_parroquia, m.poblacion
        FROM municipios m
        JOIN estados e ON e.cod_estado = m.cod_estado
        WHERE m.cod_municipio = ANY(p_territorio_ids)
        ORDER BY e.nom_estado, m.nom_municipio
      LOOP
        -- Guardar el territorio con mayor población
        IF v_territorio.poblacion > v_max_poblacion THEN
          v_max_poblacion := v_territorio.poblacion;
          v_territorio_mayor_poblacion := v_territorio;
        END IF;
        
        -- Calcular tickets asignados y asignarlos a la variable OUT
        cod_estado := v_territorio.cod_estado;
        nom_estado := v_territorio.nom_estado;
        cod_municipio := v_territorio.cod_municipio;
        nom_municipio := v_territorio.nom_municipio;
        cod_parroquia := v_territorio.cod_parroquia;
        nom_parroquia := v_territorio.nom_parroquia;
        poblacion := v_territorio.poblacion;
        porcentaje := COALESCE(v_territorio.poblacion::NUMERIC / v_total_poblacion, 0);
        tickets_asignados := floor(p_total_tickets * porcentaje);
        v_tickets_asignados := v_tickets_asignados + tickets_asignados;
        
        RETURN NEXT;
      END LOOP;
    ELSIF p_nivel_detalle = 'parroquia' THEN
      FOR v_territorio IN 
        SELECT e.cod_estado, e.nom_estado, m.cod_municipio, m.nom_municipio, 
               p.cod_parroquia, p.nom_parroquia, p.poblacion
        FROM parroquias p
        JOIN municipios m ON m.cod_municipio = p.cod_municipio AND m.cod_estado = p.cod_estado
        JOIN estados e ON e.cod_estado = p.cod_estado
        WHERE p.cod_parroquia = ANY(p_territorio_ids)
        ORDER BY e.nom_estado, m.nom_municipio, p.nom_parroquia
      LOOP
        -- Guardar el territorio con mayor población
        IF v_territorio.poblacion > v_max_poblacion THEN
          v_max_poblacion := v_territorio.poblacion;
          v_territorio_mayor_poblacion := v_territorio;
        END IF;
        
        -- Calcular tickets asignados y asignarlos a la variable OUT
        cod_estado := v_territorio.cod_estado;
        nom_estado := v_territorio.nom_estado;
        cod_municipio := v_territorio.cod_municipio;
        nom_municipio := v_territorio.nom_municipio;
        cod_parroquia := v_territorio.cod_parroquia;
        nom_parroquia := v_territorio.nom_parroquia;
        poblacion := v_territorio.poblacion;
        porcentaje := COALESCE(v_territorio.poblacion::NUMERIC / v_total_poblacion, 0);
        tickets_asignados := floor(p_total_tickets * porcentaje);
        v_tickets_asignados := v_tickets_asignados + tickets_asignados;
        
        RETURN NEXT;
      END LOOP;
    END IF;
  END IF;
  
  -- Manejar los tickets restantes por redondeo
  v_tickets_restantes := p_total_tickets - v_tickets_asignados;
  
  -- Si hay tickets restantes, agregarlos al territorio con mayor población
  IF v_tickets_restantes > 0 AND v_tickets_asignados > 0 AND v_max_poblacion > 0 THEN
    -- Asignar valores del territorio con mayor población a las variables OUT
    cod_estado := v_territorio_mayor_poblacion.cod_estado;
    nom_estado := v_territorio_mayor_poblacion.nom_estado;
    cod_municipio := v_territorio_mayor_poblacion.cod_municipio;
    nom_municipio := v_territorio_mayor_poblacion.nom_municipio;
    cod_parroquia := v_territorio_mayor_poblacion.cod_parroquia;
    nom_parroquia := v_territorio_mayor_poblacion.nom_parroquia;
    poblacion := v_territorio_mayor_poblacion.poblacion;
    porcentaje := COALESCE(v_territorio_mayor_poblacion.poblacion::NUMERIC / v_total_poblacion, 0);
    tickets_asignados := v_tickets_restantes;
    
    RETURN NEXT;
  END IF;
  
  RETURN;
END;
$$ LANGUAGE plpgsql; 