import { Router } from 'express';
import { ROL } from '../config/roles.js';
import { tablero } from '../controllers/cocina.controller.js';
import { autenticar } from '../middlewares/autenticar.js';
import { autorizarRol } from '../middlewares/autorizarRol.js';
import { envolverAsync } from '../utils/errores.js';

/** Cocina: tablero de pedidos en flujo (solo cocinero). */
export const cocinaRoutes = Router();

cocinaRoutes.use(autenticar, autorizarRol(ROL.COCINERO));

cocinaRoutes.get('/pedidos', envolverAsync(tablero));
