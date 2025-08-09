import { Router } from 'express';
import { createCalls, getCalls, getMissedCount, markAsSeen } from '../controllers/call.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router()

router.use(authenticate)

router.post('/', createCalls)
router.get('/', getCalls)
router.get('/missed-count', getMissedCount)
router.put('/mark-seen', markAsSeen)

export default router;