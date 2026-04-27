import { config } from "dotenv";
import { DataSource, type DataSourceOptions } from "typeorm";

config();
export const dataSourceOptions: DataSourceOptions = {
	type: "postgres",
	host: process.env.DB_HOST,
	port: Number(process.env.DB_PORT),
	username: process.env.DB_USERNAME,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_DATABASE,
	entities: [__dirname + "/../**/*.entity{.ts,.js}"],
	migrations: ["dist/database/migrations/*.js"],
	subscribers: ["dist/database/subscribers/*.js"],
	synchronize: false,
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
