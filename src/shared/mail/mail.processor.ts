import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { ISendMailOptions, MailerService } from "@nestjs-modules/mailer";
import type { Job } from "bullmq";

@Processor("mail_queue")
export class MailProcessor extends WorkerHost {
	private readonly logger = new Logger(MailProcessor.name);

	constructor(private readonly mailerService: MailerService) {
		super();
	}

	async process(job: Job<ISendMailOptions, any, string>): Promise<any> {
		const to =
			typeof job.data.to === "string"
				? job.data.to
				: JSON.stringify(job.data.to);
		this.logger.log(`Sending job to handle: ${job.name} (Send to: ${to})`);

		try {
			await this.mailerService.sendMail(job.data);
			this.logger.log(`Successfully sent email: ${job.name} (Send to: ${to})`);
		} catch (error) {
			this.logger.error(
				`Failed to send email for job "${job.name}" (Send to: ${to})`,
				error.stack,
			);
			throw error;
		}
	}
}
