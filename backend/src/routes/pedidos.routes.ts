import { Router } from 'express';
import { ROL } from '../config/roles.js';
import { cambiarEstado, crear, obtener, pagar } from '../controllers/pedidos.controller.js';
import { autenticar } from '../middlewares/autenticar.js';
import { autorizarRol } from '../middlewares/autorizarRol.js';
import { envolverAsync } from '../utils/errores.js';

/** Pedidos anticipados: creación y pago del cliente; detalle del dueño o admin. */
export const pedidosRoutes = Router();

pedidosRoutes.post('/', autenticar, autorizarRol(ROL.CLIENTE), envolverAsync(crear));
pedidosRoutes.get('/:id', autenticar, envolverAsync(obtener));
pedidosRoutes.post('/:id/pago', autenticar, autorizarRol(ROL.CLIENTE), envolverAsync(pagar));
pedidosRoutes.patch('/:id/estado', autenticar, envolverAsync(cambiarEstado));
