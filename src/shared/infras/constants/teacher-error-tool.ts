const teacherErrorTool = {
	type: "function",
	function: {
		name: "emit_error",
		description:
			"Emit a structured error response when the request is ambiguous, invalid, or out of scope.",
		strict: true,
		parameters: {
			type: "object",
			additionalProperties: false,
			required: ["code", "message", "path", "details"],
			properties: {
				code: { type: "string" },
				message: { type: "string" },
				path: { type: "string" },
				details: { type: "array" },
			},
		},
	},
} as const;

export { teacherErrorTool };
