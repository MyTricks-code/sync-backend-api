import jwt from 'jsonwebtoken';

const userAuth = async (req, res, next) => {
    let token = req.cookies?.token;

    if (!token) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.slice(7);
        }
    }

    if (!token) {
        return res.json({
            success: false,
            message: "Not Authorized. Login Again"
        });
    }

    try {
        const decodeToken = jwt.verify(token, process.env.JWT_SECRET);
        if (decodeToken.id) {
            req.userId = decodeToken.id;
        } else {
            return res.json({
                success: false,
                message: "Not Authorized. Login Again"
            });
        }
        next();
    } catch (err) {
        return res.json({
            success: false,
            message: err.message
        });
    }
};

export default userAuth;
