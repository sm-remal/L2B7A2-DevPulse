import bcrypt from "bcryptjs";
import { pool } from "../../db";
import type { IUser } from "./auth.interface";

const signupUserIntoDB = async (payload: IUser) => {
    const {name, email, password, role} = payload;

    // Check Email is Exist
    const isUserExist = await pool.query(`
            SELECT * FROM users WHERE email = $1
        `, [email]);

    if (isUserExist.rows.length > 0) {
        throw new Error("Email is exist !!");
    }

    // Hash Password
    const hashPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(`
            INSERT INTO users (name, email, password, role) VALUES($1, $2, $3, $4) RETURNING
            id, name, email, role, created_at, update_at
        `, [name, hashPassword, email, role]);

    return result.rows[0];
}


export const authService = {
    signupUserIntoDB,
}