import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { MailerService } from "@nestjs-modules/mailer";
import type { Job } from "bullmq";

const EMAIL_SUBJECTS: Record<string, string> = {
	sendVerificationEmail: "Xác thực tài khoản OTA-Hub",
	resetPassword: "Đặt lại mật khẩu của bạn",
};

const EMAIL_TEMPLATES: Record<string, string> = {
	sendVerificationEmail: "verification",
	resetPassword: "resetPassword",
};

@Processor("mail_queue")
export class MailProcessor extends WorkerHost {
	private readonly logger = new Logger(MailProcessor.name);

	constructor(private readonly mailerService: MailerService) {
		super();
	}

	async process(job: Job<any, any, string>): Promise<any> {
		const { email, fullName, ...otherData } = job.data;

		const context: Record<string, any> = {
			name: fullName,
			...otherData,
		};

		this.logger.log(`Processing mail job: ${job.name}`, { email });

		try {
			await this.mailerService.sendMail({
				to: email,
				subject: EMAIL_SUBJECTS[job.name] ?? "Thông báo từ OTA-Hub",
				template: `./${EMAIL_TEMPLATES[job.name] ?? job.name}`,
				context,
			});
		} catch (error) {
			this.logger.error(
				`Failed to send email for job "${job.name}"`,
				error.stack,
			);
			throw error;
		}
	}
}
