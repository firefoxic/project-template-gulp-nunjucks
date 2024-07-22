import { default as firefoxicEslintConfig, globals } from "@firefoxic/eslint-config"

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
	{
		ignores: [`dist/`],
	},
	{
		ignores: [`src/`],
		languageOptions: {
			globals: {
				...globals.nodeBuiltin,
			},
		},
	},
	{
		files: [`src/**/*.js`],
		languageOptions: {
			globals: {
				...globals.browser,
			},
		},
	},
	...firefoxicEslintConfig,
]
