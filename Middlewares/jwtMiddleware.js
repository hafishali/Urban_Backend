const jwt = require('jsonwebtoken');

const verifyAdminToken = (allowedRoles = []) => {

  return (req, res, next) => {

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
        
        // If roles are provided, ensure the user has one of them
        if (allowedRoles.length && !allowedRoles.includes(decodedToken.role)) {
            return res.status(401).json({ message: "Unauthorized. Access denied." });
        }

        req.user = decodedToken; // Attach decoded data to request
        next();

    } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token." });
    }
};
};

module.exports = verifyAdminToken;