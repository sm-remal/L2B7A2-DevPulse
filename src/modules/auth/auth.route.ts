import {Router} from "express"
import { authController } from "./auth.controller";
import asyncHandler from "../../utility/asyncHandler";

const route = Router();

route.post("/signup", asyncHandler(authController.signupUser));
route.post("/login", asyncHandler(authController.loginUser));

export const authRouter = route;
