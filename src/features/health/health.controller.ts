import { Controller, Get } from "@nestjs/common";
import {
	HealthCheck,
	HealthCheckService,
	HttpHealthIndicator,
	MemoryHealthIndicator,
	TypeOrmHealthIndicator,
} from "@nestjs/terminus";

@Controller({ path: "health", version: "1" })
export class HealthController {
	constructor(
		private health: HealthCheckService,
		private http: HttpHealthIndicator,
		private db: TypeOrmHealthIndicator,
		private memory: MemoryHealthIndicator,
	) {}

	@Get()
	@HealthCheck()
	check() {
		return this.health.check([
			() => this.http.pingCheck("api-docs", "http://localhost:3000/swagger-ui"),
			() => this.db.pingCheck("database", { timeout: 3000 }),
			() => this.memory.checkHeap("memory_heap", 150 * 1024 * 1024),
			() => this.memory.checkRSS("memory_rss", 350 * 1024 * 1024),
		]);
	}
}
