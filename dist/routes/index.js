"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const chat_routes_1 = __importDefault(require("./chat.routes"));
const message_routes_1 = __importDefault(require("./message.routes"));
const user_routes_1 = __importDefault(require("./user.routes"));
const chatRequest_routes_1 = __importDefault(require("./chatRequest.routes"));
const apiRouter = (0, express_1.Router)();
apiRouter.use('/auth', auth_routes_1.default);
apiRouter.use('/chats', chat_routes_1.default);
apiRouter.use('/messages', message_routes_1.default);
apiRouter.use('/users', user_routes_1.default);
apiRouter.use('/chat-requests', chatRequest_routes_1.default);
exports.default = apiRouter;
