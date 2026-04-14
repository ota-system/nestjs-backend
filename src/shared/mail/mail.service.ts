import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import type { Queue } from "bullmq";

@Injectable()
export class MailService {
	constructor(
		@InjectQueue("mail_queue")
		private readonly mailQueue: Queue,
	) {}

	async sendVerificationEmail(email: string, fullName: string, token: string) {
		await this.mailQueue.add("sendVerificationEmail", {
			email,
			fullName,
			token,
		});
	}
}
