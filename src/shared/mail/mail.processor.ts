// shared/mail/mail.processor.ts

import { Processor, WorkerHost } from "@nestjs/bullmq";
import type { ConfigService } from "@nestjs/config";
import type { MailerService } from "@nestjs-modules/mailer";
import type { Job } from "bullmq";
import { ENV_KEY } from "../constants/env.constant";

@Processor("mail_queue")
export class MailProcessor extends WorkerHost {
	constructor(
		private readonly mailerService: MailerService,
		private readonly configService: ConfigService,
	) {
		super();
	}

	async process(job: Job<any, any, string>): Promise<any> {
		switch (job.name) {
			case "sendVerificationEmail": {
				const { email, fullName, token } = job.data;
				const frontendUrl = ENV_KEY.FRONTEND_URL(this.configService);
				const verificationUrl = `${frontendUrl}/auth/verify?token=${token}`;
				await this.mailerService.sendMail({
					to: email,
					subject: "Xác thực tài khoản OTA-Hub",
					template: "./verification",
					context: { name: fullName, url: verificationUrl },
				});
				break;
			}
		}
	}
}
