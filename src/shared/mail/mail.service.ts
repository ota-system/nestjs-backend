import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import type { ISendMailOptions } from "@nestjs-modules/mailer";
import type { Queue } from "bullmq";

@Injectable()
export class MailService {
	constructor(
		@InjectQueue("mail_queue")
		private readonly mailQueue: Queue,
	) {}

	async sendMail(payload: ISendMailOptions) {
		await this.mailQueue.add("sendMail", payload);
	}
}
