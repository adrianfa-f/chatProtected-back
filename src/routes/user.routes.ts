import { Router } from 'express';
import { searchUsers, getUserPublicKey } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { subscribeUser } from '../controllers/notificationController';

const router = Router();

router.use(authenticate);

router.get('/search', searchUsers);
router.get('/:userId/public-key', getUserPublicKey);
router.post('/subscribe-push', subscribeUser);

export default router;