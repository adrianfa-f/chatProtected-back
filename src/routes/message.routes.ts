import { Router } from 'express';
import { sendMessage, getChatMessages } from '../controllers/message.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { sendMessageSchema } from '../schemas/message.schema'

const router = Router();

router.use(authenticate);

router.post('/', validate(sendMessageSchema), sendMessage);
router.get('/:chatId', getChatMessages);

export default router;