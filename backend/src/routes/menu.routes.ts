import { Router } from 'express';
import { ROL } from '../config/roles.js';
import { agregar, consultar, editar, eliminar, listar } from '../controllers/menu.controller.js';
import { autenticar } from '../middlewares/autenticar.js';
import { autorizarRol } from '../middlewares/autorizarRol.js';
import { envolverAsync } from '../utils/errores.js';

/** Consulta pública del menú (sin autenticación). */
export const menuPublicoRoutes = Router();

menuPublicoRoutes.get('/', envolverAsync(consultar));

/** Gestión del menú del día (solo administrador). */
export const menuAdminRoutes = Router();

menuAdminRoutes.use(autenticar, autorizarRol(ROL.ADMINISTRADOR));

menuAdminRoutes.get('/', envolverAsync(listar));
menuAdminRoutes.post('/', envolverAsync(agregar));
menuAdminRoutes.put('/:id', envolverAsync(editar));
menuAdminRoutes.delete('/:id', envolverAsync(eliminar));
