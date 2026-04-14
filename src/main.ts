import { ClassSerializerInterceptor } from "@nestjs/common";
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

	app.enableCors({
		origin: "http://localhost:5173",
		preflightContinue: false,
		optionsSuccessStatus: 204,
		credentials: true,
		allowedHeaders: "Content-Type, Accept, Authorization",
	});

	// 1. Swagger Setup
	const config = new DocumentBuilder()
		.setTitle("OTA API")
		.setDescription("The OTA API documentation")
		.setVersion("1.0")
		.addBearerAuth()
		.build();

	const document = SwaggerModule.createDocument(app, config);
	// Go to http://localhost:3000/swagger-ui to see the Swagger UI with persistAuthorization enabled
	SwaggerModule.setup("swagger-ui", app, document, {
		swaggerOptions: {
			persistAuthorization: true,
		},
	});

	app.useGlobalPipes(CustomValidationPipe);

	const i18n = app.get<I18nService<Record<string, unknown>>>(I18nService);
	app.useGlobalFilters(new GlobalExceptionFilter(i18n));

	app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

	await app.listen(3000);
}
bootstrap();
