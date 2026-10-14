import { Router } from 'express';
import { ROL } from '../config/roles.js';
import { avisos, misPedidos, vistos } from '../controllers/avisos.controller.js';
import { autenticar } from '../middlewares/autenticar.js';
import { autorizarRol } from '../middlewares/autorizarRol.js';
import { envolverAsync } from '../utils/errores.js';

/** Seguimiento del cliente (solo rol cliente). */
export const misPedidosRoutes = Router();

misPedidosRoutes.use(autenticar, autorizarRol(ROL.CLIENTE));

misPedidosRoutes.get('/', envolverAsync(misPedidos));

/** Avisos del cliente (cliente y administrador). */
export const avisosRoutes = Router();

avisosRoutes.get(
  '/',
  autenticar,
  autorizarRol(ROL.CLIENTE, ROL.ADMINISTRADOR),
  envolverAsync(avisos),
);
avisosRoutes.patch(
  '/vistos',
  autenticar,
  autorizarRol(ROL.CLIENTE),
  envolverAsync(vistos),
);
