import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    },
});

const userSocketMap = {}; // userIdL socketId
// mỗi 1 người khi connect vào web sẽ có 1 socketId riêng
io.on("connection", (socket) => {
    console.log("User connected: ", socket.id);

    // lấy ra userId ở trên FE gửi
    const userId = socket.handshake.query.userId;
    if (userId != "undefined") userSocketMap[userId] = socket.id;
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
    socket.on("disconnect", () => {
        console.log("User disconnect: ", socket.id);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
});

export { io, server, app };
