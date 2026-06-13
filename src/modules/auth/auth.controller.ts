import type { Request, Response } from "express";
import { authService } from "./auth.service";

const signupUser = async (req: Request, res: Response) => {
    try {
        const result = await authService.signupUserIntoDB(req.body);
        res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: result,
    });

    } catch (error: any) {
         res.status(500).json({
            success: false,
            message: error.message,
            error: error,
        })
    }
}

export const authController = {
    signupUser,
}