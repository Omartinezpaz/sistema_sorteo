-- Script para insertar únicamente la distribución de tiques para el sorteo 27
-- Este script asume que la tabla distribucion_tiques ya existe
-- y no modifica la función generar_tiques_desde_distribucion
-- Se puede usar si solo se quiere configurar la distribución sin tocar la función

-- Limpiar registros existentes del sorteo 27 (si existen)
DELETE FROM distribucion_tiques WHERE sorteo_id = 27;

-- Insertar distribución de tiques para DTTO. CAPITAL
INSERT INTO distribucion_tiques (sorteo_id, cod_estado, rango_desde, rango_hasta, cantidad, porcentaje)
VALUES (27, 1, 1, 28258, 28258, 8.07);

-- Insertar distribución de tiques para EDO. ANZOATEGUI
INSERT INTO distribucion_tiques (sorteo_id, cod_estado, rango_desde, rango_hasta, cantidad, porcentaje)
VALUES (27, 2, 28259, 47314, 19056, 5.44);

-- Insertar distribución de tiques para EDO. APURE
INSERT INTO distribucion_tiques (sorteo_id, cod_estado, rango_desde, rango_hasta, cantidad, porcentaje)
VALUES (27, 3, 47315, 53603, 6289, 1.80);

-- Insertar distribución de tiques para EDO. ARAGUA
INSERT INTO distribucion_tiques (sorteo_id, cod_estado, rango_desde, rango_hasta, cantidad, porcentaje)
VALUES (27, 4, 53604, 74780, 21177, 6.04);

-- Insertar distribución de tiques para EDO. BARINAS
INSERT INTO distribucion_tiques (sorteo_id, cod_estado, rango_desde, rango_hasta, cantidad, porcentaje)
VALUES (27, 5, 74781, 85014, 10234, 2.92);

-- Insertar distribución de tiques para EDO. BOLIVAR
INSERT INTO distribucion_tiques (sorteo_id, cod_estado, rango_desde, rango_hasta, cantidad, porcentaje)
VALUES (27, 6, 85015, 102599, 17585, 5.02);

-- Insertar distribución de tiques para EDO. CARABOBO
INSERT INTO distribucion_tiques (sorteo_id, cod_estado, rango_desde, rango_hasta, cantidad, porcentaje)
VALUES (27, 7, 102600, 130051, 27452, 7.83);

-- Insertar distribución de tiques para EDO. COJEDES
INSERT INTO distribucion_tiques (sorteo_id, cod_estado, rango_desde, rango_hasta, cantidad, porcentaje)
VALUES (27, 8, 130052, 134592, 4541, 1.30);

-- Insertar distribución de tiques para EDO. FALCON
INSERT INTO distribucion_tiques (sorteo_id, cod_estado, rango_desde, rango_hasta, cantidad, porcentaje)
VALUES (27, 9, 134593, 146591, 11999, 3.42);

-- Insertar distribución de tiques para EDO. GUARICO
INSERT INTO distribucion_tiques (sorteo_id, cod_estado, rango_desde, rango_hasta, cantidad, porcentaje)
VALUES (27, 10, 146592, 155868, 9277, 2.65);

-- Insertar distribución de tiques para EDO. LARA
INSERT INTO distribucion_tiques (sorteo_id, cod_estado, rango_desde, rango_hasta, cantidad, porcentaje)
VALUES (27, 11, 155869, 178225, 22357, 6.38);

-- Insertar distribución de tiques para EDO. MERIDA
INSERT INTO distribucion_tiques (sorteo_id, cod_estado, rango_desde, rango_hasta, cantidad, porcentaje)
VALUES (27, 12, 178226, 188933, 10708, 3.06);

-- Insertar distribución de tiques para EDO. MIRANDA
INSERT INTO distribucion_tiques (sorteo_id, cod_estado, rango_desde, rango_hasta, cantidad, porcentaje)
VALUES (27, 13, 188934, 225858, 36925, 10.54);

-- Insertar distribución de tiques para EDO. MONAGAS
INSERT INTO distribucion_tiques (sorteo_id, cod_estado, rango_desde, rango_hasta, cantidad, porcentaje)
VALUES (27, 14, 225859, 237138, 11280, 3.22);

-- Insertar distribución de tiques para EDO.NVA.ESPARTA
INSERT INTO distribucion_tiques (sorteo_id, cod_estado, rango_desde, rango_hasta, cantidad, porcentaje)
VALUES (27, 15, 237139, 243614, 6476, 1.85);

-- Insertar distribución de tiques para EDO. PORTUGUESA
INSERT INTO distribucion_tiques (sorteo_id, cod_estado, rango_desde, rango_hasta, cantidad, porcentaje)
VALUES (27, 16, 243615, 254744, 11130, 3.18);

-- Insertar distribución de tiques para EDO. SUCRE
INSERT INTO distribucion_tiques (sorteo_id, cod_estado, rango_desde, rango_hasta, cantidad, porcentaje)
VALUES (27, 17, 254745, 266393, 11649, 3.33);

-- Insertar distribución de tiques para EDO. TACHIRA
INSERT INTO distribucion_tiques (sorteo_id, cod_estado, rango_desde, rango_hasta, cantidad, porcentaje)
VALUES (27, 18, 266394, 281088, 14695, 4.19);

-- Insertar distribución de tiques para EDO. TRUJILLO
INSERT INTO distribucion_tiques (sorteo_id, cod_estado, rango_desde, rango_hasta, cantidad, porcentaje)
VALUES (27, 19, 281089, 290332, 9244, 2.64);

-- Insertar distribución de tiques para EDO. YARACUY
INSERT INTO distribucion_tiques (sorteo_id, cod_estado, rango_desde, rango_hasta, cantidad, porcentaje)
VALUES (27, 20, 290333, 298163, 7831, 2.23);

-- Insertar distribución de tiques para EDO. ZULIA
INSERT INTO distribucion_tiques (sorteo_id, cod_estado, rango_desde, rango_hasta, cantidad, porcentaje)
VALUES (27, 21, 298164, 341129, 42966, 12.26);

-- Insertar distribución de tiques para EDO. AMAZONAS
INSERT INTO distribucion_tiques (sorteo_id, cod_estado, rango_desde, rango_hasta, cantidad, porcentaje)
VALUES (27, 22, 341130, 343085, 1956, 0.56);

-- Insertar distribución de tiques para EDO. DELTA AMACURO
INSERT INTO distribucion_tiques (sorteo_id, cod_estado, rango_desde, rango_hasta, cantidad, porcentaje)
VALUES (27, 23, 343086, 345242, 2157, 0.62);

-- Insertar distribución de tiques para EDO. LA GUAIRA
INSERT INTO distribucion_tiques (sorteo_id, cod_estado, rango_desde, rango_hasta, cantidad, porcentaje)
VALUES (27, 24, 345243, 350397, 5155, 1.47);

-- Verificar los registros insertados
SELECT COUNT(*) FROM distribucion_tiques WHERE sorteo_id = 27;

-- Mostrar los primeros 10 registros para verificar
SELECT * FROM distribucion_tiques WHERE sorteo_id = 27 ORDER BY rango_desde LIMIT 10; 