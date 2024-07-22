/** @type {import('stylelint').Config} */
export default {
	"extends": `@firefoxic/stylelint-config`,
	"rules": {
		"declaration-property-value-no-unknown": [
			true,
			{
				typesSyntax: {
					color: `| oklch( [ <percentage> | <number> | none] [ <percentage> | <number> | none] [ <hue> | none] [ / [<alpha-value> | none] ]? )`,
				},
			},
		],
		"no-unknown-custom-media": null,
		"number-max-precision": 12,
	},
}
