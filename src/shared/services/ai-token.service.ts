import { Injectable } from "@nestjs/common";

@Injectable()
export class AiTokenService {
	/**
	 * Estimates the number of tokens in a string based on the language.
	 * Vietnamese: ~2.5 tokens per word.
	 * English/Others: ~1.3 tokens per word.
	 */
	estimateTokenCount(text: string): number {
		const words = text.split(/\s+/).filter((word) => word.length > 0);
		const wordCount = words.length;

		const isVietnamese =
			/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(
				text,
			);

		return isVietnamese
			? Math.ceil(wordCount * 2.5)
			: Math.ceil(wordCount * 1.3);
	}
}
