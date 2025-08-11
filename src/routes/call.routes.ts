import { Router } from 'express';
import { getCalls, getMissedCount, markAsSeen } from '../controllers/call.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router()

router.use(authenticate)

router.get('/', getCalls)
router.get('/missed-count', getMissedCount)
router.put('/mark-seen', markAsSeen)

export default router;