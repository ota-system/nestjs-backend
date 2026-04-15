import * as path from "node:path";
import { HeaderResolver, QueryResolver } from "nestjs-i18n";

export const getI18nConfig = () => ({
	fallbackLanguage: "vi",
	loaderOptions: {
		path: path.join(process.cwd(), "dist/i18n/"),
		watch: true,
	},
});

export const i18nResolvers = [
	new QueryResolver(["lang", "l"]),
	new HeaderResolver(["x-lang"]),
];
