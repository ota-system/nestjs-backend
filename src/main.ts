import { ClassSerializerInterceptor, VersioningType } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory, Reflector } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { I18nService } from "nestjs-i18n";
import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./shared/filter/global-exception.filter";
import { CustomValidationPipe } from "./shared/pipe/custom-validation.pipe";

async function bootstrap() {
	const app = await NestFactory.create(AppModule, {
		logger: ["error", "warn", "debug", "log"],
	});
	const configService = app.get(ConfigService);

	const origins = configService.get<string>("CORS_ORIGINS");
	const allowedOrigins = origins?.split(",") || ["http://localhost:5173"];

	// Global prefix & versioning
	app.setGlobalPrefix("api");
	app.enableVersioning({ type: VersioningType.URI });

	app.enableCors({
		origin: allowedOrigins,
		preflightContinue: false,
		optionsSuccessStatus: 204,
		credentials: true,
		allowedHeaders: "Content-Type, Accept, Authorization",
	});

	// Swagger
	const config = new DocumentBuilder()
		.setTitle("OTA API")
		.setDescription("The OTA API documentation")
		.setVersion("1.0")
		.addBearerAuth()
		.build();

	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup("swagger-ui", app, document, {
		swaggerOptions: { persistAuthorization: true },
	});

	app.useGlobalPipes(CustomValidationPipe);
	app.enableShutdownHooks();
	const i18n = app.get<I18nService<Record<string, unknown>>>(I18nService);
	app.useGlobalFilters(new GlobalExceptionFilter(i18n));
	app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

	await app.listen(3000);
}
bootstrap();
