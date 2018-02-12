'use strict';

import * as THREE from 'three';
import {VREffect} from '../../src/libs/VREffect';
import {GLTFLoader} from '../../src/libs/GLTFLoader';
import {Scene} from '../../src/scene/scene';

describe('Scene', () => {

	let scene;

	beforeEach(() => {
		scene = Object.create(Scene);
	});

	it('should be an object', () => {
		assert.isObject(Scene);
	});

	it('should have a set of methods', () => {
		assert.isFunction(Scene.init);
		assert.isFunction(Scene._render);
		assert.isFunction(Scene.animate);
		assert.isFunction(Scene.cancelAnimate);
		assert.isFunction(Scene.addToScene);
		assert.isFunction(Scene.onResize);
	});

	it('should have a set of properties', () => {
		assert.deepEqual(Scene.animateFunctions, []);
		assert.deepEqual(Scene.collidableMeshes, []);
		assert.equal(Scene._animationFrameID, 0);
	});

	describe('#init', () => {

		let addEventListener;
		let canvas;

		beforeEach(() => {
			addEventListener = Window.prototype.addEventListener;
			Window.prototype.addEventListener = sinon.stub();
			scene.onResize = sinon.stub();
			scene.animate = sinon.stub();
			
			canvas = document.createElement('canvas');

			scene.init(canvas, 'myscene.json');
		});

		afterEach(() => {
			Window.prototype.addEventListener = addEventListener;
		});

		it('should set some properties', () => {
			assert.instanceOf(scene.renderer, THREE.WebGLRenderer);
			assert.instanceOf(scene.scene, THREE.Scene);
            assert.instanceOf(scene.camera, THREE.PerspectiveCamera);
            assert.instanceOf(scene.vrEffect, VREffect);
		});

		it('should add a resize handler on window', () => {
			// Other calls are with 'vrdisplaypresentchange'
			assert.isTrue(Window.prototype.addEventListener.called);
			assert.isTrue(Window.prototype.addEventListener.thirdCall.calledWith('resize'));
		});

		it('should call animate', () => {
			assert.isTrue(scene.animate.calledOnce);
		});
	});

	describe('#addToScene', () => {

		let meshes;

		beforeEach(() => {
			meshes = ['mesh1', 'mesh2'];
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

	describe('#_setupMeshes', () => {

		const mesh = {
			children: [{
				isObject3D: true,
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
