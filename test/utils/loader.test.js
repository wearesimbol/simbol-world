'use strict';

import * as THREE from 'three';
import {GLTFLoader} from '../../src/libs/GLTFLoader';
import {Loader} from '../../src/utils/loader';

describe('Loader', () => {

	let loader;

	beforeEach(() => {
		loader = Object.create(Loader);
	});

	it('should be an object', () => {
		assert.isObject(Loader);
	});

	it('should have a set of methods', () => {
		assert.isFunction(Loader.init);
		assert.isFunction(Loader._loadGLTF);
		assert.isFunction(Loader._loadObj);
		assert.isFunction(Loader.load);
	});

	describe('#init', () => {

		let meshToLoad;

		beforeEach(() => {
			meshToLoad = 'myscene.json';

			loader.init(meshToLoad);
		});

		it('should set some properties', () => {
			assert.equal(loader.meshToLoad, meshToLoad);
		});

		describe('GLTF scene', () => {

			beforeEach(() => {
				meshToLoad = 'myscene.gltf';

				loader.init(meshToLoad);
			});

			it('should set the type to GLTF', () => {
				assert.equal(loader.type, 'GLTF');
			});
		});

		describe('OBJ scene', () => {

			beforeEach(() => {
				meshToLoad = 'myscene.json';

				loader.init(meshToLoad);
			});

			it('should set the type to OBJ', () => {
				assert.equal(loader.type, 'OBJ');
			});
		});

		describe('Object3D scene', () => {

			beforeEach(() => {
				meshToLoad = new THREE.Object3D();

				loader.init(meshToLoad);
			});

			it('should set the type to Object3D', () => {
				assert.equal(loader.type, 'Object3D');
			});
		});
	});

	describe('#_loadGLTF', () => {

		let meshToLoad;
		let returnedScene;
		let loadedScene;

		beforeEach((done) => {
			returnedScene = {
				scene: true
			};
			loader.meshToLoad = 'myscene.gltf';

			sinon.stub(GLTFLoader.prototype, 'load').callsFake((scene, callback) => {
				if (scene === loader.meshToLoad) {
					callback(returnedScene);
				}
			});

			loader._loadGLTF().then((scene) => {
				loadedScene = scene;
				done();
			});
		});

		afterEach(() => {
			GLTFLoader.prototype.load.restore();
		});

		it('should resolve loadedScene', () => {
			assert.isTrue(loadedScene);
		});
	});

	describe('#_loadObj', () => {

		let meshToLoad;
		let returnedScene;
		let loadedScene;

		beforeEach((done) => {
			returnedScene = {};
			loader.meshToLoad = 'myscene.json';

			sinon.stub(THREE.ObjectLoader.prototype, 'load').callsFake((scene, callback) => {
				if (scene === loader.meshToLoad) {
					callback(returnedScene);
				}
			});

			loader._loadObj().then((scene) => {
				loadedScene = scene;
				done();
			});
		});

		afterEach(() => {
			THREE.ObjectLoader.prototype.load.restore();
		});

		it('should resolve loadedScene', () => {
			assert.equal(loadedScene, returnedScene);
		});
	});

	describe('#load', () => {

		const loadedScene = {
			name: 'Scene'
		};
		let returnedScene;
		let error;

		beforeEach((done) => {
			loader.load().then((scene) => {
				returnedScene = scene;
				done();
			}, (e) => {
				error = e;
				done();
			});
		});

		it('should throw an error if type is incorrect', () => {
			assert.equal(error, 'Invalid mesh provided');
		});

		describe('load GLTF', () => {

			let returnedScene;

			beforeEach((done) => {
				loader.type = 'GLTF';
				loader._loadGLTF = sinon.stub().returns(new Promise((resolve) => {
					resolve(loadedScene);
				}));

				loader.load().then((scene) => {
					returnedScene = scene;
					done();
				});
			});

			it('returns loaded GLTF', () => {
				assert.isTrue(loader._loadGLTF.calledOnce);
				assert.equal(returnedScene, loadedScene);
			});
		});

		describe('load OBJ', () => {

			let returnedScene;

			beforeEach((done) => {
				loader.type = 'OBJ';
				loader._loadObj = sinon.stub().returns(new Promise((resolve) => {
					resolve(loadedScene);
				}));

				loader.load().then((scene) => {
					returnedScene = scene;
					done();
				});
			});

			it('returns loaded Obj', () => {
				assert.isTrue(loader._loadObj.calledOnce);
				assert.equal(returnedScene, loadedScene);
			});
		});

		describe('load Object3D', () => {

			let returnedScene;

			beforeEach((done) => {
				loader.type = 'Object3D';
				loader.meshToLoad = loadedScene;

				loader.load().then((scene) => {
					returnedScene = scene;
					done();
				});
			});

			it('returns loaded Object3D', () => {
				assert.equal(returnedScene, loadedScene);
			});
		});
	});
});
