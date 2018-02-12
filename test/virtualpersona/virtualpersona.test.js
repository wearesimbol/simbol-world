'use strict';

import * as THREE from 'three';
import {VRControls} from '../../src/libs/VRControls';
import {Locomotion} from '../../src/virtualpersona/locomotion/locomotion';
import {Interactions} from '../../src/virtualpersona/interactions/interactions';
import {Identity} from '../../src/virtualpersona/identity';
import {MultiVP} from '../../src/virtualpersona/multivp';
import {Scene} from '../../src/scene/scene';
import {Loader} from '../../src/utils/loader';
import {Physics} from '../../src/physics/physics';
import {VirtualPersona} from '../../src/virtualpersona/virtualpersona';

describe('VirtualPersona', () => {

	let vp;
	let scene;

	beforeEach(() => {
		scene = Object.create(Scene);

		vp = Object.create(VirtualPersona);
	});

	it('should be an object', () => {
		assert.isObject(VirtualPersona);
	});

	it('should have a set of methods', () => {
		assert.isFunction(VirtualPersona.init);
		assert.isFunction(VirtualPersona.loadMesh);
		assert.isFunction(VirtualPersona._setUpVP);
		assert.isFunction(VirtualPersona.render);
		assert.isFunction(VirtualPersona._setUpMesh);
		assert.isFunction(VirtualPersona.signIn);
		assert.isFunction(VirtualPersona.signOut);
		assert.isFunction(VirtualPersona._setFloorHeight);
		assert.isFunction(VirtualPersona.animate);
	});

	it('should have a set of properties', () => {
		assert.equal(VirtualPersona.floorHeight, 0);
		assert.equal(VirtualPersona.userHeight, 1.7);
		assert.equal(VirtualPersona.climbableHeight, 0.4);
		assert.deepEqual(VirtualPersona._feetPosition, new THREE.Vector3());
	});

	describe('#init', () => {

		beforeEach(() => {
			sinon.stub(Interactions, 'init');
			sinon.stub(Identity, 'init');
			sinon.stub(MultiVP, 'init');
			sinon.stub(vp, 'loadMesh').returns(Promise.resolve());
			sinon.stub(vp, '_setUpVP');
		});

		afterEach(() => {
			Interactions.init.restore();
			Identity.init.restore();
			MultiVP.init.restore();
		});

		describe('defaults options', () => {

			beforeEach(() => {
				vp.init(scene);
			});
	
			it('should save the scene and set some properties', () => {
				assert.equal(vp.scene, scene);
				assert.deepEqual(vp.locomotion, Object.create(Locomotion));
				assert.instanceOf(vp._floorRayCaster, THREE.Raycaster);
				assert.equal(vp._floorRayCaster.far, 11.7);
				assert.instanceOf(vp.fakeCamera, THREE.Object3D);
				assert.instanceOf(vp.vrControls, VRControls);
				assert.isTrue(Interactions.init.calledOnce);
				assert.isTrue(Identity.init.calledOnce);
				assert.isTrue(MultiVP.init.calledOnce);
				assert.deepEqual(MultiVP.init.firstCall.args[0], {});
				assert.equal(MultiVP.init.firstCall.args[1], vp);
			});
		});

		describe('load mesh', () => {

			beforeEach((done) => {
				vp.init(scene).then(done);
			});

			it('should load mesh', () => {
				assert.isTrue(vp.loadMesh.calledOnce);
				assert.isTrue(vp.loadMesh.calledWith('assets/models/AnonymousVP.gltf', true));
				assert.isTrue(vp._setUpVP.calledOnce);
			});
		});

		describe('no Scene provided', () => {

			let error;

			beforeEach((done) => {
                sinon.spy(vp, 'init');

                vp.init().catch((e) => {
					error = e;
					done();
				}); 
			});

			it('should throw an error', () => {
				assert.equal(error, 'A Holonet.Scene is required to set up a VirtualPersona');
			});
		});

		describe('non Holonet.Scene provided', () => {

			let error;

			beforeEach((done) => {
                sinon.spy(vp, 'init');

                vp.init().catch((e) => {
					error = e;
					done();
				}); 
			});

			it('should throw an error', () => {
				assert.equal(error, 'A Holonet.Scene is required to set up a VirtualPersona');
			});
		});
	});

	describe('#loadMesh', () => {

		const mesh = {};

		beforeEach((done) => {
			sinon.stub(Loader, 'init');
			sinon.stub(Loader, 'load');
			
			Loader.load.returns(new Promise((resolve) => {
				resolve(mesh);
			}));

			sinon.stub(vp, '_setUpMesh').returns(mesh);
			sinon.stub(vp, 'render');

			vp.loadMesh(1, true)
				.then(() => { done(); });
		});

		afterEach(() => {
			Loader.init.restore();
			Loader.load.restore();
		})

		it('should load mesh', () => {
			assert.isTrue(Loader.init.calledOnce);
			assert.isTrue(Loader.init.calledWith(1));
			assert.isTrue(Loader.load.calledOnce);
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

	describe('#_setUpVP', () => {

		let returnValue;

		beforeEach((done) => {
			scene.addAnimateFunctions = sinon.stub();
			scene.addToScene = sinon.stub();
			vp.scene = scene;
			vp.locomotion = {
				init: sinon.stub()
			};
			vp.interactions = {
				getMeshes: sinon.stub().returns([1])
			};

			returnValue = vp._setUpVP().then(done);
		});

		it('should initialise locomotion passing in the vp', () => {
			assert.isTrue(vp.locomotion.init.calledOnce);
			assert.isTrue(vp.locomotion.init.calledWith(vp));
		});

		it('should add mesh to the scene', () => {
			assert.isTrue(vp.scene.addToScene.calledOnce);
			assert.deepEqual(vp.scene.addToScene.firstCall.args[0], [1]);
			assert.isTrue(vp.interactions.getMeshes.calledOnce);
		});

		it('should add animate to scene animate functions', () => {
			assert.isTrue(scene.addAnimateFunctions.calledOnce);
		});

		it('should return a promise', () => {
			assert.instanceOf(returnValue, Promise);
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

			sinon.stub(vp, '_setUpMesh').returns(mesh);

			scene.addToScene = sinon.stub();
			scene.scene = {
				remove: sinon.stub()
			};
			vp.scene = scene;
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
				assert.isTrue(vp.scene.addToScene.calledOnce);
				assert.deepEqual(vp.scene.addToScene.firstCall.args, [mesh, false]);
			});
		});

		describe('saved mesh', () => {

			beforeEach(() => {
				vp.mesh = true;
				vp.render(mesh);
			});

			it('should remove saved mesh', () => {
				assert.isTrue(vp.scene.scene.remove.calledOnce);
				assert.isTrue(vp.scene.scene.remove.calledWith(true));
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

			vp.scene = {
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

			vp._setFloorHeight();
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
	
	describe('#animate', () => {

		beforeEach(() => {
			sinon.stub(THREE.Vector3.prototype, 'set');
			sinon.stub(THREE.Vector3.prototype, 'applyQuaternion');
			sinon.stub(Physics, 'checkMeshCollision').returns(false);

			vp.vrControls = {
				update: sinon.stub()
			};

			vp.locomotion = {
				phi: 1,
				theta: 1,
				translatingZ: 1,
				translatingX: 1,
				orientation: {
					quaternion: 1,
					euler: {
						y: 1
					}
				},
				teleportation: {
					isRayCurveActive: true,
					isTeleportActive: true,
					hitPoint: {
						x: 1,
						y: 0,
						z: 2
					},
					updateRayCurve: sinon.stub(),
					resetTeleport: sinon.stub()
				},
				controllers: {
					currentControllers: {
						'Test Controller': {
							update: sinon.stub()
						},

						'Test Controller 2': {
							update: sinon.stub()
						}
					}
				}
			};

			vp.fakeCamera = {
				quaternion: 2,
				position: {
					applyQuaternion: sinon.stub()
				}
			};
			vp.fakeCamera.position.applyQuaternion.returns(new THREE.Quaternion());

			vp.scene = {
				camera: {
					rotation: {
						set: sinon.stub(),
						y: 1,
						copy: sinon.stub()
					},
					position: {
						setX: sinon.stub(),
						setY: sinon.stub(),
						setZ: sinon.stub(),
						copy: sinon.stub(),
						equals: sinon.stub().returns(false),
						add: sinon.stub(),
						y: 0
					},
					quaternion: {
						copy: sinon.stub(),
						multiply: sinon.stub()
					},
					translateZ: sinon.stub(),
					translateX: sinon.stub()
				},
				vrEffect: {
					isPresenting: false
				}
			};

			vp.interactions = {
				update: sinon.stub()
			};

			vp.multiVP = {
				sendData: sinon.stub()
			}

			vp.mesh = {
				rotation: {
					y: 0
				},
				position: {
					copy: sinon.stub(),
					setY: sinon.stub()
				}
			};
			vp.mesh.position.copy.returns(vp.mesh.position);
			vp.headMesh = {
				position: {
					y: 0
				}
			};
			vp.floorHeight = 0;

			vp._setFloorHeight = sinon.stub();
		});

		afterEach(() => {
			THREE.Vector3.prototype.set.restore();
			THREE.Vector3.prototype.applyQuaternion.restore();
			Physics.checkMeshCollision.restore();
		});

		describe('general', () => {

			beforeEach(() => {
				vp.animate(1000);
			});

			it('should handle position', () => {
				assert.isTrue(vp.scene.camera.position.copy.calledOnce);
			});
			
			it('should update the camera\'s position', () => {
				assert.isTrue(vp.scene.camera.translateZ.calledOnce);
				assert.isTrue(vp.scene.camera.translateZ.calledWith(0));
	
				assert.isTrue(vp.scene.camera.translateX.calledOnce);
				assert.isTrue(vp.scene.camera.translateX.calledWith(0));
			});

			it('should handle collisions', () => {
				assert.isTrue(Physics.checkMeshCollision.calledOnce);
				assert.equal(Physics.checkMeshCollision.firstCall.args[0], vp.mesh);
			});

			it('should handle the teleportation ray curve', () => {
				assert.isTrue(vp.locomotion.teleportation.updateRayCurve.calledOnce);
				assert.isTrue(vp.locomotion.teleportation.updateRayCurve.calledWith(vp.scene.camera));
			});

			it('should handle teleportation', () => {
				assert.isTrue(vp.scene.camera.position.setX.calledOnce);
				assert.isTrue(vp.scene.camera.position.setY.calledTwice);
				assert.isTrue(vp.scene.camera.position.setZ.calledOnce);
				assert.isTrue(vp.scene.camera.position.setX.calledWith(1));
				assert.isTrue(vp.scene.camera.position.setY.calledWith(1.7));
				assert.isTrue(vp.scene.camera.position.setZ.calledWith(2));
				assert.isTrue(vp.locomotion.teleportation.resetTeleport.calledOnce);
			});

			it('should set floor height', () => {
				assert.isTrue(vp._setFloorHeight.calledOnce);
			});

			it('should fix the camera\'s height', () => {
				assert.isTrue(vp.scene.camera.position.setY.calledTwice);
				assert.isTrue(vp.scene.camera.position.setY.calledWith(1.7));
			});
			
			it('should set the camera\'s rotation', () => {
				assert.isTrue(vp.scene.camera.rotation.copy.calledOnce);
				assert.isTrue(vp.scene.camera.rotation.copy.calledWith(vp.locomotion.orientation.euler));
			});

			it('should set the mesh\'s rotation', () => {
				assert.equal(vp.mesh.rotation.y, Math.PI + 1);
			});

			it('should set the mesh\'s position', () => {
				assert.isTrue(vp.mesh.position.copy.calledOnce);
				assert.isTrue(vp.mesh.position.copy.calledWith(vp.scene.camera.position));

				assert.isTrue(vp.mesh.position.setY.calledOnce);
				assert.isTrue(vp.mesh.position.setY.calledWith(0));
			});

			it('should send data via multiVP', () => {
				assert.isTrue(vp.multiVP.sendData.calledOnce);
				assert.isTrue(vp.multiVP.sendData.calledWith(vp.mesh));
			});

			it('should update interactions', () => {
				assert.isTrue(vp.interactions.update.calledOnce);
				assert.isTrue(vp.interactions.update.calledWith(vp.scene.camera.position, vp.scene.camera.quaternion));
			});

			it('should update controllers', () => {
				assert.isTrue(vp.locomotion.controllers.currentControllers['Test Controller'].update.calledOnce);
				assert.isTrue(vp.locomotion.controllers.currentControllers['Test Controller 2'].update.calledOnce);
			});
		});

		describe('isPresenting', () => {

			beforeEach(() => {
				vp.scene.vrEffect.isPresenting = true;

				vp.animate(1000);
			});
			
			it('should update VRControls', () => {
				assert.isTrue(vp.vrControls.update.calledOnce);
			});

			it('should set the camera\'s rotation', () => {
				assert.isTrue(vp.scene.camera.position.add.calledOnce);
				assert.deepEqual(vp.scene.camera.position.add.firstCall.args[0], new THREE.Quaternion());
				assert.isTrue(vp.scene.camera.quaternion.multiply.calledOnce);
				assert.isTrue(vp.scene.camera.quaternion.multiply.calledWith(2));
			});

			it('should set the mesh\'s rotation', () => {
				assert.equal(vp.mesh.rotation.y, Math.PI + 1);
			});
		});
	});
});
