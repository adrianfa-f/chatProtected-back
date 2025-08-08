import { Router } from 'express';
import { createCalls, getCalls } from '../controllers/call.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router()

router.use(authenticate)

router.post('/', createCalls)
router.get('/', getCalls)

export default router;