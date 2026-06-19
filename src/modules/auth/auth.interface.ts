import type { AuthRole } from "../../middleware/auth";

export interface IUser {
    name: string;
    email: string;
    password: string;
    role?: AuthRole;
}


export interface ILogin {
    email: string;
    password: string;
}

export interface IAuthUserPayload {
    id: number;
    name: string;
    role: AuthRole;
}
