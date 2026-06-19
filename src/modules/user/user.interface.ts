import type { AuthRole } from "../../middleware/auth";

export interface IUserRow {
    id: number;
    name: string;
    email: string;
    password: string;
    role: AuthRole;
    created_at: Date;
    updated_at: Date;
}

export interface IPublicUser {
    id: number;
    name: string;
    email: string;
    role: AuthRole;
    created_at: Date;
    updated_at: Date;
}

export interface IUserReporter {
    id: number;
    name: string;
    role: AuthRole;
}
