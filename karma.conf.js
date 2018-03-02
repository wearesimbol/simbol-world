const nodeResolve = require('rollup-plugin-node-resolve');
const commonJS = require('rollup-plugin-commonjs');
const json = require('rollup-plugin-json');
const builtins = require('rollup-plugin-node-builtins');
const globals = require('rollup-plugin-node-globals');
const replace = require('rollup-plugin-replace');
// Karma configuration

module.exports = function(config) {
	"use strict";
	config.set({

		// base path that will be used to resolve all patterns (eg. files, exclude)
		basePath: '',


		// frameworks to use
		// available frameworks: https://npmjs.org/browse/keyword/karma-adapter
		frameworks: ['mocha', 'chai', 'sinon'],


		// list of files / patterns to load in the browser
		files: [
			'http://polyfill.io/v2/polyfill.min.js',
			'test/**/*.test.js'
		],


		// list of files to exclude
		exclude: [
		],


		// preprocess matching files before serving them to the browser
		// available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
		preprocessors: {
			'test/**/*.test.js': ['rollup']
		},


		// test results reporter to use
		// possible values: 'dots', 'progress'
		// available reporters: https://npmjs.org/browse/keyword/karma-reporter
		reporters: ['progress'],


		// web server port
		port: 9876,


		// enable / disable colors in the output (reporters and logs)
		colors: true,


		// level of logging
		// possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
		logLevel: config.LOG_INFO,


		// enable / disable watching file and executing tests whenever any file changes
		autoWatch: false,


		// start these browsers
		// available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
		browsers: ['ChromeHeadlessNoSandbox'],

		customLaunchers: {
			ChromeHeadlessNoSandbox: {
				base: 'ChromeHeadless',
				flags: ['--no-sandbox']
			}
		},

		// Continuous Integration mode
		// if true, Karma captures browsers, runs the tests and exits
		singleRun: false,

		rollupPreprocessor: {
			
			// rollup settings. See Rollup documentation
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
				nodeResolve({
					preferBuiltins: false,
					browser: true
				})
			],
			output: {
				sourcemap: true,
				// will help to prevent conflicts between different tests entries
				format: 'iife',
				name: 'holonet'
			},
		}
	});
};
