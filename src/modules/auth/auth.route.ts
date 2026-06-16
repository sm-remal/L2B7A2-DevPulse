import {Router} from "express"
import app from "../../app"
import { authController } from "./auth.controller";

const route = Router();

route.post("/signup", authController.signupUser);
route.post("/login", authController.loginUser);

export const authRouter = route;