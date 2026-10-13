import type { Request, Response } from 'express';
import {
  esquemaCambiarEstado,
  esquemaCrearUsuario,
  esquemaEditarUsuario,
} from '../schemas/usuarios.schemas.js';
import { cambiarEstado, crearUsuario, editarUsuario, listarUsuarios } from '../services/usuarios.service.js';
import { errorValidacion } from '../utils/errores.js';
import { validar } from '../utils/validar.js';

/** Convierte y valida un id de ruta. */
function idDeRuta(req: Request): number {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw errorValidacion('Identificador inválido');
  }
  return id;
}

/** GET /api/admin/usuarios — lista cuentas operativas. */
export async function listar(req: Request, res: Response): Promise<void> {
  const rol = typeof req.query.rol === 'string' ? req.query.rol : undefined;
  const usuarios = await listarUsuarios(rol);
  res.status(200).json({ usuarios });
}

/** POST /api/admin/usuarios — crea una cuenta operativa. */
export async function crear(req: Request, res: Response): Promise<void> {
  const datos = validar(esquemaCrearUsuario, req.body);
  const usuario = await crearUsuario(datos);
  res.status(201).json({ usuario });
}

/** PUT /api/admin/usuarios/:id — edita una cuenta operativa. */
export async function editar(req: Request, res: Response): Promise<void> {
  const id = idDeRuta(req);
  const datos = validar(esquemaEditarUsuario, req.body);
  const usuario = await editarUsuario(id, datos);
  res.status(200).json({ usuario });
}

/** PATCH /api/admin/usuarios/:id/estado — habilita o deshabilita una cuenta. */
export async function actualizarEstado(req: Request, res: Response): Promise<void> {
  const id = idDeRuta(req);
  const { activo } = validar(esquemaCambiarEstado, req.body);
  const solicitanteId = req.usuario?.id ?? 0;
  const usuario = await cambiarEstado(id, activo, solicitanteId);
  res.status(200).json({ usuario });
}
