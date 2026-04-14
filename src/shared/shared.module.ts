import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MailProcessor } from "./mail/mail.processor";
import { MailService } from "./mail/mail.service";
import { RedisService } from "./redis/redis.service";

@Module({
	imports: [
		ConfigModule,
		BullModule.registerQueue({
			name: "mail_queue",
		}),
	],
	providers: [MailService, RedisService, MailProcessor],
	exports: [RedisService, MailService],
})
export class SharedModule {}
