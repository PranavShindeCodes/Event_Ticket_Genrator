import jwt from "jsonwebtoken";
const auth = async (req, res, next) => {
  const bearer = req.headers["authorization"]; // <-- lowercase
  if (!bearer) {
    return res.json({ message: "no token found", success: false });
  }
  const token = bearer.split(" ")[1];
  // console.log("Received token:", token);
  try {
    const isMatch = jwt.verify(token, "!@#$");
    req.user = isMatch;
    next();
  } catch (err) {
    return res.json({ message: "invalid token", success: false });
  }
};
export default auth;
