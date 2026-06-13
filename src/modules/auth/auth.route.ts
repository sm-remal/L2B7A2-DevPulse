import {Router} from "express"
import app from "../../app"
import { authController } from "./auth.controller";

const route = Router();

route.use("/signup", authController.signupUser);

export const authRouter = route;