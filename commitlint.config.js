export default {
	extends: ["@commitlint/config-conventional"],
	plugins: [
		{
			rules: {
				"trello-key-in-scope": (parsed) => {
					const { scope } = parsed;
					const trelloRegex = /^OTA-\d+$/;
					if (!scope) {
						return [
							false,
							"Commit must have Trello Key in scope (VD: feat(OTA-123): ...)",
						];
					}
					if (!trelloRegex.test(scope)) {
						return [
							false,
							`Scope "${scope}" is invalid format. There must be a Trello Key (VD: OTA-123)`,
						];
					}

					return [true];
				},
			},
		},
	],

	rules: {
		"scope-case": [0],
		"scope-empty": [2, "never"],
		"trello-key-in-scope": [2, "always"],
	},
};
