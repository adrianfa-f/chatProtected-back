import { Router } from 'express';
import { register, login, logout } from '../controllers/auth.controller';
import { registerSchema, loginSchema } from '../schemas/user.schema';
import { validate } from '../middleware/validate.middleware';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', logout); // Nueva ruta para logout

export default router;