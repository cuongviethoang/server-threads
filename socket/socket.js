import { Server } from "socket.io";
import http from "http";
import express from "express";
import Message from "../models/messageModel.js";
import Conversation from "../models/conversationModel.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    },
});

export const getRecipientSocketId = (recipientId) => userSocketMap[recipientId];

const userSocketMap = {}; // userIdL socketId
// mỗi 1 người khi connect vào web sẽ có 1 socketId riêng
io.on("connection", (socket) => {
    console.log("User connected: ", socket.id);

    // lấy ra userId ở trên FE gửi
    const userId = socket.handshake.query.userId;
    if (userId != "undefined") userSocketMap[userId] = socket.id;
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    // khi người nhận tin nhắn click vào conversation trên BE
    // sẽ bắt đi 1 event là markMessageSeen
    socket.on("markMessagesSeen", async ({ conversationId, userId }) => {
        try {
            await Message.updateMany(
                { conversationId: conversationId, seen: false },
                {
                    $set: {
                        seen: true,
                    },
                }
            );

            await Conversation.updateOne(
                { _id: conversationId },
                {
                    $set: {
                        "lastMessage.seen": true,
                    },
                }
            );
            io.to(userSocketMap[userId]).emit("messagesSeen", {
                conversationId,
            });
        } catch (e) {
            console.log(e.message);
        }
    });

    socket.on("disconnect", () => {
        console.log("User disconnect: ", socket.id);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
});

export { io, server, app };
