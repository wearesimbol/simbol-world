'use strict';

import * as THREE from 'three';
import EventEmitter from 'eventemitter3';
import {VRControls} from '../../src/libs/VRControls';
import {Identity} from '../../src/virtualpersona/identity';
import {MultiVP} from '../../src/virtualpersona/multivp';
import {Loader} from '../../src/utils/loader';
import {Physics} from '../../src/physics/physics';
import {VirtualPersona} from '../../src/virtualpersona/virtualpersona';

describe('VirtualPersona', () => {

	let vp;

	beforeEach(() => {
		sinon.spy(EventEmitter.prototype, 'emit');
		sinon.spy(EventEmitter.prototype, 'on');

		vp = new VirtualPersona();
	});

	afterEach(() => {
		EventEmitter.prototype.emit.restore();
		EventEmitter.prototype.on.restore();
	});

	it('should be a class', () => {
		assert.isFunction(VirtualPersona);
	});

	it('should have a set of methods', () => {
		assert.isFunction(VirtualPersona.prototype.init);
		assert.isFunction(VirtualPersona.prototype.loadMesh);
		assert.isFunction(VirtualPersona.prototype._setUpMesh);
		assert.isFunction(VirtualPersona.prototype.render);
		assert.isFunction(VirtualPersona.prototype.signIn);
		assert.isFunction(VirtualPersona.prototype.signOut);
		assert.isFunction(VirtualPersona.prototype.setFloorHeight);
	});

	it('should have a set of properties', () => {
		assert.equal(VirtualPersona.prototype.floorHeight, 0);
		assert.equal(VirtualPersona.prototype.userHeight, 1.7);
		assert.equal(VirtualPersona.prototype.climbableHeight, 0.4);
	});

	describe('#constructor', () => {

		it('should initialize EventEmitter', () => {
			assert.instanceOf(vp.__proto__, EventEmitter);
		});


		it('should set some properties', () => {
			assert.deepEqual(vp._feetPosition, new THREE.Vector3());
			assert.instanceOf(vp.fakeCamera, THREE.Object3D);
			assert.instanceOf(vp.vrControls, VRControls);
			assert.instanceOf(vp._floorRayCaster, THREE.Raycaster);
			assert.equal(vp._floorRayCaster.far, 11.7);
			assert.instanceOf(vp.identity, Identity);
			assert.instanceOf(vp.multiVP, MultiVP);
			assert.equal(vp.multiVP.vp, vp);
			assert.isTrue(EventEmitter.prototype.on.calledThrice);
			assert.isTrue(EventEmitter.prototype.on.firstCall.calledWith('add'));
			assert.isTrue(EventEmitter.prototype.on.secondCall.calledWith('remove'));
			assert.isTrue(EventEmitter.prototype.on.thirdCall.calledWith('addanimatefunctions'));
		});

		it('should forward MultiVP.add event', (done) => {
			const event = {mesh: 1};
			vp.on('add', (fwdevent) => {
				assert.equal(fwdevent, event);
				done();
			});
			vp.multiVP.emit('add', event);
		});

		it('should forward MultiVP.remove event', (done) => {
			const event = {mesh: 1};
			vp.on('remove', (fwdevent) => {
				assert.equal(fwdevent, event);
				done();
			});
			vp.multiVP.emit('remove', event);
		});

		it('should forward MultiVP.addanimatefunctions event', (done) => {
			const event = {addanimatefunctions: 1};
			vp.on('addanimatefunctions', (fwdevent) => {
				assert.equal(fwdevent, event);
				done();
			});
			vp.multiVP.emit('addanimatefunctions', event);
		});
	});

	describe('#init', () => {

		beforeEach((done) => {
			sinon.stub(vp, 'loadMesh').returns(Promise.resolve());
			vp.init().then(done);
		});

		it('should load mesh', () => {
			assert.isTrue(vp.loadMesh.calledOnce);
			assert.isTrue(vp.loadMesh.calledWith('https://holonet.one/assets/models/AnonymousVP.gltf', true));
		});
	});

	describe('#loadMesh', () => {

		const mesh = {};

		beforeEach((done) => {
			sinon.stub(Loader.prototype, 'load');
			
			Loader.prototype.load.returns(new Promise((resolve) => {
				resolve(mesh);
			}));

			sinon.stub(vp, '_setUpMesh').returns(mesh);
			sinon.stub(vp, 'render');

			vp.loadMesh(1, true)
				.then(() => { done(); });
		});

		afterEach(() => {
			Loader.prototype.load.restore();
		})

		it('should load mesh', () => {
			// assert.isTrue(Loader.calledWith(1));
			assert.isTrue(Loader.prototype.load.calledOnce);
		});

		it('should call _setUpMesh', () => {
			assert.isTrue(vp._setUpMesh.calledOnce);
			assert.isTrue(vp._setUpMesh.calledWith(mesh));
		});

		it('should render mesh', () => {
			assert.isTrue(vp.render.calledOnce);
			assert.isTrue(vp.render.calledWith(mesh));
		});
	});

	describe('#_setUpMesh', () => {

		const mesh = {
			scale: new THREE.Vector3(),
			position: new THREE.Vector3(),
			children: [{
				isMesh: true,
				material: {},
				geometry: {}
			}]
		};

		beforeEach(() => {
			mesh.children[0].geometry.computeFaceNormals = sinon.stub();

			vp._setUpMesh(mesh);
		});

		it('should set some properties', () => {
			assert.equal(mesh.name, 'HolonetVirtualPersona');
			assert.deepEqual(mesh.scale, new THREE.Vector3(1, 1, 1));
			assert.deepEqual(mesh.position, new THREE.Vector3(0, 0, 0));
		});

		it('should render children properly', () => {
			assert.isTrue(mesh.children[0].geometry.computeFaceNormals.calledOnce);
			assert.isTrue(mesh.children[0].castShadow);
			assert.isTrue(mesh.children[0].receiveShadow);
		});
	});

	describe('#render', () => {

		let mesh;
	
		beforeEach(() => {
			sinon.stub(THREE.Box3.prototype, 'setFromObject').returns({
				max: 1,
				min: 1
			});
			mesh = {
				getObjectByName: sinon.stub()
			};
			mesh.getObjectByName.withArgs('VirtualPersonaHead').returns(1);
			mesh.getObjectByName.withArgs('VirtualPersonaBody').returns(2);
		});

		afterEach(() => {
			THREE.Box3.prototype.setFromObject.restore();
		});

		describe('common', () => {
			
			beforeEach(() => {
				vp.render(mesh);
			});

			it('should save meshes', () => {
				assert.equal(vp.mesh, mesh);
				assert.isTrue(mesh.getObjectByName.calledTwice);
				assert.isTrue(mesh.getObjectByName.firstCall.calledWith('VirtualPersonaHead'));
				assert.equal(vp.headMesh, 1);
				assert.isTrue(mesh.getObjectByName.secondCall.calledWith('VirtualPersonaBody'));
				assert.equal(vp.bodyMesh, 2);
			});

			it('should add mesh to the scene', () => {
				// Called in constructor via MultiVP
				assert.isTrue(EventEmitter.prototype.emit.calledTwice);
				assert.isTrue(EventEmitter.prototype.emit.calledWith('add'));
				assert.deepEqual(EventEmitter.prototype.emit.secondCall.args[1], {
					mesh: mesh
				});
			});
		});

		describe('saved mesh', () => {

			beforeEach(() => {
				vp.mesh = true;
				vp.render(mesh);
			});

			it('should remove saved mesh', () => {
				// Called in constructor via MultiVP
				assert.isTrue(EventEmitter.prototype.emit.calledThrice);
				assert.isTrue(EventEmitter.prototype.emit.calledWith('remove'));
				assert.deepEqual(EventEmitter.prototype.emit.secondCall.args[1], {
					mesh: true
				});
			});
		});
	});

	describe('#signIn', () => {

		let promise;

		beforeEach((done) => {
			vp.identity = {
				signIn: sinon.stub().returns(Promise.resolve())
			};
			sinon.stub(vp, 'loadMesh').returns(Promise.resolve());
	
			promise = vp.signIn().then(done);
		});

		it('should sign in and load mesh', () => {
			assert.isTrue(vp.identity.signIn.calledOnce);
			assert.isTrue(vp.loadMesh.calledOnce);
		});

		it('should return a promise', () => {
			assert.instanceOf(promise, Promise);
		});
	});

	describe('#signOut', () => {

		let promise;

		beforeEach((done) => {
			vp.identity = {
				signOut: sinon.stub().returns(Promise.resolve())
			};
			sinon.stub(vp, 'loadMesh').returns(Promise.resolve());
	
			promise = vp.signOut().then(done);
		});

		it('should sign in and load mesh', () => {
			assert.isTrue(vp.identity.signOut.calledOnce);
		});

		it('should return a promise', () => {
			assert.instanceOf(promise, Promise);
		});
	});

	describe('#_setFloorHeight', () => {

		beforeEach(() => {
			sinon.stub(Physics, 'checkRayCollision');
			Physics.checkRayCollision.returns({
				point: {
					y: 1
				}
			});

			vp._floorRayCaster = {
				set: sinon.stub()
			};

			const scene = {
				camera: {
					position: {
						y: 1
					}
				},
				scene: 1
			};

			vp._feetPosition = {
				copy: sinon.stub(),
				setY: sinon.stub(),
				y: 1.7
			};

			vp.setFloorHeight(scene);
		});

		afterEach(() => {
			Physics.checkRayCollision.restore();
		});

		it('should set _feetPosition', () => {
			assert.isTrue(vp._feetPosition.copy.calledOnce);
			assert.deepEqual(vp._feetPosition.copy.firstCall.args[0], {y: 1});
			assert.isTrue(vp._feetPosition.setY.calledOnce);
			assert.isTrue(vp._feetPosition.setY.calledWith(0.4));
		});

		it('should set rayCaster', () => {
			assert.isTrue(vp._floorRayCaster.set.calledOnce);
			assert.deepEqual(vp._floorRayCaster.set.firstCall.args[0], vp._feetPosition);
			assert.deepEqual(vp._floorRayCaster.set.firstCall.args[1], new THREE.Vector3(0, -1, 0));
		});

		it('should checkRayCollision', () => {
			assert.isTrue(Physics.checkRayCollision.calledOnce);
			assert.equal(Physics.checkRayCollision.firstCall.args[0], vp._floorRayCaster);
			assert.equal(Physics.checkRayCollision.firstCall.args[1], 1);

		});

		it('should update floorHeight', () => {
			assert.equal(vp.floorHeight, 1);
		});
	});
});
