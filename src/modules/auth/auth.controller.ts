import type { Request, Response } from "express";
import { authService } from "./auth.service";
import sendResponse from "../../utility/sendResponse";

// Signup
const signupUser = async (req: Request, res: Response) => {
    try {
        const result = await authService.signupUserIntoDB(req.body);
     
        sendResponse(res, {
            statusCode: 201,
            success: true,
            message: "User registered successfully",
            data: result,
        })

    } catch (error: any) {
       
        sendResponse(res, {
            statusCode: 500,
            success: false,
            message: error.message,
            error: error,
        })
    }
}

// Login
const loginUser = async (req: Request, res: Response) => {
    try {
        const result = await authService.loginUserIntoDB(req.body);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Login successful",
            data: result,
        })

    } catch (error: any) {
        
        sendResponse(res, {
            statusCode: 500,
            success: false,
            message: error.message,
            error: error,
        })
    }
}

export const authController = {
    signupUser,
    loginUser,
}