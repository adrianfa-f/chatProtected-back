import { Router } from 'express';
import authRouter from './auth.routes';
import chatRouter from './chat.routes';
import messageRouter from './message.routes';
import userRouter from './user.routes';
import chatRequestRouter from './chatRequest.routes';
import callRouter from './call.routes'

const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/chats', chatRouter);
apiRouter.use('/messages', messageRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/chat-requests', chatRequestRouter);
apiRouter.use('/calls', callRouter)

export default apiRouter;