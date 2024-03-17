import User from "../models/userModel.js";
import jwt from "jsonwebtoken";

const protectRoute = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;

        if (!token) {
            return res
                .status(401)
                .json({ message: "Please login to use function here!" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId).select("-password");

        req.user = user;

        next();
    } catch (e) {
        console.log("Error protectRoute: ", e.message);
        return res.status(500).json({ message: e.message });
    }
};

export default protectRoute;
