import Conversation from "../models/conversationModel.js";
import Message from "../models/messageModel.js";
import { getRecipientSocketId, io } from "../socket/socket.js";

const sendMessage = async (req, res) => {
    try {
        const { recipientId, message } = req.body;
        const senderId = req.user?._id;

        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, recipientId] },
        });

        if (!conversation) {
            conversation = new Conversation({
                participants: [senderId, recipientId],
                lastMessage: {
                    text: message,
                    sender: senderId,
                },
            });

            await conversation.save();
        }

        const newMessage = new Message({
            conversationId: conversation?._id,
            sender: senderId,
            text: message,
        });

        await Promise.all([
            newMessage.save(),
            conversation.updateOne({
                lastMessage: {
                    text: message,
                    sender: senderId,
                },
            }),
        ]);

        const recipientSocketId = getRecipientSocketId(recipientId);
        if (recipientSocketId) {
            io.to(recipientSocketId).emit("newMessage", newMessage);
        }

        return res.status(201).json(newMessage);
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};

const getMessages = async (req, res) => {
    const { otherUserId } = req.params;
    const userId = req.user?._id;
    try {
        const conversation = await Conversation.findOne({
            participants: { $all: [userId, otherUserId] },
        });

        if (!conversation) {
            return res.status(404).json({ error: "Conversation not found" });
        }

        const messages = await Message.find({
            conversationId: conversation._id,
        }).sort({ createAt: 1 });

        return res.status(200).json(messages);
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};

const getConversations = async (req, res) => {
    const userId = req.user?._id;
    try {
        const conversations = await Conversation.find({
            participants: userId,
        })
            .populate({
                path: "participants",
                select: "username profilePic",
            })
            .sort({ updatedAt: -1 });

        // chỉ lấy các thuộc tính user người nhận trong participants
        conversations.forEach((conversation) => {
            conversation.participants = conversation.participants.filter(
                (participant) =>
                    participant?._id.toString() !== userId.toString()
            );
        });
        return res.status(200).json(conversations);
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};

export { sendMessage, getMessages, getConversations };
