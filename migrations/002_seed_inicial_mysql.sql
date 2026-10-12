-- ============================================================
-- 002_seed_inicial_mysql.sql
-- Datos iniciales para el Sistema de Pedidos Anticipados
-- Ejecutar después de 001_crear_esquema_mysql.sql
-- ============================================================

USE cafeteria_itsh;

-- Roles
INSERT IGNORE INTO rol (nombre) VALUES
  ('administrador'),
  ('cajero'),
  ('cocinero'),
  ('usuario');

-- Estados de pedido
INSERT IGNORE INTO estado_pedido (nombre, orden) VALUES
  ('Pendiente', 1),
  ('Pagado', 2),
  ('En preparación', 3),
  ('Listo', 4),
  ('Entregado', 5),
  ('Cancelado', 0);

-- Transiciones válidas
INSERT IGNORE INTO transicion_estado (desde_id, hacia_id)
SELECT d.id, h.id
FROM estado_pedido AS d
CROSS JOIN estado_pedido AS h
WHERE
  (d.nombre = 'Pendiente' AND h.nombre IN ('Pagado', 'Cancelado'))
  OR (d.nombre = 'Pagado' AND h.nombre IN ('En preparación', 'Cancelado'))
  OR (d.nombre = 'En preparación' AND h.nombre IN ('Listo', 'Cancelado'))
  OR (d.nombre = 'Listo' AND h.nombre IN ('Entregado', 'Cancelado'));

-- Platillos de ejemplo
INSERT INTO platillo (nombre, categoria, descripcion)
SELECT datos.nombre, datos.categoria, datos.descripcion
FROM (
  SELECT 'Gordita de chicharrón' AS nombre, 'Comida' AS categoria,
         'Gordita de maíz con chicharrón prensado' AS descripcion
  UNION ALL SELECT 'Gordita de frijol', 'Comida',
         'Gordita de maíz con frijoles refritos'
  UNION ALL SELECT 'Quesadilla de queso', 'Comida',
         'Tortilla de maíz con queso Oaxaca'
  UNION ALL SELECT 'Torta de jamón', 'Comida',
         'Torta con jamón, queso y aguacate'
  UNION ALL SELECT 'Café de olla', 'Bebida',
         'Café de olla con piloncillo y canela'
  UNION ALL SELECT 'Jugo de naranja', 'Bebida',
         'Jugo de naranja natural 500 ml'
  UNION ALL SELECT 'Agua de horchata', 'Bebida',
         'Agua fresca de horchata 500 ml'
  UNION ALL SELECT 'Pan con huevo', 'Comida',
         'Pan dulce con huevo revuelto'
) AS datos
WHERE NOT EXISTS (
  SELECT 1 FROM platillo AS p WHERE p.nombre = datos.nombre
);

-- Menú de hoy: no duplica un platillo si ya está agregado para la fecha actual.
INSERT IGNORE INTO menu_dia (fecha, platillo_id, precio, disponible, especial)
SELECT
  CURRENT_DATE,
  p.id,
  CASE p.nombre
    WHEN 'Gordita de chicharrón' THEN 35.00
    WHEN 'Gordita de frijol' THEN 30.00
    WHEN 'Quesadilla de queso' THEN 25.00
    WHEN 'Torta de jamón' THEN 45.00
    WHEN 'Café de olla' THEN 20.00
    WHEN 'Jugo de naranja' THEN 25.00
    WHEN 'Agua de horchata' THEN 15.00
    WHEN 'Pan con huevo' THEN 28.00
  END,
  TRUE,
  CASE
    WHEN p.nombre IN ('Gordita de chicharrón', 'Café de olla') THEN TRUE
    ELSE FALSE
  END
FROM platillo AS p
WHERE p.nombre IN (
  'Gordita de chicharrón',
  'Gordita de frijol',
  'Quesadilla de queso',
  'Torta de jamón',
  'Café de olla',
  'Jugo de naranja',
  'Agua de horchata',
  'Pan con huevo'
);
