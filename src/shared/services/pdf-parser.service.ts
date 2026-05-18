import { Injectable, Logger } from "@nestjs/common";
import { BaseException } from "../exception/base.exception";

// Use require because pdf-parse-fork's export structure can be tricky with ESM/TS
const pdf = require("pdf-parse-fork");

@Injectable()
export class PdfParserService {
	private readonly logger = new Logger(PdfParserService.name);

	async parse(buffer: Buffer): Promise<string> {
		try {
			const data = await pdf(buffer);
			return data.text?.trim() || "";
		} catch (error) {
			this.logger.debug("Error parsing PDF:", error);
			throw new BaseException(400, "PDF_PARSING_FAILED");
		}
	}
}
