import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MailerModule } from "@nestjs-modules/mailer";
import { MailProcessor } from "./mail/mail.processor";
import { MailService } from "./mail/mail.service";
import { RedisService } from "./redis/redis.service";
import { AiTokenService } from "./services/ai-token.service";
import { PdfParserService } from "./services/pdf-parser.service";

@Module({
	imports: [
		ConfigModule,
		MailerModule,
		BullModule.registerQueue({
			name: "mail_queue",
		}),
	],
	providers: [
		MailService,
		RedisService,
		MailProcessor,
		AiTokenService,
		PdfParserService,
	],
	exports: [RedisService, MailService, AiTokenService, PdfParserService],
})
export class SharedModule {}
