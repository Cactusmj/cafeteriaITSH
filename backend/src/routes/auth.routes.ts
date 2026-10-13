import { Router } from 'express';
import { cerrarSesion, iniciar, registrar, yo } from '../controllers/auth.controller.js';
import { autenticar } from '../middlewares/autenticar.js';
import { envolverAsync } from '../utils/errores.js';

export const authRoutes = Router();

authRoutes.post('/register', envolverAsync(registrar));
authRoutes.post('/login', envolverAsync(iniciar));
authRoutes.get('/me', autenticar, envolverAsync(yo));
authRoutes.post('/logout', autenticar, cerrarSesion);
