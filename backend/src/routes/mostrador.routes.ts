import { Router } from 'express';
import { ROL } from '../config/roles.js';
import { cobrar, crear } from '../controllers/mostrador.controller.js';
import { autenticar } from '../middlewares/autenticar.js';
import { autorizarRol } from '../middlewares/autorizarRol.js';
import { envolverAsync } from '../utils/errores.js';

/** Mostrador: captura y cobro en efectivo (solo cajero). */
export const mostradorRoutes = Router();

mostradorRoutes.use(autenticar, autorizarRol(ROL.CAJERO));

mostradorRoutes.post('/mostrador', envolverAsync(crear));
mostradorRoutes.post('/:id/cobro', envolverAsync(cobrar));
