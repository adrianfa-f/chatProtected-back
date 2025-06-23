import { Router } from 'express';
import { getUserChats } from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/', getUserChats);

export default router;