import { Router } from 'express';
import { ROL } from '../config/roles.js';
import { actualizarEstado, crear, editar, listar } from '../controllers/usuarios.controller.js';
import { autenticar } from '../middlewares/autenticar.js';
import { autorizarRol } from '../middlewares/autorizarRol.js';
import { envolverAsync } from '../utils/errores.js';

export const usuariosRoutes = Router();

usuariosRoutes.use(autenticar, autorizarRol(ROL.ADMINISTRADOR));

usuariosRoutes.get('/', envolverAsync(listar));
usuariosRoutes.post('/', envolverAsync(crear));
usuariosRoutes.put('/:id', envolverAsync(editar));
usuariosRoutes.patch('/:id/estado', envolverAsync(actualizarEstado));
