import resolve from 'rollup-plugin-node-resolve';
import commonJS from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import builtins from 'rollup-plugin-node-builtins';
import globals from 'rollup-plugin-node-globals';
import replace from 'rollup-plugin-replace';

/**
 * Helper function to deep clone an object
 *
 * @param {object} obj - Object to clone
 * @param {boolean} isArray - Whether it's cloning an array
 *
 * @returns {object} clone
 */
function cloneHelper(obj, isArray) {
	let clone = {};
	if (isArray) {
		clone = [];
	}
	for (const i in obj) {
		if (Array.isArray(obj[i])) {
			clone[i] = cloneHelper(obj[i], true);
		} else if (obj[i] !== null && typeof obj[i] === 'object') {
			clone[i] = cloneHelper(obj[i]);
		} else {
			clone[i] = obj[i];
		}
	}
	return clone;
}

const noThree = true;
const noThreeReplace = replace({
	'three': ``,
	include: 'src/**',
	exclude: 'src/lib/**',
	delimiters: ['import * as THREE from \'', '\'']
});

const configs = [];
const config = {
	input: 'src/main.js',
	plugins: [
		replace({
			[`readable-stream`]: `require('stream')`,
			include: 'node_modules/simple-peer/index.js',
			delimiters: ['require(\'', '\')']
		}),
		commonJS({
			ignoreGlobal: true
		}),
		json(),
		globals(),
		builtins(),
		resolve({
			preferBuiltins: false,
			browser: true
		})
	],
	output: [
		{
			name: 'Simbol',
			format: 'iife',
			sourcemap: true,
			exports: 'named',
			dir: 'build',
			file: 'simbol.script.js'
		},
		{
			format: 'cjs',
			sourcemap: true,
			exports: 'named',
			dir: 'build',
			file: 'simbol.cjs.js'
		},
		{
			format: 'es',
			sourcemap: true,
			exports: 'named',
			dir: 'build',
			file: 'simbol.js'
		}
	]
};

configs.push(config);

if (noThree) {
	const noThreeConfig = cloneHelper(config);
	noThreeConfig.plugins.unshift(noThreeReplace);
	noThreeConfig.output = noThreeConfig.output.map((output) => {
		output.file = output.file.replace('.js', '.nothree.js');
		return output;
	});
	configs.push(noThreeConfig);
}


export default configs;
