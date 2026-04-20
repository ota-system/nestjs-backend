import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ClassController } from "./class.controller";
import { ClassService } from "./class.service";
import { ClassEntity } from "./entities/class.entity";

@Module({
	imports: [TypeOrmModule.forFeature([ClassEntity])],
	controllers: [ClassController],
	providers: [ClassService],
})
export class ClassModule {}
