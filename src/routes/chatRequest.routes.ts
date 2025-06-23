import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { acceptChatRequest, createChatRequest, getChatRequests } from "../controllers/chatRequest.controller";
import { validate } from "../middleware/validate.middleware";
import { createRequestShema } from "../schemas/chatRequest.shema";


const router = Router();

router.use(authenticate)
router.get('/', getChatRequests);
router.post('/', validate(createRequestShema), createChatRequest)
router.patch('/:chatRequestId', acceptChatRequest);

export default router;