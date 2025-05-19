-- Función para distribuir tickets proporcionalmente usando tipo personalizado
CREATE OR REPLACE FUNCTION distribuir_tickets_con_tipo(
  p_total_tickets INTEGER,
  p_nivel_detalle TEXT,
  p_territorio_ids INTEGER[]
)
RETURNS SETOF tipo_distribucion AS $$
DECLARE
  v_total_poblacion INTEGER := 0;
  v_tickets_asignados INTEGER := 0;
  v_tickets_restantes INTEGER := 0;
  v_territorio tipo_distribucion;
  v_territorio_mayor_poblacion tipo_distribucion;
  v_max_poblacion INTEGER := 0;
  v_temp RECORD;
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
      FOR v_temp IN 
        SELECT e.cod_estado, e.nom_estado, NULL::INTEGER AS cod_municipio, 
               NULL::TEXT AS nom_municipio, NULL::INTEGER AS cod_parroquia, 
               NULL::TEXT AS nom_parroquia, e.poblacion
        FROM estados e
        WHERE e.cod_estado = ANY(p_territorio_ids)
        ORDER BY e.nom_estado
      LOOP
        -- Preparar el registro para retornar
        v_territorio.cod_estado := v_temp.cod_estado;
        v_territorio.nom_estado := v_temp.nom_estado;
        v_territorio.cod_municipio := v_temp.cod_municipio;
        v_territorio.nom_municipio := v_temp.nom_municipio;
        v_territorio.cod_parroquia := v_temp.cod_parroquia;
        v_territorio.nom_parroquia := v_temp.nom_parroquia;
        v_territorio.poblacion := v_temp.poblacion;
        v_territorio.porcentaje := 1.0 / v_total_poblacion;
        v_territorio.tickets_asignados := floor(p_total_tickets / v_total_poblacion);
        
        v_tickets_asignados := v_tickets_asignados + v_territorio.tickets_asignados;
        
        -- Guardar el territorio con mayor población
        IF v_territorio.poblacion > v_max_poblacion THEN
          v_max_poblacion := v_territorio.poblacion;
          v_territorio_mayor_poblacion := v_territorio;
        END IF;
        
        -- Retornar el registro completo
        RETURN NEXT v_territorio;
      END LOOP;
    ELSIF p_nivel_detalle = 'municipio' THEN
      FOR v_temp IN 
        SELECT e.cod_estado, e.nom_estado, m.cod_municipio, m.nom_municipio, 
               NULL::INTEGER AS cod_parroquia, NULL::TEXT AS nom_parroquia, m.poblacion
        FROM municipios m
        JOIN estados e ON e.cod_estado = m.cod_estado
        WHERE m.cod_municipio = ANY(p_territorio_ids)
        ORDER BY e.nom_estado, m.nom_municipio
      LOOP
        -- Preparar el registro para retornar
        v_territorio.cod_estado := v_temp.cod_estado;
        v_territorio.nom_estado := v_temp.nom_estado;
        v_territorio.cod_municipio := v_temp.cod_municipio;
        v_territorio.nom_municipio := v_temp.nom_municipio;
        v_territorio.cod_parroquia := v_temp.cod_parroquia;
        v_territorio.nom_parroquia := v_temp.nom_parroquia;
        v_territorio.poblacion := v_temp.poblacion;
        v_territorio.porcentaje := 1.0 / v_total_poblacion;
        v_territorio.tickets_asignados := floor(p_total_tickets / v_total_poblacion);
        
        v_tickets_asignados := v_tickets_asignados + v_territorio.tickets_asignados;
        
        -- Guardar el territorio con mayor población
        IF v_territorio.poblacion > v_max_poblacion THEN
          v_max_poblacion := v_territorio.poblacion;
          v_territorio_mayor_poblacion := v_territorio;
        END IF;
        
        -- Retornar el registro completo
        RETURN NEXT v_territorio;
      END LOOP;
    ELSIF p_nivel_detalle = 'parroquia' THEN
      FOR v_temp IN 
        SELECT e.cod_estado, e.nom_estado, m.cod_municipio, m.nom_municipio, 
               p.cod_parroquia, p.nom_parroquia, p.poblacion
        FROM parroquias p
        JOIN municipios m ON m.cod_municipio = p.cod_municipio AND m.cod_estado = p.cod_estado
        JOIN estados e ON e.cod_estado = p.cod_estado
        WHERE p.cod_parroquia = ANY(p_territorio_ids)
        ORDER BY e.nom_estado, m.nom_municipio, p.nom_parroquia
      LOOP
        -- Preparar el registro para retornar
        v_territorio.cod_estado := v_temp.cod_estado;
        v_territorio.nom_estado := v_temp.nom_estado;
        v_territorio.cod_municipio := v_temp.cod_municipio;
        v_territorio.nom_municipio := v_temp.nom_municipio;
        v_territorio.cod_parroquia := v_temp.cod_parroquia;
        v_territorio.nom_parroquia := v_temp.nom_parroquia;
        v_territorio.poblacion := v_temp.poblacion;
        v_territorio.porcentaje := 1.0 / v_total_poblacion;
        v_territorio.tickets_asignados := floor(p_total_tickets / v_total_poblacion);
        
        v_tickets_asignados := v_tickets_asignados + v_territorio.tickets_asignados;
        
        -- Guardar el territorio con mayor población
        IF v_territorio.poblacion > v_max_poblacion THEN
          v_max_poblacion := v_territorio.poblacion;
          v_territorio_mayor_poblacion := v_territorio;
        END IF;
        
        -- Retornar el registro completo
        RETURN NEXT v_territorio;
      END LOOP;
    END IF;
  ELSE
    -- Distribuir tickets proporcionalmente según población
    IF p_nivel_detalle = 'estado' THEN
      FOR v_temp IN 
        SELECT e.cod_estado, e.nom_estado, NULL::INTEGER AS cod_municipio, 
               NULL::TEXT AS nom_municipio, NULL::INTEGER AS cod_parroquia, 
               NULL::TEXT AS nom_parroquia, e.poblacion
        FROM estados e
        WHERE e.cod_estado = ANY(p_territorio_ids)
        ORDER BY e.nom_estado
      LOOP
        -- Preparar el registro para retornar
        v_territorio.cod_estado := v_temp.cod_estado;
        v_territorio.nom_estado := v_temp.nom_estado;
        v_territorio.cod_municipio := v_temp.cod_municipio;
        v_territorio.nom_municipio := v_temp.nom_municipio;
        v_territorio.cod_parroquia := v_temp.cod_parroquia;
        v_territorio.nom_parroquia := v_temp.nom_parroquia;
        v_territorio.poblacion := v_temp.poblacion;
        v_territorio.porcentaje := COALESCE(v_territorio.poblacion::NUMERIC / v_total_poblacion, 0);
        v_territorio.tickets_asignados := floor(p_total_tickets * v_territorio.porcentaje);
        
        v_tickets_asignados := v_tickets_asignados + v_territorio.tickets_asignados;
        
        -- Guardar el territorio con mayor población
        IF v_territorio.poblacion > v_max_poblacion THEN
          v_max_poblacion := v_territorio.poblacion;
          v_territorio_mayor_poblacion := v_territorio;
        END IF;
        
        -- Retornar el registro completo
        RETURN NEXT v_territorio;
      END LOOP;
    ELSIF p_nivel_detalle = 'municipio' THEN
      FOR v_temp IN 
        SELECT e.cod_estado, e.nom_estado, m.cod_municipio, m.nom_municipio, 
               NULL::INTEGER AS cod_parroquia, NULL::TEXT AS nom_parroquia, m.poblacion
        FROM municipios m
        JOIN estados e ON e.cod_estado = m.cod_estado
        WHERE m.cod_municipio = ANY(p_territorio_ids)
        ORDER BY e.nom_estado, m.nom_municipio
      LOOP
        -- Preparar el registro para retornar
        v_territorio.cod_estado := v_temp.cod_estado;
        v_territorio.nom_estado := v_temp.nom_estado;
        v_territorio.cod_municipio := v_temp.cod_municipio;
        v_territorio.nom_municipio := v_temp.nom_municipio;
        v_territorio.cod_parroquia := v_temp.cod_parroquia;
        v_territorio.nom_parroquia := v_temp.nom_parroquia;
        v_territorio.poblacion := v_temp.poblacion;
        v_territorio.porcentaje := COALESCE(v_territorio.poblacion::NUMERIC / v_total_poblacion, 0);
        v_territorio.tickets_asignados := floor(p_total_tickets * v_territorio.porcentaje);
        
        v_tickets_asignados := v_tickets_asignados + v_territorio.tickets_asignados;
        
        -- Guardar el territorio con mayor población
        IF v_territorio.poblacion > v_max_poblacion THEN
          v_max_poblacion := v_territorio.poblacion;
          v_territorio_mayor_poblacion := v_territorio;
        END IF;
        
        -- Retornar el registro completo
        RETURN NEXT v_territorio;
      END LOOP;
    ELSIF p_nivel_detalle = 'parroquia' THEN
      FOR v_temp IN 
        SELECT e.cod_estado, e.nom_estado, m.cod_municipio, m.nom_municipio, 
               p.cod_parroquia, p.nom_parroquia, p.poblacion
        FROM parroquias p
        JOIN municipios m ON m.cod_municipio = p.cod_municipio AND m.cod_estado = p.cod_estado
        JOIN estados e ON e.cod_estado = p.cod_estado
        WHERE p.cod_parroquia = ANY(p_territorio_ids)
        ORDER BY e.nom_estado, m.nom_municipio, p.nom_parroquia
      LOOP
        -- Preparar el registro para retornar
        v_territorio.cod_estado := v_temp.cod_estado;
        v_territorio.nom_estado := v_temp.nom_estado;
        v_territorio.cod_municipio := v_temp.cod_municipio;
        v_territorio.nom_municipio := v_temp.nom_municipio;
        v_territorio.cod_parroquia := v_temp.cod_parroquia;
        v_territorio.nom_parroquia := v_temp.nom_parroquia;
        v_territorio.poblacion := v_temp.poblacion;
        v_territorio.porcentaje := COALESCE(v_territorio.poblacion::NUMERIC / v_total_poblacion, 0);
        v_territorio.tickets_asignados := floor(p_total_tickets * v_territorio.porcentaje);
        
        v_tickets_asignados := v_tickets_asignados + v_territorio.tickets_asignados;
        
        -- Guardar el territorio con mayor población
        IF v_territorio.poblacion > v_max_poblacion THEN
          v_max_poblacion := v_territorio.poblacion;
          v_territorio_mayor_poblacion := v_territorio;
        END IF;
        
        -- Retornar el registro completo
        RETURN NEXT v_territorio;
      END LOOP;
    END IF;
  END IF;
  
  -- Manejar los tickets restantes por redondeo
  v_tickets_restantes := p_total_tickets - v_tickets_asignados;
  
  -- Si hay tickets restantes, agregarlos al territorio con mayor población
  IF v_tickets_restantes > 0 AND v_tickets_asignados > 0 AND v_max_poblacion > 0 THEN
    -- Crear registro adicional para los tickets restantes
    v_territorio := v_territorio_mayor_poblacion;
    v_territorio.tickets_asignados := v_tickets_restantes;
    
    -- Retornar el registro adicional
    RETURN NEXT v_territorio;
  END IF;
  
  RETURN;
END;
$$ LANGUAGE plpgsql; 