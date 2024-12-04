const jwt = require('jsonwebtoken');

const verifyAdminToken = (req, res, next) => {

    const authHeader = req.headers['authorization'];

    if(!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(403).json({message:"Access denied. No token provided"})
    }


    const token = authHeader.split(" ")[1];

    if (!token) {
        return res.status(403).json({ message: "Access denied. No token provided." });
    }

    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        if(decodedToken.role && decodedToken.role === 'admin'){
            req.admin = decodedToken;
            next();
        }else{
            return res.status(401).json("Unauthorized. Admin access required.")
        }

    } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token." });
    }
};

module.exports = verifyAdminToken;