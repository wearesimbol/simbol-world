'use strict';

import * as THREE from 'three';
import {GLTFLoader} from '../../src/libs/GLTFLoader';
import {Loader} from '../../src/utils/loader';

describe('Loader', () => {

	let loader;
	let meshToLoad;

	beforeEach(() => {
		meshToLoad = 'myscene.json';

		loader = new Loader(meshToLoad);
	});

	it('should be a class', () => {
		assert.isFunction(Loader);
	});

	it('should have a set of methods', () => {
		assert.isFunction(Loader.prototype._loadGLTF);
		assert.isFunction(Loader.prototype._loadObj);
		assert.isFunction(Loader.prototype.load);
	});

	describe('#constructor', () => {

		it('should set some properties', () => {
			assert.equal(loader.meshToLoad, meshToLoad);
		});

		describe('GLTF scene', () => {

			beforeEach(() => {
				meshToLoad = 'myscene.gltf';

				loader = new Loader(meshToLoad);
			});

			it('should set the type to GLTF', () => {
				assert.equal(loader.type, 'GLTF');
			});
		});

		describe('OBJ scene', () => {

			it('should set the type to OBJ', () => {
				assert.equal(loader.type, 'OBJ');
			});
		});

		describe('Object3D scene', () => {

			beforeEach(() => {
				meshToLoad = new THREE.Object3D();

				loader = new Loader(meshToLoad);
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

		describe('error', () => {

			beforeEach((done) => {
				loader = new Loader();
				loader.load().then(done, (e) => {
					error = e;
					done();
				});
			});
	
			it('should throw an error if type is incorrect', () => {
				assert.equal(error, 'Invalid mesh provided');
			});
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
