import express from "express";
import {
    createPost,
    getPost,
    deletePost,
    likeUnlikePost,
    replyToPost,
    getFeedPosts,
} from "../controllers/postController.js";
import protectRoute from "../middlewares/protectRoute.js";
const router = express.Router();

router.get("/feed", protectRoute, getFeedPosts);
router.get("/:postId", getPost);
router.delete("/:postId", protectRoute, deletePost);
router.post("/create", protectRoute, createPost);
router.post("/like/:postId", protectRoute, likeUnlikePost);
router.post("/reply/:postId", protectRoute, replyToPost);

export default router;
