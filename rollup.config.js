const terser = require('rollup-plugin-terser').terser;
const nodeResolve = require('rollup-plugin-node-resolve');
const replace = require('rollup-plugin-replace');
const packageJson = require('./package.json');

function getDevBuildMetadata() {
	const now = new Date();
	return now.toISOString().replace(/:\d+\..+/g, '').replace(/[-T:]/g, '');
}

function getCurrentVersion() {
	const isDev = process.env.BUILD_TAG !== 'release';
	return `${packageJson.version}` + (isDev ? `-dev+${getDevBuildMetadata()}` : '');
}

const currentVersion = getCurrentVersion();

function getConfig(inputFile, type, isProd) {
	const suffix = type === 'module' ? 'esm' : 'stalone';
	const mode = isProd ? 'prod' : 'dev';

	const config = {
		input: inputFile,
		output: {
			format: type === 'module' ? 'esm' : 'iife',
			file: `./dist/flycharts.${suffix}.${mode}.js`,
			banner: `
/*!
* @license
* Flycharts v${currentVersion}
* Licensed under Apache License 2.0 https://www.apache.org/licenses/LICENSE-2.0
*/`.trim(),
		},
		plugins: [
			nodeResolve(),
			replace({
				delimiters: ['<@', '@>'],
				values: {
					VERSION: currentVersion,
				},
			}),
			isProd && terser({
				output: {
					comments: /@license/,
					inline_script: true,
				},
			}),
		],
	};

	return config;
}

const configs = [
	getConfig('./lib/src/index.js', 'module', false),
	getConfig('./lib/src/standalone.js', 'standalone', false),
];

if (process.env.NODE_ENV === 'production') {
	configs.push(
		getConfig('./lib/src/index.js', 'module', true),
		getConfig('./lib/src/standalone.js', 'standalone', true),
	);
}

// eslint-disable-next-line no-console
console.log(`Building version: ${currentVersion}`);

module.exports = configs;
