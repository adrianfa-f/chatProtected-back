import { Router } from 'express';
import { searchUsers, getUserPublicKey } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/search', searchUsers);
router.get('/:userId/public-key', getUserPublicKey);

export default router;