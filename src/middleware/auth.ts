import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "../config";

declare global {
    namespace Express {
        interface Request {
            user: any;
        }
    }
}

const auth = (req: Request, res: Response, next: NextFunction) => {

    try {

        const token = req.headers.authorization;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized Access"
            });
        }

        const decoded = jwt.verify(
            token,
            config.jwt_secret as string
        );

        req.user = decoded;

        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid Token"
        });
    }
};

export default auth;