'use strict';

import * as THREE from 'three';
import EventEmitter from 'eventemitter3';
import {Locomotion} from '../../src/locomotion/locomotion';
import {Teleportation} from '../../src/locomotion/_teleportation';

describe('Locomotion', () => {

    let locomotion;

	beforeEach(() => {
		locomotion = new Locomotion();
	});

	it('should be a class', () => {
		assert.isFunction(Locomotion);
	});

	it('should have a set of methods', () => {
		assert.isFunction(Locomotion.prototype.getMeshes);
		assert.isFunction(Locomotion.prototype.translateZ);
		assert.isFunction(Locomotion.prototype.translateX);
		assert.isFunction(Locomotion.prototype.stopTranslateZ);
		assert.isFunction(Locomotion.prototype.stopTranslateX);
		assert.isFunction(Locomotion.prototype.orient);
		assert.isFunction(Locomotion.prototype.teleport);
		assert.isFunction(Locomotion.prototype._handleTeleportation);
		assert.isFunction(Locomotion.prototype.setUpEventListeners);
	});

	it('should have a set of properties', () => {
		assert.equal(Locomotion.prototype.velocity, 2);
		assert.equal(Locomotion.prototype.angularVelocity, 1);
		assert.deepEqual(Locomotion.prototype.orientation, {
			quaternion: new THREE.Quaternion(),
			euler: new THREE.Euler()
		});
		assert.deepEqual(Locomotion.prototype.currentRotation, new THREE.Vector2());
		assert.equal(Locomotion.prototype.translatingZ, false);
		assert.equal(Locomotion.prototype.translatingX, false);
	});

	describe('#constructor', () => {

		it('should set some properties', () => {
			assert.instanceOf(locomotion.teleportation, Teleportation);
		});
	});

	describe('#getMeshes', () => {

		let meshes;

		beforeEach(() => {
			meshes = locomotion.getMeshes();
		});

		it('should return all locomotion related meshes', () => {
			assert.equal(meshes.length, 2);
			assert.instanceOf(meshes[0], THREE.Mesh);
			assert.instanceOf(meshes[1], THREE.Group);
		});
	});
	
	describe('#translateZ', () => {

		beforeEach(() => {
			locomotion.translateZ(2);
		});

		it('should set translatingZ', () => {
			assert.equal(locomotion.translatingZ, 2);
		});
	});

	describe('#translateX', () => {

		beforeEach(() => {
			locomotion.translateX(2);
		});

		it('should set translatingX', () => {
			assert.equal(locomotion.translatingX, 2);
		});
	});

	describe('#stopTranslateZ', () => {

		beforeEach(() => {
			locomotion.stopTranslateZ();
		});

		it('should set translatingZ to false', () => {
			assert.isFalse(locomotion.translatingZ);
		});
	});

	describe('#stopTranslateX', () => {

		beforeEach(() => {
			locomotion.stopTranslateX();
		});

		it('should set translatingX to false', () => {
			assert.isFalse(locomotion.translatingX);
		});
	});

	describe('#orient', () => {

		beforeEach(() => {
			sinon.stub(locomotion.teleportation, 'activateTeleport');
			locomotion.teleportation.hitPoint = true;
			locomotion.currentRotation = new THREE.Vector2();

			locomotion.orient(new THREE.Vector2(-2, -3));
		});

		it('should calculate phi', () => {
			assert.equal(locomotion._phi, -0.031415926535897934);
		});

		it('should calculate theta', () => {
			assert.equal(locomotion._theta, -0.015707963267948967);
		});

		it('should set orientation values', () => {
			assert.deepEqual(locomotion.orientation.euler.toArray(), [-0.031415926535897934, -0.015707963267948967, 0, 'YXZ']);
			assert.deepEqual(locomotion.orientation.quaternion.toArray(), [-0.015706832861160744, -0.00785293197244941, -0.00012336371339457934, 0.999845793931395]);
		});

		it('should activate teleport', () => {
			assert.isTrue(locomotion.teleportation.activateTeleport.calledOnce);
		});
	});

	describe('#teleport', () => {

		beforeEach(() => {
			locomotion.teleportation = {
				isRayCurveActive: false,
				resetTeleport: sinon.stub()
			};
		});

		describe('ray curve inactive', () => {

			beforeEach(() => {
				sinon.stub(locomotion, '_handleTeleportation');
				locomotion.teleport();
			});
			
			it('should activate ray curve', () => {
				assert.isTrue(locomotion._handleTeleportation.calledOnce);
			});
		});

		describe('ray curve active', () => {

			beforeEach(() => {
				locomotion.teleportation.isRayCurveActive = true;

				locomotion.teleport();
			});
			
			it('should activate ray curve', () => {
				assert.isTrue(locomotion.teleportation.resetTeleport.calledOnce);
				assert.isFalse(locomotion._cancelTeleportation);
			});
		});

		describe('cancel teleportation', () => {

			beforeEach(() => {
				locomotion._cancelTeleportation = true;

				locomotion.teleport();
			});
			
			it('should activate ray curve', () => {
				assert.isTrue(locomotion.teleportation.resetTeleport.calledOnce);
				assert.isFalse(locomotion._cancelTeleportation);
			});
		});
	});

	describe('#_handleTeleportation', () => {

		beforeEach(() => {
			locomotion.teleportation.setRayCurveState = sinon.stub();

			locomotion._handleTeleportation();
		});
		
		it('should activate the ray curve', () => {
			assert.isTrue(locomotion.teleportation.setRayCurveState.calledOnce);
			assert.isTrue(locomotion.teleportation.setRayCurveState.calledWith(true));
		});
	});

	describe('#setUpEventListeners', () => {

		let controllers;
		let interactions;

		beforeEach(() => {
			sinon.spy(EventEmitter.prototype, 'on');
			controllers = new EventEmitter();
			interactions = {
				selection: new EventEmitter()
			};

			locomotion.setUpEventListeners(controllers, interactions);
		});

		afterEach(() => {
			EventEmitter.prototype.on.restore();
		});

		it('should handle all events', () => {
			assert.equal(EventEmitter.prototype.on.callCount, 11);
			assert.isTrue(EventEmitter.prototype.on.getCall(0).calledWith('ztranslationstart'));
			assert.isTrue(EventEmitter.prototype.on.getCall(1).calledWith('xtranslationstart'));
			assert.isTrue(EventEmitter.prototype.on.getCall(2).calledWith('ztranslationend'));
			assert.isTrue(EventEmitter.prototype.on.getCall(3).calledWith('xtranslationend'));
			assert.isTrue(EventEmitter.prototype.on.getCall(4).calledWith('orientation'));
			assert.isTrue(EventEmitter.prototype.on.getCall(5).calledWith('currentorientation'));
			assert.isTrue(EventEmitter.prototype.on.getCall(6).calledWith('trigger'));
			assert.isTrue(EventEmitter.prototype.on.getCall(7).calledWith('thumbpadpressed'));
			assert.isTrue(EventEmitter.prototype.on.getCall(8).calledWith('thumbpadtouched'));
			assert.isTrue(EventEmitter.prototype.on.getCall(9).calledWith('thumbpaduntouched'));
			assert.isTrue(EventEmitter.prototype.on.getCall(10).calledWith('selected'));
		});
	});
});
