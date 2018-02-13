const gulp = require('gulp');
const eslint = require('gulp-eslint');
const jsdoc = require('gulp-jsdoc3');
const composer = require('gulp-uglify/composer');
const uglifyjs = require('uglify-es');
const rename = require('gulp-rename');
const sourcemaps = require('gulp-sourcemaps');
const rollup = require('rollup').rollup;
const nodeResolve = require('rollup-plugin-node-resolve');
const commonJS = require('rollup-plugin-commonjs');
const json = require('rollup-plugin-json');
const builtins = require('rollup-plugin-node-builtins');
const globals = require('rollup-plugin-node-globals');
const replace = require('rollup-plugin-replace');
const karmaServer = require('karma').Server;

const uglify = composer(uglifyjs, console);

gulp.task('js', () => {
	return rollup({
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
			nodeResolve({
				preferBuiltins: false,
				browser: true
			})
		]
	}).then((bundle) => {
		return Promise.all([
			bundle.write({
				name: 'holonet',
				format: 'iife',
				sourcemap: true,
				exports: 'named',
				file: 'build/holonet.script.js'
			}),
			bundle.write({
				name: 'holonet',
				format: 'umd',
				sourcemap: true,
				exports: 'named',
				file: 'build/holonet.umd.js'
			}),
			bundle.write({
				format: 'es',
				sourcemap: true,
				exports: 'named',
				file: 'build/holonet.js'
			})
		]);
	}).catch(console.log);
});

gulp.task('minify', () => {
	return gulp.src(['./build/holonet.js', './build/holonet.script.js', './build/holonet.umd.js'])
		.pipe(uglify())
		.on('error', console.error)
		.pipe(rename({
			suffix: '.min'
		}))
		.pipe(gulp.dest('./build'));
});

gulp.task('build', gulp.series('js', 'minify'));

gulp.task('eslint', () => {
	return gulp.src(['./src/**/*.js', '!./src/libs/*.js'])
		.pipe(eslint('./.eslintrc.json'))
		.pipe(eslint.format())
		.pipe(eslint.failAfterError());
});

gulp.task('lint', gulp.parallel('eslint'));

gulp.task('test', (done) => {
	new karmaServer({
		configFile: __dirname + '/karma.conf.js',
		singleRun: true
	}, (err) => {
		done(err);
	}).start();
});

gulp.task('docs', (done) => {
	const config = {
		opts: {
			destination: './docs'
		}
	};

	gulp.src(['README.md', './src/**/*.js', '!./src/libs/*.js'], {read: false})
		.pipe(jsdoc(config, done));
});

gulp.task('watch', gulp.series('js', () => {
	gulp.watch(['./src/**/*'], gulp.series('js'));
}));

gulp.task('default', gulp.parallel('eslint', 'test'));

