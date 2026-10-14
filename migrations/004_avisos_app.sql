-- ============================================================
-- 004_avisos_app.sql
-- Sprint 5 — Seguimiento y notificaciones
-- Amplía el catálogo de canal ('app') y el estado de lectura ('vista')
-- de la tabla notificacion. Ejecutar una sola vez después de 001–003.
-- ============================================================

USE cafeteria_itsh;

ALTER TABLE notificacion DROP CHECK chk_notificacion_canal;
ALTER TABLE notificacion ADD CONSTRAINT chk_notificacion_canal
  CHECK (canal IN ('correo', 'push', 'sms', 'app'));

ALTER TABLE notificacion DROP CHECK chk_notificacion_estado;
ALTER TABLE notificacion ADD CONSTRAINT chk_notificacion_estado
  CHECK (estado_envio IN ('pendiente', 'enviada', 'vista', 'fallida'));
