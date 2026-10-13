import type { Request, Response } from 'express';
import {
  esquemaCambiarActivoPlatillo,
  esquemaCrearPlatillo,
  esquemaEditarPlatillo,
} from '../schemas/platillos.schemas.js';
import {
  cambiarActivoPlatillo,
  crearPlatillo,
  editarPlatillo,
  listarPlatillos,
} from '../services/platillos.service.js';
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

/** GET /api/admin/platillos — lista el catálogo. */
export async function listar(req: Request, res: Response): Promise<void> {
  const incluirInactivos = req.query.incluirInactivos === 'true';
  const platillos = await listarPlatillos(incluirInactivos);
  res.status(200).json({ platillos });
}

/** POST /api/admin/platillos — crea un platillo. */
export async function crear(req: Request, res: Response): Promise<void> {
  const datos = validar(esquemaCrearPlatillo, req.body);
  const platillo = await crearPlatillo(datos);
  res.status(201).json({ platillo });
}

/** PUT /api/admin/platillos/:id — edita un platillo. */
export async function editar(req: Request, res: Response): Promise<void> {
  const id = idDeRuta(req);
  const datos = validar(esquemaEditarPlatillo, req.body);
  const platillo = await editarPlatillo(id, datos);
  res.status(200).json({ platillo });
}

/** PATCH /api/admin/platillos/:id/estado — activa o desactiva un platillo. */
export async function actualizarEstado(req: Request, res: Response): Promise<void> {
  const id = idDeRuta(req);
  const { activo } = validar(esquemaCambiarActivoPlatillo, req.body);
  const platillo = await cambiarActivoPlatillo(id, activo);
  res.status(200).json({ platillo });
}
