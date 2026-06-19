import type { Response } from "express";

type TResponse<T> = {
    statusCode: number;
    success: boolean;
    message: string;
    data?: T;
    errors?: unknown;
}

const sendResponse = <T>(res: Response, data: TResponse<T>) => {
    const payload: Record<string, unknown> = {
        success: data.success,
        message: data.message,
    };

    if (typeof data.data !== "undefined") {
        payload.data = data.data;
    }

    if (typeof data.errors !== "undefined") {
        payload.errors = data.errors;
    }

    res.status(data.statusCode).json(payload);
}

export default sendResponse;
