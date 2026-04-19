import * as path from "node:path";
import { ConfigService } from "@nestjs/config";
import { HandlebarsAdapter } from "@nestjs-modules/mailer/adapters/handlebars.adapter";
import { ENV_KEY } from "../constants/env.constant";

export const getMailerConfig = (configService: ConfigService) => ({
	transport: {
		host: ENV_KEY.MAIL_HOST(configService),
		secure: true,
		auth: {
			user: ENV_KEY.MAIL_USER(configService),
			pass: ENV_KEY.MAIL_PASS(configService),
		},
	},
	defaults: {
		from: ENV_KEY.MAIL_FROM(configService),
	},
	template: {
		dir: path.join(process.cwd(), "dist/templates"),
		adapter: new HandlebarsAdapter(),
		options: {
			strict: true,
		},
	},
});
