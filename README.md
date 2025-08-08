# project-template-gulp-nunjucks

[![License: MIT][license-image]][license-url]
[![Changelog][changelog-image]][changelog-url]

Project template based on Gulp and Nunjucks.

## Minimum required environment

### Terminal + git + make

On Windows, install git with git-bash or use WSL. And ensure that the `make` command is available.

### Setup project environment

Run the following command:

```shell
make setup
```

Then run:

```shell
make help
```

to see the available `make` targets.

## Components

Independent (as much as possible) components are located in `src/components/`, each in its subdirectory named after the component in PascalCase. The implementation files should be named `index` with the corresponding extension:
- Markup — `.njk`
- Styles — `.css`
- Scripts — `.js`

For component organization, follow the BEM methodology. For CSS classes, use the so-called React notation:
- Block named in PascalCase
- Elements named in PascalCase and separated from the block with a hyphen
- Modifiers named in camelCase and separated from blocks or elements with an underscore
- Modifier values named in camelCase and separated from the modifier name with an underscore

Example: `BlockName-ElemName_modName_modValue`.

## Common Files

Files that do not belong to a specific independent component but can be used both in and outside of components are placed in `src/shared/`.

## Markup

The project uses [the Nunjucks](https://mozilla.github.io/nunjucks/templating.html) templating engine. All page files should be named `index.njk` and placed in `src/pages/` in subdirectories corresponding to the route names. For example, the following source file structure:

```shell
└── src/
	└── pages/
		├── about/
		│	└── index.njk
		├── typography/
		│	└── index.njk
		└── index.njk
```

is built into:

```shell
└── dist/
	├── about/
	│	└── index.html
	├── typography/
	│	└── index.html
	└── index.html
```

Page files should only contain the unique content markup (the content of the `main` tag). Everything else is marked up in the base layout `src/layouts/Base.njk`, which extends the page markup.

Component markup as macros should be placed in `index.njk` files in the corresponding subdirectories in `src/components/`, and included on pages using the `from` tag (see examples in the source files).

In the markup, use paths from the project root with the `project.root` variable added at the beginning, which, when deployed on GitHub Pages, contains the project name. This ensures correct path functionality at different directory structure levels and when the project is nested in a subdirectory on GitHub Pages.

## Styles

In the layout `Base.njk`, only style files from the `src/styles/` directory are connected using the macro `src/styles/index.njk` — these are the main style files, which contain only imports (`@import`) of other component and common style files.

```shell
└── src/
	├── components/
	│	└── Page.css
	│		└── index.css
	├── shared/
	│	├── fonts/
	│	│	└── index.css
	│	├── global/
	│	│	├── colors.css
	│	│	├── focus.css
	│	│	└── images.css
	│	└── icons/
	│		└── index.css
	└── styles/
		└── index.css		# Main style file
```

## Scripts

Working with scripts is identical to working with styles, with the caveat that the main script files are located in `src/scripts/`.

## Graphics

### Images

Raster and content vector graphics (logos, charts, illustrations) should be placed in `src/shared/images/`.

If a raster image needs to adapt to viewport sizes, different versions of the image should be named with a numerical suffix (after the name, separated by a hyphen) corresponding to the breakpoint (viewport width from which this version should be displayed). The minimum version should remain without a breakpoint suffix.

Example of two images, each in three versions for different viewport sizes:

```shell
└── src/
	└── shared/
		└── images/
			├── aurora-1280.png
			├── aurora-640.png
			├── aurora.png
			├── eclipse-1280.png
			├── eclipse-640.png
			└── eclipse.png
```

Run `pnpm optimize:images`. By default, the command assumes these files are for double pixel density. This can be changed with the `-d` option, for example `pnpm optimize:images -d 3`. By default, the source files are converted to `.webp` and `.avif`. This can also be changed with the `-f` and `-a` options (see [option descriptions](https://github.com/firefoxic/conjure?tab=readme-ov-file#options)).

Additionally, the command will delete the source files after conversion and create `json` and `js` metadata files. For this project, `js` files are not needed and can be deleted, while `json` files are used in the `Picture` macro. The source files above will produce the following set of final files:

```shell
└── src/
	└── shared/
		└── images/
			├── aurora-1280@1x.avif
			├── aurora-1280@1x.webp
			├── aurora-1280@2x.avif
			├── aurora-1280@2x.webp
			├── aurora-640@1x.avif
			├── aurora-640@1x.webp
			├── aurora-640@2x.avif
			├── aurora-640@2x.webp
			├── aurora@1x.avif
			├── aurora@1x.webp
			├── aurora@2x.avif
			├── aurora@2x.webp
			├── aurora.json
			├── eclipse-1280@1x.avif
			├── eclipse-1280@1x.webp
			├── eclipse-1280@2x.avif
			├── eclipse-1280@2x.webp
			├── eclipse-640@1x.avif
			├── eclipse-640@1x.webp
			├── eclipse-640@2x.avif
			├── eclipse-640@2x.webp
			├── eclipse@1x.avif
			├── eclipse@1x.webp
			├── eclipse@2x.avif
			├── eclipse@2x.webp
			└── eclipse.json
```

Thus, after conversion, all you need to do to insert an adaptive image into a page is to import the `Picture` macro (with the `from` tag and context passing) and call this macro, specifying the image name as the first argument and an object with fields corresponding to the `img` tag attributes as the second argument (see examples in the page files).

For background raster images, use `image-set()`.

Additionally, `pnpm optimize:images` optimizes vector images in `src/shared/images/`.

### Icons

Place vector icons in `src/shared/icons/`. Add the paths to the svg files in `src/shared/icons/index.css` as custom properties and use these properties in component styles.

Run `pnpm optimize:icons` to optimize the icons.

### Favicons

Place vector favicons in `public/` (not in `src/!`). File names should be as follows:

```shell
└── public/
	├── 16.svg		# Special version sized 16×16.
	├── 32.svg		# Main version sized 32×32.
	└── touch.svg	# Large touch icon without roundings and transparencies.
```

Add `16.svg` only if there is a special 16×16 version in the layout.

Run `pnpm optimize:favicons` to generate all necessary favicons, the web manifest, and the `Links.md` file with the needed `link` tags (copy this code into the `head` tag of the layout markup, after which `Links.md` can be deleted).

The result will be:

```shell
└── public/
	├── favicons/
	│	├── icon-180.png
	│	├── icon-192.png
	│	├── icon-192.webp
	│	├── icon-512.png
	│	├── icon-512.webp
	│	└── icon.svg
	├── favicon.ico
	└── manifest.webmanifest
```

If there are no special requirements for the `apple-touch-icon`, you can delete the `public/favicons/icon-180.png` file and the `link` referring to it.

If necessary, adjust the paths in the `link` tags and the web manifest.

## Fonts

If the project requires fonts available on [FontSource](https://fontsource.org/), use their font npm packages:
- Install them as production dependencies.
- Connect them in `src/shared/fonts/index.css`.
- Collect useful font metrics into corresponding custom properties (e.g., using FontForge or [Capsize](https://seek-oss.github.io/capsize/)) converted to `1em` units, i.e., divide the required values by the `unitsPerEm` value. For example, the `unitsPerEm` for the `Fira Code` font is `2000` — divide all required values by this number:
    - `xHeight` = 1050 / 2000 = 0.525
    - `capHeight` = 1374 / 2000 = 0.687
    - `ascend` = 1980 / 2000 = 0.99
    - `descend` = 644 / 2000 = 0.322

If the required fonts are not available on [FontSource](https://fontsource.org/), use the font files provided by the designer. Place them in `src/shared/fonts/`, but you'll need to define `@font-face` in `src/shared/fonts/index.css` manually.

All font files are placed in `dist/fonts/` during the build.

## Deployment

In the project's deployment scripts, use `pnpm build` to build the project into `dist`.

If deploying to a server subdirectory, pass the subdirectory name to `data.project.root` during the build.

The project is already set up with a GitHub Action for deploying to GitHub Pages with the ability to deploy to a project subdirectory. The action automatically passes the project name as the subdirectory name to `data.project.root`.

[license-url]: https://github.com/firefoxic/project-template-gulp-nunjucks/blob/main/LICENSE.md
[license-image]: https://img.shields.io/badge/License-MIT-limegreen.svg

[changelog-url]: https://github.com/firefoxic/project-template-gulp-nunjucks/blob/main/CHANGELOG.md
[changelog-image]: https://img.shields.io/badge/Changelog-md-limegreen
