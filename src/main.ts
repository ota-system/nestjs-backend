import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./shared/filter/global-exception.filter";
import { CustomValidationPipe } from "./shared/pipe/custom-validation.pipe";

async function bootstrap() {
	const app = await NestFactory.create(AppModule, {
		logger: ["error", "warn", "debug"],
	});
	app.useGlobalPipes(CustomValidationPipe);
	app.useGlobalFilters(new GlobalExceptionFilter());
	await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
