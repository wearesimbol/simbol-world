'use strict';

import * as THREE from 'three';
import EventEmitter from 'eventemitter3';
import loadBmfont from 'load-bmfont';
import createTextGeometry from 'three-bmfont-text';
import createMSDFShader from '../../src/libs/createMSDFShader';
import {bugfix} from './textsimbolfix';
import {TextSimbol} from '../../src/simbols/text';
import {NodeSimbol} from '../../src/simbols/node';

describe('TextSimbol', () => {

	let textSimbol;
	const config = {
		text: 'hello',
		bold: true,
		position: 1
	};

	beforeEach(() => {
		sinon.stub(TextSimbol.prototype, 'constructMesh').resolves();

		textSimbol = new TextSimbol(config);
	});

	afterEach(() => {
		TextSimbol.prototype.constructMesh.restore && TextSimbol.prototype.constructMesh.restore();
	})

	it('should be a class', () => {
		assert.isFunction(TextSimbol);
	});

	it('should have a set of methods', () => {
		assert.isFunction(TextSimbol.prototype.add);
	});

	it('should have a set of properties', () => {
		assert.deepEqual(TextSimbol.prototype.children, []);
		assert.isUndefined(TextSimbol.prototype.mesh);
	});

	describe('#constructor', () => {

		it('should extend EventEmitter', () => {
			assert.instanceOf(textSimbol, EventEmitter);
		});

		it('should extend NodeSimbol', () => {
			assert.instanceOf(textSimbol, NodeSimbol);
		});

		it('should construct mesh', () => {
			assert.isTrue(TextSimbol.prototype.constructMesh.calledOnce);
			assert.isTrue(TextSimbol.prototype.constructMesh.calledWith('hello', true, 1));
		});
	});

	describe('#constructMesh', () => {

		let loadedMesh;
		const text = 'test';
		const bold = true;
		let position = [1, 2, 3];

		beforeEach((done) => {
			TextSimbol.prototype.constructMesh.restore();
			sinon.stub(textSimbol, '_loadFont').resolves({
				chars: [],
				common: {
					lineHeight: 1,
					baseline: 0
				}
			});
			sinon.stub(textSimbol, '_loadTexture').resolves();
			sinon.stub(THREE.Vector3.prototype, 'set');

			textSimbol.constructMesh(text, bold, position)
				.then((mesh) => {
					loadedMesh = mesh;
					done();
				})
				.catch((error) => {
					console.log('error', error.stack)
					done();
				});
		});

		afterEach(() => {
			THREE.Vector3.prototype.set.restore();
		});

		it('should load font', () => {
			assert.isTrue(textSimbol._loadFont.calledOnce);
			assert.isTrue(textSimbol._loadFont.calledWith('https://simbol.io/assets/fonts/Roboto-Bold'));
		});

		it('should load texture', () => {
			assert.isTrue(textSimbol._loadTexture.calledOnce);
			assert.isTrue(textSimbol._loadTexture.calledWith('https://simbol.io/assets/fonts/Roboto-Bold'));
		});

		// Can't stub modules, so can't test
		xit('should create text geometry', () => {
			assert.isTrue(createTextGeometry.calledOnce);
			assert.deepEqual(createTextGeometry.firstCall.args[0], {
				width: 500,
				align: 'left',
				font: 1,
				text: 'test'
			});
		});

		xit('should create MSDF shader', () => {
			assert.isTrue(createMSDFShader.calledOnce);
			assert.deepEqual(createMSDFShader.firstCall.args[0], {
				msdf: undefined,
				bgColor: new THREE.Vector4(1, 1, 1, 0),
				fgColor: new THREE.Vector4(0.295, 0.376, 0.427, 1)
			});
		});

		it('should return mesh', () => {
			assert.instanceOf(loadedMesh, THREE.Mesh);
			assert.isTrue(THREE.Vector3.prototype.set.calledTwice);
			assert.isTrue(THREE.Vector3.prototype.set.firstCall.calledWith(0.015, -0.015, 0.015));
			assert.isTrue(THREE.Vector3.prototype.set.secondCall.calledWith(...position));
		})
	});

	describe('#_loadFont', () => {

		const path = 'test';
		let font;

		describe('saved font', () => {

			beforeEach((done) => {
				TextSimbol.font = 'font';
				
				textSimbol._loadFont(path)
					.then((loadedFont) => {
						font = loadedFont;
						done();
					});
			});

			it('should return saved font', () => {
				assert.equal(font, 'font');
			});
		});

		// Can't stub module, so can't test
		xdescribe('unsaved font', () => {

			beforeEach((done) => {
				// loadBmfont = sinon.stub.callsFake(() => {
				// 	return Promise.resolve(1);
				// });
				textSimbol._loadFont(path)
					.then((loadedFont) => {
						font = loadedFont;
						done();
					});
			});

			it('load Bmfont', () => {
				assert.isTrue(loadBmfont.calledOnce);
				assert.isTrue(loadBmfont.calledWith('test.json'));
				assert.equal(font, 1);
			});
		});
	});

	describe('#_loadTexture', () => {

		const path = 'test';
		let texture;

		describe('saved texture', () => {

			beforeEach((done) => {
				TextSimbol.texture = 'texture';
				
				textSimbol._loadTexture(path)
					.then((loadedTexture) => {
						texture = loadedTexture;
						done();
					});
			});

			it('should return saved texture', () => {
				assert.equal(texture, 'texture');
			});
		});

		describe('unsaved texture', () => {

			beforeEach((done) => {
				TextSimbol.texture = undefined;
				sinon.stub(THREE.TextureLoader.prototype, 'load').callsFake((_, func) => {
					func(1);
				});
				textSimbol._loadTexture(path)
					.then((loadedTexture) => {
						texture = loadedTexture;
						done();
					});
			});

			afterEach(() => {
				THREE.TextureLoader.prototype.load.restore();
			});

			it('load texture', () => {
				assert.isTrue(THREE.TextureLoader.prototype.load.calledOnce);
				assert.isTrue(THREE.TextureLoader.prototype.load.calledWith('test.png'));
				assert.equal(texture, 1);
			});
		});
	});
});
