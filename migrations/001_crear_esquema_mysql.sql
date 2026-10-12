-- ============================================================
-- 001_crear_esquema_mysql.sql
-- Esquema MySQL para el Sistema de Pedidos Anticipados
-- Cafetería ITSH
-- Compatible con MySQL 8.0.16 o posterior
-- Ejecutar primero este archivo y después 002_seed_inicial_mysql.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS cafeteria_itsh
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE cafeteria_itsh;

CREATE TABLE IF NOT EXISTS rol (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(30) NOT NULL UNIQUE,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS usuario (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  rol_id INT NOT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_usuario_rol FOREIGN KEY (rol_id) REFERENCES rol(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS platillo (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  categoria VARCHAR(50),
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS menu_dia (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fecha DATE NOT NULL,
  platillo_id INT NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  disponible BOOLEAN NOT NULL DEFAULT TRUE,
  especial BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT chk_menu_precio CHECK (precio >= 0),
  CONSTRAINT fk_menu_platillo FOREIGN KEY (platillo_id) REFERENCES platillo(id),
  CONSTRAINT uq_menu_fecha_platillo UNIQUE (fecha, platillo_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS estado_pedido (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(30) NOT NULL UNIQUE,
  orden INT NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS transicion_estado (
  desde_id INT NOT NULL,
  hacia_id INT NOT NULL,
  PRIMARY KEY (desde_id, hacia_id),
  CONSTRAINT chk_transicion_distinta CHECK (desde_id <> hacia_id),
  CONSTRAINT fk_transicion_desde FOREIGN KEY (desde_id) REFERENCES estado_pedido(id),
  CONSTRAINT fk_transicion_hacia FOREIGN KEY (hacia_id) REFERENCES estado_pedido(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS pedido (
  id INT AUTO_INCREMENT PRIMARY KEY,
  numero VARCHAR(20) NOT NULL UNIQUE,
  tipo VARCHAR(20) NOT NULL,
  estado_id INT NOT NULL,
  usuario_id INT NULL,
  cliente_nombre VARCHAR(100),
  fecha_recoleccion DATETIME NULL,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  creado_por INT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_pedido_tipo CHECK (tipo IN ('anticipado', 'mostrador')),
  CONSTRAINT chk_pedido_total CHECK (total >= 0),
  CONSTRAINT chk_pedido_anticipado CHECK (
    (tipo = 'anticipado' AND usuario_id IS NOT NULL AND fecha_recoleccion IS NOT NULL)
    OR tipo = 'mostrador'
  ),
  CONSTRAINT fk_pedido_estado FOREIGN KEY (estado_id) REFERENCES estado_pedido(id),
  CONSTRAINT fk_pedido_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id),
  CONSTRAINT fk_pedido_creado_por FOREIGN KEY (creado_por) REFERENCES usuario(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS pedido_detalle (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id INT NOT NULL,
  menu_dia_id INT NOT NULL,
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  CONSTRAINT chk_detalle_cantidad CHECK (cantidad > 0),
  CONSTRAINT chk_detalle_precio CHECK (precio_unitario >= 0),
  CONSTRAINT chk_detalle_subtotal CHECK (subtotal >= 0),
  CONSTRAINT fk_detalle_pedido FOREIGN KEY (pedido_id) REFERENCES pedido(id) ON DELETE CASCADE,
  CONSTRAINT fk_detalle_menu FOREIGN KEY (menu_dia_id) REFERENCES menu_dia(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS pedido_estado_historial (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id INT NOT NULL,
  estado_anterior_id INT NULL,
  estado_nuevo_id INT NOT NULL,
  cambiado_por INT NULL,
  fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_historial_pedido FOREIGN KEY (pedido_id) REFERENCES pedido(id) ON DELETE CASCADE,
  CONSTRAINT fk_historial_estado_anterior FOREIGN KEY (estado_anterior_id) REFERENCES estado_pedido(id),
  CONSTRAINT fk_historial_estado_nuevo FOREIGN KEY (estado_nuevo_id) REFERENCES estado_pedido(id),
  CONSTRAINT fk_historial_usuario FOREIGN KEY (cambiado_por) REFERENCES usuario(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS pago (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id INT NOT NULL UNIQUE,
  metodo VARCHAR(20) NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  referencia VARCHAR(100),
  registrado_por INT NULL,
  fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_pago_metodo CHECK (metodo IN ('online', 'efectivo')),
  CONSTRAINT chk_pago_monto CHECK (monto > 0),
  CONSTRAINT fk_pago_pedido FOREIGN KEY (pedido_id) REFERENCES pedido(id),
  CONSTRAINT fk_pago_usuario FOREIGN KEY (registrado_por) REFERENCES usuario(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notificacion (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id INT NOT NULL,
  tipo VARCHAR(30) NOT NULL,
  canal VARCHAR(20) NOT NULL,
  estado_envio VARCHAR(20) NOT NULL DEFAULT 'pendiente',
  fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  detalle_error TEXT,
  CONSTRAINT chk_notificacion_canal CHECK (canal IN ('correo', 'push', 'sms')),
  CONSTRAINT chk_notificacion_estado CHECK (estado_envio IN ('pendiente', 'enviada', 'fallida')),
  CONSTRAINT fk_notificacion_pedido FOREIGN KEY (pedido_id) REFERENCES pedido(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Índices
CREATE INDEX idx_usuario_rol ON usuario(rol_id);
CREATE INDEX idx_menu_dia_fecha ON menu_dia(fecha);
CREATE INDEX idx_pedido_estado ON pedido(estado_id);
CREATE INDEX idx_pedido_fecha_recoleccion ON pedido(fecha_recoleccion);
CREATE INDEX idx_pedido_usuario ON pedido(usuario_id);
CREATE INDEX idx_pedido_tipo ON pedido(tipo);
CREATE INDEX idx_pedido_detalle_pedido ON pedido_detalle(pedido_id);
CREATE INDEX idx_historial_pedido ON pedido_estado_historial(pedido_id);
CREATE INDEX idx_pago_pedido ON pago(pedido_id);
-- MySQL no admite el índice parcial de PostgreSQL; se crea un índice normal.
CREATE INDEX idx_notificacion_pendiente ON notificacion(estado_envio);

-- Triggers para actualizar automáticamente actualizado_en.
-- Ejecutar este archivo una sola vez en una base de datos nueva.
DELIMITER $$

CREATE TRIGGER trg_usuario_actualizado
BEFORE UPDATE ON usuario
FOR EACH ROW
BEGIN
  SET NEW.actualizado_en = CURRENT_TIMESTAMP;
END$$

CREATE TRIGGER trg_platillo_actualizado
BEFORE UPDATE ON platillo
FOR EACH ROW
BEGIN
  SET NEW.actualizado_en = CURRENT_TIMESTAMP;
END$$

CREATE TRIGGER trg_pedido_actualizado
BEFORE UPDATE ON pedido
FOR EACH ROW
BEGIN
  SET NEW.actualizado_en = CURRENT_TIMESTAMP;
END$$

DELIMITER ;
