import { UserRole } from "./user-role.enum";
export type JwtPayload = {
	sub: string;
	email: string;
	role: UserRole;

	sid: string;
	exp: number;
	iat: number;
};
