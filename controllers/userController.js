import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import generateTokenAndSetCookie from "../utils/helpers/generateTokenAndSetCookie.js";

const signupUser = async (req, res) => {
    try {
        const { name, email, username, password } = req.body;
        const user = await User.findOne({ $or: [{ email }, { username }] });

        if (user) {
            return res.status(400).json({ message: "User already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            name,
            email,
            username,
            password: hashedPassword,
        });
        await newUser.save();

        if (newUser) {
            generateTokenAndSetCookie(newUser._id, res);
            return res.status(201).json({
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                username: newUser.username,
            });
        } else {
            return res.status(400).json({
                message: "Invalid user data",
            });
        }
    } catch (e) {
        return res.status(500).json({ message: e.message });
        console.log("Error in signupUser: ", e.message);
    }
};

const loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        const isPasswordCorrect = await bcrypt.compare(
            password,
            user?.password || ""
        );

        if (!user || !isPasswordCorrect) {
            return res
                .status(400)
                .json({ message: "Invalid username or password" });
        }

        generateTokenAndSetCookie(user._id, res);

        return res.status(200).json({
            _id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
        });
    } catch (e) {
        console.log("Error in loginUser: ", e.message);
        return res.status(500).json({ message: e.message });
    }
};

const logoutUser = async (req, res) => {
    try {
        res.cookie("jwt", "", { maxAge: 1 });
        res.status(200).json({ message: "User logged out successfully" });
    } catch (e) {
        console.log("Error in logoutUser: ", e.message);
        return res.status(500).json({ message: e.message });
    }
};

const followUnFollowUser = async (req, res) => {
    try {
        const { id } = req.params;

        // lấy ra thông tin cảu họ
        const userToModify = await User.findById(id);

        // lấy ra thông tin của chính mình
        const currentUser = await User.findById(req.user._id);

        if (id === req.user._id.toString()) {
            return res
                .status(400)
                .json({ error: "You cannot follow/unfollow yourself" });
        }

        if (!userToModify || !currentUser) {
            return res.status(400).json({ error: "User not found" });
        }

        const isFollowing = currentUser.following.includes(id);

        // console.log(isFollowing);

        if (isFollowing) {
            // bỏ follow người mà ta đang theo dõi, dùng $pull để loại bỏ id đó khỏi mảng following
            await User.findByIdAndUpdate(req.user._id, {
                $pull: { following: id },
            });
            // bỏ follow của người được followers
            await User.findByIdAndUpdate(id, {
                $pull: { followers: req.user._id },
            });

            res.status(200).json({ message: "User unfollowed successfully" });
        } else {
            // Follow user dùng push để thêm 1 giá trị đặc vào mảng
            // thêm id của người được follow vào mảng following của mình
            await User.findByIdAndUpdate(req.user._id, {
                $push: { following: id },
            });
            // thêm id của mình follow đó vào mảng followers của họ
            await User.findByIdAndUpdate(id, {
                $push: { followers: req.user._id },
            });
            res.status(200).json({ message: "User followed successfully" });
        }
    } catch (e) {
        console.log("Error followUnFollowUser: ", e.message);
        return res.status(500).json({ message: e.message });
    }
};

export { signupUser, loginUser, logoutUser, followUnFollowUser };
