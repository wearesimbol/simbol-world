'use strict';

import * as THREE from 'three';
import {Teleportation} from '../../src/locomotion/_teleportation';
import {Physics} from '../../src/physics/physics';

describe('Teleportation', () => {

	let teleportation;

	beforeEach(() => {
		sinon.stub(Teleportation.prototype, 'renderRayCurve').returns(1);
		sinon.stub(Teleportation.prototype, 'renderHitCylinder').returns(2);

		teleportation = new Teleportation();
	});

	afterEach(() => {
		Teleportation.prototype.renderRayCurve.restore && Teleportation.prototype.renderRayCurve.restore();
		Teleportation.prototype.renderHitCylinder.restore && Teleportation.prototype.renderHitCylinder.restore();
	});

	it('should be a class', () => {
		assert.isFunction(Teleportation);
	});

	it('should have a set of methods', () => {
		assert.isFunction(Teleportation.prototype.setRayCurveState);
		assert.isFunction(Teleportation.prototype.activateTeleport);
		assert.isFunction(Teleportation.prototype.resetTeleport);
		assert.isFunction(Teleportation.prototype._parabolicCurveScalar);
		assert.isFunction(Teleportation.prototype._parabolicCurve);
		assert.isFunction(Teleportation.prototype._setRayCurvePoint);
		assert.isFunction(Teleportation.prototype._isValidNormalsAngle);
		assert.isFunction(Teleportation.prototype._setDirection);
		assert.isFunction(Teleportation.prototype.renderRayCurve);
		assert.isFunction(Teleportation.prototype.renderHitCylinder);
		assert.isFunction(Teleportation.prototype.updateRayCurve);
	});

	it('should have a set of properties', () => {
		assert.equal(Teleportation.prototype.rayCurvePoints, 30);
		assert.equal(Teleportation.prototype.rayCurveWidth, 0.025);
		assert.equal(Teleportation.prototype.hitCylinderRadius, 0.25);
		assert.equal(Teleportation.prototype.hitCylinderHeight, 0.3);
		assert.equal(Teleportation.prototype.maxAngle, 45);
		assert.deepEqual(Teleportation.prototype.hitColor, new THREE.Color('#99ff99'));
		assert.deepEqual(Teleportation.prototype.missColor, new THREE.Color('#ff0000'));
		assert.equal(Teleportation.prototype.velocity, 5);
		assert.equal(Teleportation.prototype.acceleration, -9.8);
		assert.equal(Teleportation.prototype.isRayCurveActive, false);
		assert.equal(Teleportation.prototype.isTeleportActive, false);
		assert.equal(Teleportation.prototype.hitPoint, false);
	});

	describe('#constructor', () => {

		it('should set some properties', () => {
			assert.deepEqual(teleportation._direction, new THREE.Vector3());
			assert.deepEqual(teleportation._shootAxis, new THREE.Vector3().set(0, 0, -1));
			assert.deepEqual(teleportation._referenceNormal, new THREE.Vector3().set(0, 1, 0));
			assert.equal(teleportation._teleportActivationTimeout, 0.5);
			assert.deepEqual(teleportation.rayCaster, new THREE.Raycaster());
			assert.equal(teleportation.rayCurve, 1);
			assert.isTrue(teleportation.renderRayCurve.calledOnce);
			assert.equal(teleportation.hitCylinder, 2);
			assert.isTrue(teleportation.renderHitCylinder.calledOnce);
		});
	});

	describe('#setRayCurveState', () => {

		beforeEach(() => {
			teleportation.setRayCurveState(true);
		});

		it('should activate the ray curve', () => {
			assert.isTrue(teleportation.isRayCurveActive);
		});
	});

	describe('#activateTeleport', () => {

		beforeEach(() => {
			// Avoids debouncing
			teleportation.activateTeleport = Teleportation.prototype.activateTeleport;
			teleportation.activateTeleport();
		});

		it('should activate teleport', () => {
			assert.isTrue(teleportation.isTeleportActive);
		});
	});

	describe('#resetTeleport', () => {

		beforeEach(() => {
			sinon.stub(window, 'clearTimeout');
			teleportation.activateTeleport.id = 1;
			teleportation.rayCurve = {};
			teleportation.hitCylinder = {};

			teleportation.resetTeleport();
		});

		afterEach(() => {
			window.clearTimeout.restore();
		});

		it('should reset teleport', () => {
			assert.isFalse(teleportation.isRayCurveActive);
			assert.isFalse(teleportation.isTeleportActive);
			assert.isTrue(window.clearTimeout.calledOnce);
			assert.isTrue(window.clearTimeout.calledWith(1));
			assert.isFalse(teleportation.hitPoint);
			assert.isFalse(teleportation.rayCurve.visible);
			assert.isFalse(teleportation.hitCylinder.visible);
		});
	});

	describe('#_parabolicCurveScalar', () => {

		let scalar;

		beforeEach(() => {
			scalar = teleportation._parabolicCurveScalar(5, 4, 3, 2);
		});

		it('should calculate the parabolic curve value', () => {
			assert.equal(scalar, 19);
		});
	});

	describe('#_parabolicCurve', () => {

		const point = new THREE.Vector3().set(1, 2, 3);
		const velocity = new THREE.Vector3().set(1, 2, 3);
		const acceleration = -5;
		const time = 2;
		let returnedVector;

		beforeEach(() => {
			sinon.stub(teleportation, '_parabolicCurveScalar').returns(1);
			teleportation.acceleration = acceleration;
			
			returnedVector = teleportation._parabolicCurve(point, velocity, time);
		});

		afterEach(() => {
			teleportation._parabolicCurveScalar.restore();
		});

		it('should return a vector with the parabolic curve calculated for each axis', () => {
			assert.deepEqual(returnedVector, new THREE.Vector3().set(1, 1, 1));
			assert.isTrue(teleportation._parabolicCurveScalar.calledThrice);
			assert.isTrue(teleportation._parabolicCurveScalar.firstCall.calledWith(1, 1, 0, 2));
			assert.isTrue(teleportation._parabolicCurveScalar.secondCall.calledWith(2, 2, -5, 2));
			assert.isTrue(teleportation._parabolicCurveScalar.thirdCall.calledWith(3, 3, 0, 2));
		});
	});
	
	describe('#_setRayCurvePoint', () => {

		let rayCurve;
		let point;
		let direction;

		beforeEach(() => {
			rayCurve = {
				vertices: [],
				geometry: {
					attributes: {
						position: {
							needsUpdate: false
						}
					}
				}
			};
			point = new THREE.Vector3().set(1, 1, 1);
			direction = new THREE.Vector3().set(0, 1, 0);
			teleportation.rayCurve = rayCurve;
			teleportation._direction = direction;
			teleportation._setRayCurvePoint(1, point);
		});

		it('should set all positions in the curve for a specific point', () => {
			assert.deepEqual(rayCurve.vertices, [1, 2, 1, 1, 0, 1]);
			assert.isTrue(rayCurve.geometry.attributes.position.needsUpdate);
		});
	});

	describe('#_isValidNormalsAngle', () => {

		let collision;
		let validCollision;
		let vectorClone;

		beforeEach(() => {
			sinon.stub(THREE.Matrix3.prototype, 'getNormalMatrix');
			vectorClone = {
				applyMatrix3: sinon.stub().returns(new THREE.Vector3().set(0.1, 0.2, 0.1))
			};
			collision = {
				object: {
					matrixWorld: []
				},
				face: {
					normal: {
						clone: sinon.stub().returns(vectorClone)
					}
				}
			};
			validCollision = teleportation._isValidNormalsAngle(collision);
		});
		
		afterEach(() => {
			THREE.Matrix3.prototype.getNormalMatrix.restore();
		});

		it('should get the correct collisionNormal', () => {
			assert.isTrue(THREE.Matrix3.prototype.getNormalMatrix.calledOnce);
			assert.isTrue(THREE.Matrix3.prototype.getNormalMatrix.calledWith(collision.object.matrixWorld));
			assert.isTrue(collision.face.normal.clone.calledOnce);
			assert.isTrue(vectorClone.applyMatrix3.calledOnce);
		});

		it('should check if it is a collision at an angle less than maxAngle', () => {
			assert.isTrue(validCollision);
		});
	});
	
	describe('#_setDirection', () => {

		beforeEach(() => {
			const direction = new THREE.Vector3().set(1, 1, 1);

			teleportation._setDirection(direction);
		});

		it('should set the direction after some transformations', () => {
			assert.deepEqual(teleportation._direction, new THREE.Vector3().set(-0.008838834764831844, 0, 0.008838834764831844));
		});
	});

	describe('#renderRayCurve', () => {

		let mesh;

		beforeEach(() => {
			Teleportation.prototype.renderRayCurve.restore();

			mesh = teleportation.renderRayCurve();
		});

		it('should return a mesh with correct attributes', () => {
			assert.instanceOf(mesh, THREE.Mesh);
			assert.instanceOf(mesh.geometry, THREE.BufferGeometry);
			assert.instanceOf(mesh.geometry.attributes.position, THREE.BufferAttribute);
			assert.equal(mesh.geometry.attributes.position.array.length, 180);
			assert.equal(mesh.geometry.attributes.position.itemSize, 3);
			assert.isTrue(mesh.geometry.attributes.position.dynamic);
			assert.instanceOf(mesh.material, THREE.MeshBasicMaterial);
			assert.equal(mesh.material.side, THREE.DoubleSide);
			assert.equal(mesh.material.color.getHex(), 0xff0000);
			assert.equal(mesh.drawMode, THREE.TriangleStripDrawMode);
			assert.equal(mesh.vertices.length, 180);
			assert.isFalse(mesh.frustumCulled);
			assert.isFalse(mesh.visible);
		});
	});

	describe('#renderHitCylinder', () => {

		let mesh;

		beforeEach(() => {
			Teleportation.prototype.renderHitCylinder.restore();

			mesh = teleportation.renderHitCylinder();
		});

		it('should return a mesh with correct attributes', () => {
			assert.instanceOf(mesh, THREE.Group);
			assert.isFalse(mesh.visible);

			const actualMesh = mesh.children[0];
			assert.instanceOf(actualMesh, THREE.Mesh);
			assert.instanceOf(actualMesh.geometry, THREE.CylinderGeometry);
			assert.equal(actualMesh.geometry.parameters.radiusTop, 0.25);
			assert.equal(actualMesh.geometry.parameters.radiusBottom, 0.25);
			assert.equal(actualMesh.geometry.parameters.height, 0.3);
			assert.equal(actualMesh.geometry.parameters.radialSegments, 8);
			assert.equal(actualMesh.geometry.parameters.heightSegments, 1);
			assert.isTrue(actualMesh.geometry.parameters.openEnded);
			assert.instanceOf(actualMesh.material, THREE.MeshBasicMaterial);
			assert.equal(actualMesh.material.side, THREE.DoubleSide);
			assert.equal(actualMesh.material.color.getHexString(), '99ff99');
			assert.deepEqual(actualMesh.position, new THREE.Vector3().set(0, 0.15, 0));
		});
	});

	describe('#updateRayCurve', () => {

		let rayCurve;
		let hitCylinder;
		let rayCaster;
		let controller;
		let scene;

		beforeEach(() => {
			sinon.stub(teleportation, '_setDirection');
			sinon.stub(teleportation, '_setRayCurvePoint');
			sinon.stub(teleportation, '_parabolicCurve');
			teleportation._parabolicCurve.returns(new THREE.Vector3().set(2, 2, 2));

			rayCurve = {
				visible: false,
				material: {
					color: {
						set: sinon.stub()
					}
				}
			};
			hitCylinder = {
				visible: false,
				position: {
					copy: sinon.stub()
				}
			};
			rayCaster = {
				far: 0,
				set: sinon.stub()
			};
			controller = new THREE.Object3D();
			scene = 1;
			sinon.stub(controller, 'getWorldQuaternion').returns(new THREE.Quaternion().set(1, 1, 1, 1));
			sinon.stub(controller.position, 'clone').returns(new THREE.Vector3().set(1, 1, 1));

			teleportation.rayCurve = rayCurve;
			teleportation.rayCaster = rayCaster;
			teleportation.hitCylinder = hitCylinder;
		});

		afterEach(() => {
			teleportation._setDirection.restore();
			teleportation._setRayCurvePoint.restore();
			teleportation._parabolicCurve.restore();
		});

		describe('incorrect controller', () => {

			let testController;

			beforeEach(() => {
				sinon.stub(teleportation, 'setRayCurveState');
			});

			afterEach(() => {
				teleportation.setRayCurveState.restore();
			});

			describe('no controller', () => {

				beforeEach(() => {
					teleportation.updateRayCurve();
				});

				it('should fail and remove ray curve', () => {
					assert.isTrue(teleportation.setRayCurveState.calledOnce);
					assert.isTrue(teleportation.setRayCurveState.calledWith(false));
				});
			});

			describe('controller is not an Object3D', () => {

				beforeEach(() => {
					testController = {
						model: {}
					};
					teleportation.updateRayCurve(testController);
				});

				it('should fail and remove ray curve', () => {
					assert.isTrue(teleportation.setRayCurveState.calledOnce);
					assert.isTrue(teleportation.setRayCurveState.calledWith(false));
				});
			});
		});

		describe('no intersection', () => {

			beforeEach(() => {
				sinon.stub(window, 'clearTimeout');
				sinon.stub(Physics, 'checkRayCollision');
				Physics.checkRayCollision.returns(false);
				teleportation.activateTeleport.id = 1;
				teleportation.rayCurvePoints = 1;

				teleportation.updateRayCurve(controller, scene);
			});

			afterEach(() => {
				teleportation.rayCurvePoints = 30;
				window.clearTimeout.restore();
				Physics.checkRayCollision.restore();
			});

			it('should set up a rayCurve', () => {
				assert.isTrue(rayCurve.visible);
				assert.deepEqual(rayCurve.material.color.set.args[0], [teleportation.missColor]);
				assert.isTrue(teleportation._setDirection.calledOnce);
				assert.deepEqual(teleportation._setDirection.firstCall.args[0], new THREE.Vector3().set(-1, 0, 0));
			});

			it('should set up the rayCaster', () => {
				assert.equal(teleportation._parabolicCurve.callCount, 1);
				assert.deepEqual(teleportation._parabolicCurve.lastCall.args[0].toArray(), [1, 1, 1]);
				assert.deepEqual(teleportation._parabolicCurve.lastCall.args[1].toArray(), [-5, 0, 0]);
				assert.equal(teleportation._parabolicCurve.lastCall.args[2], 1);
				assert.equal(rayCaster.far, 1);
				assert.equal(rayCaster.set.callCount, 1);
				assert.deepEqual(rayCaster.set.lastCall.args[0], new THREE.Vector3().set(2, 2, 2));
				assert.deepEqual(rayCaster.set.lastCall.args[1], new THREE.Vector3().set(0.5773502691896258, 0.5773502691896258, 0.5773502691896258));
			});

			it('should check collision', () => {
				assert.equal(Physics.checkRayCollision.callCount, 1);
				assert.isTrue(Physics.checkRayCollision.calledWith(rayCaster, 1));
			});

			it('should set points on the rayCurve', () => {
				assert.equal(teleportation._setRayCurvePoint.callCount, 1);
			});

			it('should not set up a hitCylinder', () => {
				assert.isFalse(teleportation.hitCylinder.visible);
			});

			it('should clearTimeout on activateTeleport', () => {
				assert.isFalse(teleportation.hitPoint);
				assert.isTrue(window.clearTimeout.calledOnce);
				assert.isTrue(window.clearTimeout.calledWith(1));
			});
		});

		describe('intersection', () => {
			
			beforeEach(() => {
				sinon.stub(Physics, 'checkRayCollision');
				Physics.checkRayCollision.returns({
					point: 1
				});
				sinon.stub(teleportation, '_isValidNormalsAngle');
				teleportation._isValidNormalsAngle.returns(true);
				sinon.stub(teleportation, 'activateTeleport');

				teleportation.updateRayCurve(controller, scene);
			});

			afterEach(() => {
				teleportation._isValidNormalsAngle.restore();
				teleportation.activateTeleport.restore();
				Physics.checkRayCollision.restore();
			});
			
			it('should complete rayCurve', () => {
				assert.equal(teleportation._setRayCurvePoint.callCount, 30);
				assert.equal(teleportation._setRayCurvePoint.lastCall.args[0], 30);
				assert.equal(teleportation._setRayCurvePoint.lastCall.args[1], 1);
			});

			it('should hit', () => {
				assert.isTrue(rayCurve.material.color.set.calledTwice);
				assert.isTrue(rayCurve.material.color.set.lastCall.calledWith(teleportation.hitColor));
				assert.isTrue(hitCylinder.position.copy.calledOnce);
				assert.isTrue(hitCylinder.position.copy.calledWith(1));
				assert.isTrue(hitCylinder.visible);
				assert.equal(teleportation.hitPoint, 1);
				assert.isTrue(teleportation.activateTeleport.calledOnce);
			});
		});
	});
});