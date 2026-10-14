-- ============================================================
-- 003_clave_idempotencia_pedido.sql
-- Sprint 3 — Pedido anticipado y pago
-- Agrega la clave de idempotencia para evitar pedidos duplicados
-- ante reintentos de creación (FR-010). Ejecutar después de 001 y 002.
-- ============================================================

USE cafeteria_itsh;

ALTER TABLE pedido
  ADD COLUMN clave_idempotencia VARCHAR(36) NULL,
  ADD UNIQUE KEY uq_pedido_clave_idempotencia (clave_idempotencia);
