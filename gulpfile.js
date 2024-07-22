import { env } from "node:process"
import { extname } from "node:path"
import { readdir, readFile, rm } from "node:fs/promises"

import browserslistToEsbuild from "browserslist-to-esbuild"
import { createGulpEsbuild } from "gulp-esbuild"
import { getProjectRoot } from "@firefoxic/utils"
import htmlmin from "gulp-htmlmin"
import { nunjucksCompile } from "gulp-nunjucks"
import plumber from "gulp-plumber"
import postcss from "gulp-postcss"
import server from "browser-sync"
import { dest, parallel, series, src, watch } from "gulp"

const IS_DEVELOPMENT = env.NODE_ENV !== `production`
const SRC = `./src`
const DIST = `./dist`
const STATIC = `./public`
const ROOT_SHARED_PATHS = [
	`/shared/fonts/**/*.woff2`,
	`/shared/images/**/*.{avif,webp,svg}`,
]

let plumberOptions = {
	errorHandler (error) {
		console.error(error.message)
		this.emit(`end`)
	},
}

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

	let serveStatic = ROOT_SHARED_PATHS
		.map((path) => {
			let route = path.replace(/(\/\*\*\/.*$)|\/$/, ``)
			let dir = [`${SRC}${route}`]

			if (route === `/shared/fonts`) {
				dir.push(...fontDirs)
			}

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

	let sharedPaths = ROOT_SHARED_PATHS.map((PATH) => `${SRC}${PATH}`)

	watch(`${SRC}/**/*.{html,njk,json}`, series(processMarkup))
	watch(`${SRC}/**/*.{css,svg}`, series(processStyles))
	watch(`${SRC}/**/*.js`, series(processScripts))
	watch(`${STATIC}/**/*`, series(copyStatic, reloadServer))
	watch(sharedPaths, series(reloadServer))
}

export async function processMarkup () {
	let data = await readJsonFile(`${SRC}/data.json`)
	let projectData = await readJsonFile(`${STATIC}/manifest.webmanifest`)

	data.project = {
		name: projectData.name,
		description: projectData.description,
		root: getProjectRoot(),
	}
	data.images = {}

	let filePaths = await readdir(`${SRC}/shared/images`, { recursive: true })

	let jsonFiles = filePaths.filter((fileName) => extname(fileName) === `.json`)

	for (let jsonFile of jsonFiles) {
		let filePath = jsonFile.replace(/\\/g, `/`)
		let imageData = await readJsonFile(`${SRC}/shared/images/${filePath}`)

		data.images[filePath.slice(0, -5)] = imageData
	}

	return src(`${SRC}/pages/**/*.{html,njk}`, { base: SRC })
		.pipe(plumber(plumberOptions))
		.pipe(nunjucksCompile(data))
		.pipe(htmlmin({ collapseWhitespace: !IS_DEVELOPMENT }))
		.pipe(dest((path) => {
			path.dirname = path.dirname.replace(`pages`, ``)

			return DIST
		}))
		.pipe(server.stream())
}

export function processStyles () {
	let context = { IS_DEVELOPMENT }

	return src(`${SRC}/styles/*.css`, { sourcemaps: IS_DEVELOPMENT })
		.pipe(plumber(plumberOptions))
		.pipe(postcss(context))
		.pipe(dest(`${DIST}/styles`, { sourcemaps: IS_DEVELOPMENT }))
		.pipe(server.stream())
}

export function processScripts () {
	let gulpEsbuild = createGulpEsbuild({ incremental: IS_DEVELOPMENT })

	return src(`${SRC}/scripts/*.js`)
		.pipe(plumber(plumberOptions))
		.pipe(gulpEsbuild({
			bundle: true,
			format: `esm`,
			// splitting: true,
			platform: `browser`,
			minify: !IS_DEVELOPMENT,
			sourcemap: IS_DEVELOPMENT,
			target: browserslistToEsbuild(),
		}))
		.pipe(dest(`${DIST}/scripts`))
		.pipe(server.stream())
}

export async function copyStatic () {
	return src(`${STATIC}/**/*`, { encoding: false })
		.pipe(dest(DIST))
}

export async function copyShared () {
	let fontDirs = await getFontDirs()
	let pathsToFonts = fontDirs.map((path) => `${path}**/*.woff2`)

	src(ROOT_SHARED_PATHS.map((path) => `${SRC}${path}`), { base: SRC, encoding: false }).pipe(dest(DIST))
	src(pathsToFonts, { encoding: false }).pipe(dest(`${DIST}/shared/fonts`))
}

function reloadServer () {
	return server.reload()
}

async function getFontDirs () {
	let { dependencies } = await readJsonFile(`./package.json`)

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

async function readJsonFile (path) {
	let file = await readFile(path)

	return JSON.parse(file)
}