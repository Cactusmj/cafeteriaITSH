import { Router } from 'express';
import { ROL } from '../config/roles.js';
import {
  actualizarEstado,
  crear,
  editar,
  listar,
} from '../controllers/platillos.controller.js';
import { autenticar } from '../middlewares/autenticar.js';
import { autorizarRol } from '../middlewares/autorizarRol.js';
import { envolverAsync } from '../utils/errores.js';

export const platillosRoutes = Router();

platillosRoutes.use(autenticar, autorizarRol(ROL.ADMINISTRADOR));

platillosRoutes.get('/', envolverAsync(listar));
platillosRoutes.post('/', envolverAsync(crear));
platillosRoutes.put('/:id', envolverAsync(editar));
platillosRoutes.patch('/:id/estado', envolverAsync(actualizarEstado));
