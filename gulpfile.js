import { copyFile, cp, glob, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { basename, dirname, extname, join, relative } from "node:path"
import { env } from "node:process"

import { getProjectRoot } from "@firefoxic/utils"
import server from "browser-sync"
import browserslistToEsbuild from "browserslist-to-esbuild"
import { parallel, series, watch } from "gulp"
import { minify } from "html-minifier-terser"
import nunjucks from "nunjucks"
import postcss from "postcss"
import postcssLoadConfig from "postcss-load-config"
import { rolldown } from "rolldown"

const IS_DEVELOPMENT = env.NODE_ENV !== `production`
const FONT_GLOB = `**/*.woff2`
const SRC = `./src`
const DIST = `./dist`
const STATIC = `./public`
const PAGES = `${SRC}/pages`
const SHARED = `${SRC}/shared`
const SHARED_PATTERNS = [`${SHARED}/fonts/${FONT_GLOB}`]
const NUNJUCKS_ENV = nunjucks.configure(SRC, {
	autoescape: true,
	noCache: IS_DEVELOPMENT,
})

export default series(
	removeDist,
	parallel(
		processMarkup,
		processStyles,
		processScripts,
	),
	copyStatic,
	IS_DEVELOPMENT ? startServer : copyShared,
)

export async function startServer () {
	let fontDirs = await getFontDirs()

	let serveStatic = SHARED_PATTERNS
		.map((pattern) => {
			let path = pattern.replace(/(\/\*\*\/.*$)|\/$/u, ``)
			let route = path.replace(SRC, ``)
			let dir = [path]

			if (route === `/shared/fonts`) dir.push(...fontDirs)

			return { route, dir }
		})

	server.init({
		server: {
			baseDir: DIST,
		},
		serveStatic,
		cors: true,
		notify: false,
		ui: false,
	}, (err, bs) => {
		bs.addMiddleware(`*`, async (req, res) => {
			res.write(await readFile(`${DIST}/404.html`))
			res.end()
		})
	})

	watch(`${SRC}/**/*.{html,njk,json}`, series(processMarkup))
	watch(`${SRC}/**/*.{css,svg}`, series(processStyles))
	watch(`${SRC}/**/*.js`, series(processScripts))
	watch(`${STATIC}/**/*`, series(copyStatic, reloadServer))
	watch(SHARED_PATTERNS, series(reloadServer))
}

export async function processMarkup () {
	let data = JSON.parse(await readFile(`${SHARED}/data.json`, `utf8`))

	data.project.root = getProjectRoot()

	let pagePaths = await Array.fromAsync(glob(`${PAGES}/**/*.{html,njk}`))

	await Promise.all(pagePaths.map((pagePath) => renderPage(pagePath, data)))

	if (IS_DEVELOPMENT) reloadServer()
}

async function renderPage (pagePath, data) {
	try {
		let rendered = NUNJUCKS_ENV.render(relative(SRC, pagePath), data)

		let minified = await minify(rendered, {
			collapseWhitespace: !IS_DEVELOPMENT,
			conservativeCollapse: !IS_DEVELOPMENT,
			decodeEntities: !IS_DEVELOPMENT,
			removeComments: !IS_DEVELOPMENT,
		})

		let outPath = join(DIST, relative(PAGES, pagePath)).replace(extname(pagePath), `.html`)

		await mkdir(dirname(outPath), { recursive: true })
		await writeFile(outPath, minified)
	}
	catch (error) {
		console.error(error.message)
	}
}

export async function processStyles () {
	let cssPaths = await Array.fromAsync(glob(`${SRC}/styles/*.css`))
	let { plugins, options } = await postcssLoadConfig({ IS_DEVELOPMENT })

	await Promise.all(cssPaths.map((cssPath) => renderStylesheet(cssPath, plugins, options)))

	if (IS_DEVELOPMENT) reloadServer(cssPaths.map((cssPath) => join(DIST, `styles`, basename(cssPath))))
}

async function renderStylesheet (cssPath, plugins, options) {
	try {
		let css = await readFile(cssPath, `utf8`)
		let outPath = join(DIST, `styles`, basename(cssPath))

		let result = await postcss(plugins).process(css, {
			...options,
			from: cssPath,
			to: outPath,
			map: IS_DEVELOPMENT ? { inline: false } : false,
		})

		await mkdir(dirname(outPath), { recursive: true })
		await writeFile(outPath, result.css)

		if (result.map) await writeFile(`${outPath}.map`, result.map.toString())
	}
	catch (error) {
		console.error(error.message)
	}
}

export async function processScripts () {
	let entryPoints = await Array.fromAsync(glob(`${SRC}/scripts/*.js`))

	try {
		let bundle = await rolldown({
			input: entryPoints,
			platform: `browser`,
			transform: {
				target: browserslistToEsbuild(),
			},
		})

		await bundle.write({
			dir: `${DIST}/scripts`,
			format: `esm`,
			sourcemap: IS_DEVELOPMENT,
			minify: !IS_DEVELOPMENT,
		})

		await bundle.close()
	}
	catch (error) {
		console.error(error.message)
		return
	}

	if (IS_DEVELOPMENT) reloadServer()
}

export async function copyStatic () {
	await cp(STATIC, DIST, { recursive: true, force: true })
}

export async function copyShared () {
	await Promise.all(SHARED_PATTERNS.map((pattern) => copyGlob(pattern, SRC, DIST)))

	let fontDirs = await getFontDirs()

	await Promise.all(fontDirs.map((dir) => copyGlob(`${dir}${FONT_GLOB}`, dir, `${DIST}/shared/fonts`)))
}

async function copyGlob (pattern, baseDir, outDir) {
	let files = await Array.fromAsync(glob(pattern))

	await Promise.all(files.map(async (file) => {
		let target = join(outDir, relative(baseDir, file))

		await mkdir(dirname(target), { recursive: true })
		await copyFile(file, target)
	}))
}

function reloadServer (path) {
	server.reload(path)
}

async function getFontDirs () {
	let { dependencies = {} } = JSON.parse(await readFile(`./package.json`, `utf8`))

	let fontDependencies = Object.keys(dependencies)
		.filter((dependency) => dependency.startsWith(`@fontsource`))

	return fontDependencies.map((dependency) => `./node_modules/${dependency}/files/`)
}

async function removeDist () {
	await rm(DIST, {
		force: true,
		recursive: true,
	})
}
