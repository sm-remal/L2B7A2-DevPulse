import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import config from "../config";
import AppError from "../utility/AppError";

export type AuthRole = "contributor" | "maintainer";

export interface AuthTokenPayload extends JwtPayload {
    id: number;
    name: string;
    role: AuthRole;
}

declare global {
    namespace Express {
        interface Request {
            user: AuthTokenPayload;
        }
    }
}

const auth = (req: Request, res: Response, next: NextFunction) => {
    try {
        const header = req.headers.authorization;
        const token = header?.startsWith("Bearer ") ? header.slice(7) : header;

        if (!token) {
            throw new AppError(401, "Unauthorized");
        }

        const decoded = jwt.verify(token, config.jwt_secret) as AuthTokenPayload;
        req.user = decoded;
        next();
    } catch {
        next(new AppError(401, "Unauthorized"));
    }
};

export default auth;
