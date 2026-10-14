import { Router } from 'express';
import { ROL } from '../config/roles.js';
import { pendientes } from '../controllers/caja.controller.js';
import { autenticar } from '../middlewares/autenticar.js';
import { autorizarRol } from '../middlewares/autorizarRol.js';
import { envolverAsync } from '../utils/errores.js';

/** Caja: pendientes de entrega y cobro (solo cajero). */
export const cajaRoutes = Router();

cajaRoutes.use(autenticar, autorizarRol(ROL.CAJERO));

cajaRoutes.get('/pendientes', envolverAsync(pendientes));
