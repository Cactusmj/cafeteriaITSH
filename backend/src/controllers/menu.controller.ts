import type { Request, Response } from 'express';
import { esquemaAgregarMenu, esquemaEditarMenu } from '../schemas/menu.schemas.js';
import {
  agregarAlMenu,
  editarEntradaMenu,
  eliminarEntradaMenu,
  listarMenuAdmin,
  obtenerMenuPublico,
} from '../services/menu.service.js';
import { errorValidacion } from '../utils/errores.js';
import { esFechaISO, hoyISO } from '../utils/fecha.js';
import { validar } from '../utils/validar.js';

/** Convierte y valida un id de ruta. */
function idDeRuta(req: Request): number {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw errorValidacion('Identificador inválido');
  }
  return id;
}

/** Lee y valida el parámetro de consulta `fecha`. */
function fechaDeConsulta(req: Request): string {
  const fecha = typeof req.query.fecha === 'string' ? req.query.fecha : hoyISO();
  if (!esFechaISO(fecha)) {
    throw errorValidacion('La fecha debe tener el formato YYYY-MM-DD');
  }
  return fecha;
}

/** GET /api/admin/menu — lista las entradas del menú de una fecha. */
export async function listar(req: Request, res: Response): Promise<void> {
  const fecha = fechaDeConsulta(req);
  const entradas = await listarMenuAdmin(fecha);
  res.status(200).json({ fecha, entradas });
}

/** POST /api/admin/menu — agrega un platillo al menú. */
export async function agregar(req: Request, res: Response): Promise<void> {
  const datos = validar(esquemaAgregarMenu, req.body);
  const entrada = await agregarAlMenu(datos);
  res.status(201).json({ entrada });
}

/** PUT /api/admin/menu/:id — actualiza precio, disponibilidad o especial. */
export async function editar(req: Request, res: Response): Promise<void> {
  const id = idDeRuta(req);
  const datos = validar(esquemaEditarMenu, req.body);
  const entrada = await editarEntradaMenu(id, datos);
  res.status(200).json({ entrada });
}

/** DELETE /api/admin/menu/:id — elimina una entrada del menú. */
export async function eliminar(req: Request, res: Response): Promise<void> {
  const id = idDeRuta(req);
  const resultado = await eliminarEntradaMenu(id);
  res.status(200).json(resultado);
}

/** GET /api/menu — consulta pública del menú de una fecha. */
export async function consultar(req: Request, res: Response): Promise<void> {
  const fecha = fechaDeConsulta(req);
  const platillos = await obtenerMenuPublico(fecha);
  res.status(200).json({ fecha, platillos });
}
