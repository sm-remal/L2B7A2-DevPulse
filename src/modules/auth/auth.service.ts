import bcrypt from "bcryptjs";
import type { ILogin, IUser } from "./auth.interface";
import config from "../../config";
import jwt from "jsonwebtoken";
import AppError from "../../utility/AppError";
import { userService } from "../user/user.service";
import type { IPublicUser } from "../user/user.interface";
import { pool } from "../../db";

// Signup
const signupUserIntoDB = async (payload: IUser): Promise<IPublicUser> => {
    const { name, email, password, role } = payload;

    if (!name?.trim()) {
        throw new AppError(400, "Name is required");
    }

    if (!email?.trim()) {
        throw new AppError(400, "Email is required");
    }

    if (!password) {
        throw new AppError(400, "Password is required");
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        throw new AppError(400, "Invalid email address");
    }

    const normalizedRole = role ?? "contributor";

    if (normalizedRole !== "contributor" && normalizedRole !== "maintainer") {
        throw new AppError(400, "Invalid role");
    }

    // Check Email is Exist
    const isUserExist = await userService.findUserByEmail(normalizedEmail);

    if (isUserExist) {
        throw new AppError(409, "Email already exists");
    }

    // Hash Password
    const hashPassword = await bcrypt.hash(password, 10);

    const result = await pool.query<IPublicUser>(
        `
            INSERT INTO users (name, email, password, role)
            VALUES($1, $2, $3, $4)
            RETURNING id, name, email, role, created_at, updated_at
        `,
        [name.trim(), normalizedEmail, hashPassword, normalizedRole]
    );

    const createdUser = result.rows[0];
    if (!createdUser) {
        throw new AppError(500, "Failed to register user");
    }

    return createdUser;
}



// Login
const loginUserIntoDB = async (payload: ILogin) => {

    const { email, password } = payload;
    if (!email?.trim() || !password) {
        throw new AppError(400, "Email and password are required");
    }

    const user = await userService.findUserByEmail(email.trim().toLowerCase());
    if (!user) {
        throw new AppError(401, "Invalid credentials");
    }

    const isPasswordMatch = await bcrypt.compare(
        password,
        user.password
    );

    if (!isPasswordMatch) {
        throw new AppError(401, "Invalid credentials");
    }

    const token = jwt.sign(
        {
            id: user.id,
            name: user.name,
            role: user.role
        },
        config.jwt_secret,
        {
            expiresIn: "7d"
        }
    );

    return {
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            created_at: user.created_at,
            updated_at: user.updated_at
        }
    };
};



export const authService = {
    signupUserIntoDB,
    loginUserIntoDB,
}
