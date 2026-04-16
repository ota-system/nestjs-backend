import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Queue } from "bullmq";
import { ENV_KEY } from "../constants/env.constant";

@Injectable()
export class MailService {
	constructor(
		@InjectQueue("mail_queue")
		private readonly mailQueue: Queue,
		private readonly configService: ConfigService,
	) {}

	async sendVerificationEmail(email: string, fullName: string, token: string) {
		const frontendUrl = ENV_KEY.FRONTEND_URL(this.configService);
		const url = `${frontendUrl}/auth/verify?token=${token}`;

		await this.mailQueue.add("sendVerificationEmail", {
			email,
			fullName,
			url,
		});
	}
}
