import type { Request } from "express";

export type JwtRequest = Request & {
	user: {
		sub: string;
		email: string;
		role: string;
		sid: string;
		exp: number;
	};
};

export type RefreshJwtPayload = {
	sub: string;
	sid: string;
};

export type AccessJwtPayload = {
	sub: string;
	email: string;
	role: string;
	sid: string;
	exp: number;
};
