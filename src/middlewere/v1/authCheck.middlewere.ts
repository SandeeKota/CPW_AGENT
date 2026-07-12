import type { UserDoc } from "../../models/v1/User.model";
import type { RouteHandler } from "../../types/express";
import { COLLECTIONS } from "../../constants/collections";
import jwt from "jsonwebtoken";

export const AuthMiddlewere = {
  checkValidUser: <RouteHandler>(async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const parts = authHeader.split(" ");

    if (parts.length < 2 || !parts[1]) {
      return res
        .status(401)
        .json({ error: "Unauthorized: Invalid token format" });
    }

    try {
      const token = parts[1];
      const decodedToken = jwt.decode(token);

      const decodedSub = decodedToken?.sub;
      if (!decodedSub) {
        return res
          .status(401)
          .json({ error: "Unauthorized: No subject in token" });
      }

      const users = await req.db.collection<any>(COLLECTIONS.users);
      const user = await users.findOne({ sub: decodedSub });

      if (!user) {
        return res
          .status(401)
          .json({ error: "Unauthorized: User not found for token" });
      }

      req.userData = user;
      next();
    } catch (error) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }
  }),

  cognitoTokenVerification: <RouteHandler>(async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res
          .status(401)
          .json({ error: "Unauthorized: No token provided" });
      }
      const parts = authHeader.split(" ");
      if (parts.length < 2 || !parts[1]) {
        return res
          .status(401)
          .json({ error: "Unauthorized: Invalid token format" });
      }
      const encodedSub = parts[1];
      const decodedToken = jwt.decode(encodedSub);
      const { sub, email } = decodedToken as jwt.JwtPayload;
      const users = req.db.collection<UserDoc>(COLLECTIONS.users);
      const user = await users.findOne({ email });
      if (!user)
        return res
          .status(401)
          .json({ error: "Unauthorized: User not found cognito" });
      req.userData = user;
      next();
    } catch (error) {
      return res
        .status(401)
        .json({ error: "Unauthorized: Invalid token format" });
    }
  }),
};
