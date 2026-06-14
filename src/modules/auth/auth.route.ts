import {Router} from "express"
import app from "../../app"
import { authController } from "./auth.controller";

const route = Router();

route.use("/signup", authController.signupUser);
route.use("/login", authController.loginUser);

export const authRouter = route;