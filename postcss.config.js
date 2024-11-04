export default function (context) {
	let { IS_DEVELOPMENT } = context

	return {
		plugins: {
			"postcss-import": {},
			"postcss-url": [
				{
					filter: `**/node_modules/**/files/*.woff2`,
					url: (asset) => asset.url.replace(`./files/`, `../shared/fonts/`),
				},
				{
					filter: `**/*.svg`,
					url: `inline`,
				},
				{
					filter: `!**/*.svg`,
					url: `rebase`,
				},
			],
			"postcss-lightningcss": {
				lightningcssOptions: {
					minify: !IS_DEVELOPMENT,
					drafts: {
						customMedia: true,
					},
				},
			},
		},
	}
}
