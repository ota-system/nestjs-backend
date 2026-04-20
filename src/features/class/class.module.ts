import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserEntity } from "../auth/entities/user.entity";
import { ClassController } from "./class.controller";
import { ClassService } from "./class.service";
import { Class } from "./entities/class.entity";

@Module({
	imports: [TypeOrmModule.forFeature([Class, UserEntity])],
	controllers: [ClassController],
	providers: [ClassService],
})
export class ClassModule {}
