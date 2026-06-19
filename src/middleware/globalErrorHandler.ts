import type { NextFunction, Request, Response } from "express";
import AppError from "../utility/AppError";

const globalErrorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
        return next(err);
    }

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errors: err.errors,
        });
    }

    const message = err instanceof Error ? err.message : "Internal Server Error";

    return res.status(500).json({
        success: false,
        message,
    });
}

export default globalErrorHandler;
