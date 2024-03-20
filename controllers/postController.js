import Post from "../models/postModel.js";
import User from "../models/userModel.js";
import { v2 as cloudinary } from "cloudinary";

const createPost = async (req, res) => {
    try {
        const { postedBy, text } = req.body;
        let { img } = req.body;

        if (!postedBy || !text) {
            return res
                .status(400)
                .json({ error: "Postedby and text fields are required" });
        }

        const user = await User.findById(postedBy);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (user._id.toString() !== req.user._id.toString()) {
            return res
                .status(401)
                .json({ error: "Please login to create post" });
        }

        const maxLength = 500;
        if (text.length > maxLength) {
            return res.status(400).json({
                error: `Text must be less than ${maxLength} characters`,
            });
        }

        // nếu có ảnh gửi lúc đăng post sẽ được đưa lên cloud, rồi cloud gửi url về
        if (img) {
            const uploadedResponse = await cloudinary.uploader.upload(img);
            img = uploadedResponse.secure_url;
        }

        const newPost = new Post({ postedBy, text, img });

        await newPost.save();
        return res
            .status(201)
            .json({ message: "Post created successfully", newPost });
    } catch (e) {
        console.log("Error createPost: ", e.message);
        return res.status(500).json({ error: e.message });
    }
};

const getPost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);

        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        res.status(200).json({ post });
    } catch (e) {
        console.log("Error getPost: ", e.message);
        return res.status(500).json({ error: e.message });
    }
};

const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);

        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        if (post.postedBy.toString() !== req.user._id.toString()) {
            return res
                .status(401)
                .json({ error: "Please login to use function here!" });
        }

        await Post.findByIdAndDelete(req.params.postId);

        return res.status(200).json({ message: "Post deleted successfully!" });
    } catch (e) {
        console.log("Error deletePost: ", e.message);
        return res.status(500).json({ error: e.message });
    }
};

const likeUnlikePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user._id;

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(400).json({ error: "Post not found!" });
        }

        // kiểm tra xem cái pót này ta đã like hay chưa
        const userLikedPost = post.likes.includes(userId);

        if (userLikedPost) {
            // loại bỏ userId ra khỏi mảng likes (là mảng chứa tất cả các id user đã like bài post)
            await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
            return res
                .status(200)
                .json({ message: "Post unliked successfully" });
        } else {
            // post.likes.push(userId);
            // await post.save();
            await Post.findByIdAndUpdate(postId, { $push: { likes: userId } });
            res.status(200).json({ message: "Post liked successfully" });
        }
    } catch (e) {
        console.log("Error likeUnlikePost: ", e.message);
        return res.status(500).json({ error: e.message });
    }
};

const replyToPost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { text } = req.body;
        const userId = req.user._id;
        const userProfilePic = req.user.profilePic;
        const username = req.user.username;

        if (!text) {
            return res.status(400).json({ error: "Text field is required" });
        }

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        const reply = { userId, text, userProfilePic, username };

        post.replies.push(reply);
        await post.save();
        return res
            .status(200)
            .json({ message: "Reply added successfully", post });
    } catch (e) {
        console.log("Error replyToPost: ", e.message);
        return res.status(500).json({ error: e.message });
    }
};

// lấy ra tất cả bài post của user mà ta đang following
const getFeedPosts = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        // lấy ra mảng chứa tất cả id của người dùng mà ta đang follow
        const following = user.following;

        // $in dùng để so sánh giá trị cần so sánh với 1 danh sách các giá trị được so sánh với
        // như trong hàm này thì giá trị cần so sánh là : postedBy, danh sách được so sánh : following
        // tìm tất cả các bài post có postedBy(id của người đăng post) ở trong mảng following mà t đang theo dõi
        const feedPosts = await Post.find({
            postedBy: { $in: following },
        }).sort({ createdAt: -1 });

        return res.status(200).json(feedPosts);
    } catch (e) {
        console.log("Error getFeedPosts: ", e.message);
        return res.status(500).json({ error: e.message });
    }
};

export {
    createPost,
    getPost,
    deletePost,
    likeUnlikePost,
    replyToPost,
    getFeedPosts,
};
