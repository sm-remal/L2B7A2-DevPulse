import type { Request, Response } from "express";
import { authService } from "./auth.service";
import sendResponse from "../../utility/sendResponse";
import { RESPONSE_MESSAGES } from "../../utility/responseMessages";

// Signup
const signupUser = async (req: Request, res: Response) => {
    const result = await authService.signupUserIntoDB(req.body);

    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: RESPONSE_MESSAGES.auth.signupSuccess,
        data: result,
    })
}

// Login
const loginUser = async (req: Request, res: Response) => {
    const result = await authService.loginUserIntoDB(req.body);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: RESPONSE_MESSAGES.auth.loginSuccess,
        data: result,
    })
}

export const authController = {
    signupUser,
    loginUser,
}
