import { pool } from "../../db";
import type { IUserReporter, IUserRow } from "./user.interface";

const findUserByEmail = async (email: string): Promise<IUserRow | null> => {
    const result = await pool.query<IUserRow>(
        `SELECT id, name, email, password, role, created_at, updated_at FROM users WHERE email = $1`,
        [email]
    );

    return result.rows[0] ?? null;
};

const findUserById = async (id: number): Promise<IUserRow | null> => {
    const result = await pool.query<IUserRow>(
        `SELECT id, name, email, password, role, created_at, updated_at FROM users WHERE id = $1`,
        [id]
    );

    return result.rows[0] ?? null;
};

const findUsersByIds = async (ids: number[]): Promise<IUserReporter[]> => {
    if (ids.length === 0) {
        return [];
    }

    const result = await pool.query<IUserReporter>(
        `SELECT id, name, role FROM users WHERE id = ANY($1::int[])`,
        [ids]
    );

    return result.rows;
};

export const userService = {
    findUserByEmail,
    findUserById,
    findUsersByIds,
};
