import jwt from "jsonwebtoken";

const generateTokenAndSetCookie = (userId, res) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: "15d",
    });

    res.cookie("jwt", token, {
        httpOnly: true, // Một HttpOnly session cookie sẽ chỉ được sử dụng trong một HTTP (hoặc HTTPS) request, do đó hạn chế bị truy cập bởi các non-HTTP APIs chẳng hạn Javascript
        maxAge: 15 * 24 * 60 * 60 * 1000,
        sameSite: "strict", // CSRF,
    });

    return token;
};

export default generateTokenAndSetCookie;
