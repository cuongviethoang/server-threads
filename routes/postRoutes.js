import express from "express";
import {
    createPost,
    getPost,
    deletePost,
    likeUnlikePost,
    replyToPost,
    getFeedPosts,
    getUserPosts,
} from "../controllers/postController.js";
import protectRoute from "../middlewares/protectRoute.js";
const router = express.Router();

router.get("/feed", protectRoute, getFeedPosts);
router.get("/:postId", getPost);
router.get("/user/:username", getUserPosts);
router.delete("/:postId", protectRoute, deletePost);
router.post("/create", protectRoute, createPost);
router.put("/like/:postId", protectRoute, likeUnlikePost);
router.put("/reply/:postId", protectRoute, replyToPost);

export default router;
