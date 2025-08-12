import { Router } from 'express';
import { createLinkHandler, getFilesHandler, uploadHandler } from "../controllers/upload.controller";
import { uploadMiddleware } from "../middleware/upload.middleware";

const router = Router();

router.post("/", uploadMiddleware, uploadHandler);
router.post("/link", createLinkHandler);
router.get("/:chatId", getFilesHandler);

export default router;