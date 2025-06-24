"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChatMessages = exports.sendMessage = void 0;
const http_status_codes_1 = require("http-status-codes");
const message_service_1 = __importDefault(require("../services/message.service"));
const sendMessage = async (req, res) => {
    try {
        const userId = req.body.userId;
        const { chatId, receiverId, ciphertext, nonce } = req.body;
        const message = await message_service_1.default.createMessage(chatId, userId, receiverId, ciphertext, nonce);
        res.status(http_status_codes_1.StatusCodes.CREATED).json({
            success: true,
            data: message
        });
    }
    catch (error) {
        res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
            success: false,
            error: error.message
        });
    }
};
exports.sendMessage = sendMessage;
const getChatMessages = async (req, res) => {
    try {
        const { chatId } = req.params;
        const messages = await message_service_1.default.getMessagesByChat(chatId);
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: messages
        });
    }
    catch (error) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: error.message
        });
    }
};
exports.getChatMessages = getChatMessages;
