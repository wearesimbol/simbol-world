'use strict';

import * as THREE from 'three';
import EventEmitter from 'eventemitter3';
import {Utils} from '../../src/utils/utils';
import {Controllers} from '../../src/controllers/controllers';
import {PoseController} from '../../src/controllers/posecontroller';

describe('PoseController', () => {

	let poseController;
	let gamepad;

	beforeEach(() => {
		sinon.stub(THREE.Quaternion.prototype, 'fromArray');
		gamepad = {
			id: 'test',
			hand: 'left',
			pose: {
				orientation: 1
			}
		};

		poseController = new PoseController(gamepad);
	});

	afterEach(() => {
		THREE.Quaternion.prototype.fromArray.restore();
	});

	it('should be a class', () => {
		assert.isFunction(PoseController);
	});

	it('should have a set of methods', () => {
		assert.isFunction(PoseController.prototype._configureControllerModel);
		assert.isFunction(PoseController.prototype.handleThumbpadPressed);
		assert.isFunction(PoseController.prototype.handleThumbpadTouched);
		assert.isFunction(PoseController.prototype.handleTriggerPressed);
		assert.isFunction(PoseController.prototype.handleGripPressed);
		assert.isFunction(PoseController.prototype.handleAppMenuPressed);
		assert.isFunction(PoseController.prototype.update);
	});

	it('should have a set of properties', () => {
		assert.deepEqual(PoseController.prototype.pressedButtons, {});
	});

	describe('#constructor', () => {

		it('should extend EventEmitter', () => {
			assert.instanceOf(poseController, EventEmitter);
		});

		it('should set some properties', () => {
			assert.equal(poseController.id, 'test (left)');
			assert.equal(poseController.hand, 'left');
			assert.equal(poseController.gamepadId, 'test');
			assert.instanceOf(poseController.quaternion, THREE.Quaternion);
			assert.instanceOf(poseController.euler, THREE.Euler);
			assert.instanceOf(poseController.position, THREE.Vector3);
		});

		it('should set initial values', () => {
			assert.isTrue(THREE.Quaternion.prototype.fromArray.calledOnce);
			assert.isTrue(THREE.Quaternion.prototype.fromArray.calledWith(1));
			assert.deepEqual(poseController.position.toArray(), [0, -0.015, 0.05]);
		});

		// Doesnt test loading model as that will change soon to loading GLTF hands
	});

	describe('#handleThumbpadPressed', () => {

		beforeEach(() => {
			sinon.stub(poseController, 'emit');

			poseController.handleThumbpadPressed(true);
		});

		it('should emit thumpadpressed event', () => {
			assert.isTrue(poseController.emit.calledOnce);
			assert.isTrue(poseController.emit.calledWith('thumbpadpressed'));
		});
	});

	describe('#handleThumbpadTouched', () => {

		beforeEach(() => {
			sinon.stub(poseController, 'emit');
		});

		describe('touched', () => {

			beforeEach(() => {	
				poseController.handleThumbpadTouched(true);
			});

			it('should emit thumpadtoucned event', () => {
				assert.isTrue(poseController.emit.calledOnce);
				assert.isTrue(poseController.emit.calledWith('thumbpadtouched'));
			});
		});

		describe('untouched', () => {

			beforeEach(() => {	
				poseController.handleThumbpadTouched(false);
			});

			it('should emit thumpadtoucned event', () => {
				assert.isTrue(poseController.emit.calledOnce);
				assert.isTrue(poseController.emit.calledWith('thumbpaduntouched'));
			});
		});
	});

	describe('#handleTriggerPressed', () => {

		beforeEach(() => {
			sinon.stub(poseController, 'emit');

			poseController.handleTriggerPressed(true);
		});

		it('should emit trigger event', () => {
			assert.isTrue(poseController.emit.calledOnce);
			assert.isTrue(poseController.emit.calledWith('trigger'));
		});
	});

	describe('#handleGripPressed', () => {

	});

	describe('#handleAppMenuPressed', () => {

	});

	describe('#update', () => {

		beforeEach(() => {
			sinon.stub(Controllers, 'getGamepad');
			sinon.stub(poseController, 'emit');
		});

		afterEach(() => {
			Controllers.getGamepad.restore();
		});

		describe('no gamepad', () => {

			beforeEach(() => {
				poseController.update();
			});

			it('should emit controllerdisconnected', () => {
				assert.isTrue(poseController.emit.calledOnce);
				assert.equal(poseController.emit.firstCall.args[0], 'controllerdisconnected');
				assert.deepEqual(poseController.emit.firstCall.args[1], {
					id: 'test',
					hand: 'left'
				});
			});
		});

		describe('gamepad', () => {

			const gamepad = {
				buttons: {
					0: {
						pressed: true,
						touched: true
					}
				},
				pose: {
					orientation: 1,
					position: 1
				}
			};
			let camera;
			const userHeight = 0;
			const standingMatrix = 0;

			beforeEach(() => {
				sinon.stub(THREE.Vector3.prototype, 'fromArray');
				sinon.stub(poseController, 'handleThumbpadPressed');
				sinon.stub(poseController, 'handleThumbpadTouched');
				Controllers.getGamepad.returns(gamepad);

				camera = {
					position: 0
				};
				poseController.pressedButtons[0] = false;

				poseController.update();
			});

			afterEach(() => {
				THREE.Vector3.prototype.fromArray.restore();
			});

			it('should update properties', () => {
				assert.isTrue(THREE.Quaternion.prototype.fromArray.calledTwice);
				assert.isTrue(THREE.Quaternion.prototype.fromArray.calledWith(1));
				assert.isTrue(THREE.Vector3.prototype.fromArray.calledOnce);
				assert.isTrue(THREE.Vector3.prototype.fromArray.calledWith(1));
			});

			// Not sure how to test arm model

			it('should handle pressed button', () => {
				assert.isTrue(poseController.handleThumbpadPressed.calledOnce);
				assert.isTrue(poseController.handleThumbpadPressed.calledWith(true));
				assert.isTrue(poseController.pressedButtons[0]);
			});

			it('should handle touched button', () => {
				assert.isTrue(poseController.handleThumbpadTouched.calledOnce);
				assert.isTrue(poseController.handleThumbpadTouched.calledWith(true));
			});
		});
	});
});
