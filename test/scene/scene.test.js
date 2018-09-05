'use strict';

import * as THREE from 'three';
import {VREffect} from '../../src/libs/VREffect';
import {GLTFLoader} from '../../src/libs/GLTFLoader';
import {Loader} from '../../src/utils/loader';
import {Scene} from '../../src/scene/scene';

describe('Scene', () => {

	let scene;
	const canvas = document.createElement('canvas');

	beforeEach(() => {
		sinon.stub(window, 'addEventListener');

		const config = {
			render: true,
			animate: true,
			canvas,
			sceneToLoad: 'test'
		};
		scene = new Scene(config);
	});

	afterEach(() => {
		window.addEventListener.restore();
	});

	it('should be a class', () => {
		assert.isFunction(Scene);
	});

	it('should have a set of methods', () => {
		assert.isFunction(Scene.prototype.init);
		assert.isFunction(Scene.prototype._render);
		assert.isFunction(Scene.prototype.animate);
		assert.isFunction(Scene.prototype.cancelAnimate);
		assert.isFunction(Scene.prototype.addToScene);
		assert.isFunction(Scene.prototype.onResize);
	});

	it('should have a set of properties', () => {
		assert.deepEqual(Scene.prototype.animateFunctions, []);
		assert.deepEqual(Scene.prototype.collidableMeshes, []);
	});

	describe('#constructor', () => {

		it('should set some properties', () => {
			assert.instanceOf(scene.camera, THREE.PerspectiveCamera);
			assert.instanceOf(scene.renderer, THREE.WebGLRenderer);
			assert.instanceOf(scene.vrEffect, VREffect);
			assert.instanceOf(scene._sceneLoader, Loader);
			assert.equal(scene.canvas, canvas);
		});

		it('should add a resize handler on window', () => {
			// Other calls are with 'vrdisplaypresentchange'
			assert.isTrue(window.addEventListener.called);
			assert.isTrue(window.addEventListener.secondCall.calledWith('resize'));
		});

		it('should add a vrdisplayactivate handler on window', () => {
			// Other calls are with 'vrdisplaypresentchange'
			assert.isTrue(window.addEventListener.getCall(3).calledWith('vrdisplayactivate'));
		});
	});

	describe('#init', () => {

		let mesh;
	
		beforeEach((done) => {
			mesh = {
				add: sinon.stub()
			};

			scene._meshesToAdd = [1];
			scene._sceneLoader = {
				load: sinon.stub().resolves(mesh)
			};
			scene._setupMeshes = sinon.stub();
			scene.animate = sinon.stub();
			scene.config = {
				animate: true
			};

			scene.init().then(done);
		});

		it('should load scene', () => {
			assert.isTrue(scene._sceneLoader.load.calledOnce);
			assert.equal(mesh.name, 'SimbolMainScene');
			assert.equal(scene.scene, mesh);
			assert.isTrue(scene._setupMeshes.calledOnce);
			assert.isTrue(scene._setupMeshes.calledWith(mesh));
			assert.isTrue(scene.scene.add.calledOnce);
			assert.isTrue(scene.scene.add.calledWith(1));
			assert.isTrue(scene.animate.calledOnce);
		});
	});

	describe('#addToScene', () => {

		let meshes = ['mesh1', 'mesh2'];

		describe('scene', () => {

			beforeEach(() => {
				scene.scene = {
					add: sinon.stub()
				};
	
				scene.addToScene([meshes[0], meshes[1]]);
			});
	
			it('should add meshes to the scene', () => {
				assert.isTrue(scene.scene.add.calledTwice);
				assert.isTrue(scene.scene.add.firstCall.calledWith(meshes[0]));
				assert.isTrue(scene.scene.add.secondCall.calledWith(meshes[1]));
			});
		});

		describe('no scene', () => {

			beforeEach(() => {

				scene.addToScene(meshes);
			});
	
			it('should save meshes', () => {
				assert.deepEqual(scene._meshesToAdd, meshes);
			});
		});
	});

	describe('#_setupMeshes', () => {

		const mesh = {
			children: [{
				isMesh: true,
				material: {},
				geometry: {},
				children: []
			}]
		};

		beforeEach(() => {
			mesh.children[0].geometry.computeFaceNormals = sinon.stub();

			scene._setupMeshes(mesh, true, true);
		});

		it('should render children properly', () => {
			assert.isTrue(mesh.children[0].geometry.computeFaceNormals.calledOnce);
			assert.isTrue(mesh.children[0].castShadow);
			assert.isTrue(mesh.children[0].receiveShadow);
			assert.deepEqual(scene.collidableMeshes, [mesh.children[0]]);
		});
	});
	
	describe('#onResize', () => {
		beforeEach(() => {
			scene.camera = {
				updateProjectionMatrix: sinon.stub()
			};

			scene.vrEffect = {
				setSize: sinon.stub()
			};

			scene.onResize();
		});

		it('should update camera', () => {
			assert.equal(scene.camera.aspect, window.innerWidth / window.innerHeight);
			assert.isTrue(scene.camera.updateProjectionMatrix.calledOnce);
		});

		it('should adapt eye display sizes', () => {
			assert.isTrue(scene.vrEffect.setSize.calledOnce);
			assert.isTrue(scene.vrEffect.setSize.calledWith(window.innerWidth, window.innerHeight, true));
		});
	});

	describe('#_render', () => {

		let animateFunction;

		beforeEach(() => {
			animateFunction = sinon.stub();
			scene.vrEffect = {
				requestAnimationFrame: sinon.stub(),
				render: sinon.stub()
			};
			scene.animateFunctions = [animateFunction];
			scene.scene = sinon.stub();
			scene.camera = sinon.stub();

			scene._render(1);
		});

		afterEach(() => {
			scene.animateFunctions = [];
		})

		it('should start a requestAnimationFrame loop', () => {
			assert.isTrue(scene.vrEffect.requestAnimationFrame.calledOnce);
		});

		it('should call functions in animateFunctions', () => {
			assert.isTrue(animateFunction.calledOnce);
			assert.isTrue(animateFunction.calledWith(1));
		});

		it('should _render in HMD', () => {
			assert.isTrue(scene.vrEffect.render.calledOnce);
			assert.isTrue(scene.vrEffect.render.calledWith(scene.scene, scene.camera));
		});
	});

	describe('#animate', () => {

		beforeEach(() => {
			scene.vrEffect = {
				requestAnimationFrame: sinon.stub().returns(1)
			};
	
			scene.animate();
		});

		it('should start animation and set id', () => {
			assert.isTrue(scene.vrEffect.requestAnimationFrame.calledOnce);
			assert.isTrue(scene.vrEffect.requestAnimationFrame.calledWith(scene._render));
			assert.equal(scene._animationFrameID, 1);
		});
	});

	describe('#cancelAnimate', () => {

		beforeEach(() => {
			scene.vrEffect = {
				cancelAnimationFrame: sinon.stub()
			};
			scene._animationFrameID = 1;
	
			scene.cancelAnimate();
		});

		it('should cancel animation', () => {
			assert.isTrue(scene.vrEffect.cancelAnimationFrame.calledOnce);
			assert.isTrue(scene.vrEffect.cancelAnimationFrame.calledWith(1));
		});
	});

	describe('#addAnimateFunctions', () => {

		let animateFunction;

		beforeEach(() => {
			animateFunction = sinon.stub();

			scene.addAnimateFunctions(animateFunction);
		});

		it('should add an array of functions to animateFunctions', () => {
			assert.isTrue(scene.animateFunctions.includes(animateFunction));
		});
	});
});
