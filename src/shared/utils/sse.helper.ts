import type { MessageEvent } from "@nestjs/common";
import type { Response } from "express";
import type { Observable } from "rxjs";

export class SseHelper {
	/**
	 * Manually pipes an Observable to an Express Response using SSE format.
	 */
	static streamObservable(
		res: Response,
		stream$: Observable<MessageEvent>,
		onClose?: () => void,
	) {
		res.setHeader("Content-Type", "text/event-stream");
		res.setHeader("Cache-Control", "no-cache");
		res.setHeader("Connection", "keep-alive");

		const subscription = stream$.subscribe({
			next: (event) => {
				if (event.data === "[DONE]") {
					res.write("data: [DONE]\n\n");
				} else {
					res.write(`data: ${JSON.stringify(event.data)}\n\n`);
				}
			},
			error: (err) => {
				res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
				res.end();
			},
			complete: () => {
				res.end();
			},
		});

		res.on("close", () => {
			subscription.unsubscribe();
			if (onClose) onClose();
		});
	}

	/**
	 * Sends a standard error response or streams it if headers are already sent.
	 */
	static sendError(res: Response, status: number, message: any) {
		if (!res.headersSent) {
			res.status(status).json({
				statusCode: status,
				message: message,
			});
		} else {
			res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
			res.end();
		}
	}
}
