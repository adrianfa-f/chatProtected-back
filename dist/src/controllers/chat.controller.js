"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserChats = exports.createChat = void 0;
const http_status_codes_1 = require("http-status-codes");
const chat_service_1 = require("../services/chat.service");
const createChat = async (req, res) => {
    try {
        const userId = req.body.userId;
        const { otherUserId } = req.body;
        const chat = await chat_service_1.ChatService.createChat(userId, otherUserId);
        res.status(http_status_codes_1.StatusCodes.CREATED).json({
            success: true,
            data: chat
        });
    }
    catch (error) {
        res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
            success: false,
            error: error.message
        });
    }
};
exports.createChat = createChat;
const getUserChats = async (req, res) => {
    try {
        const userId = req.body.userId;
        const chats = await chat_service_1.ChatService.getUserChats(userId);
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: chats
        });
    }
    catch (error) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: error.message
        });
    }
};
exports.getUserChats = getUserChats;
