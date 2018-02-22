'use strict';

import * as THREE from 'three';
import {Controllers} from '../../src/controllers/controllers';
import {PoseController} from '../../src/controllers/posecontroller';
import {GamepadController} from '../../src/controllers/gamepadcontroller';

describe('Controllers', () => {

	let controllers;
	let locomotion;

	beforeEach(() => {
		locomotion = {};
		sinon.stub(Controllers.prototype, 'updateControllers');

		controllers = new Controllers(locomotion);
	});

	afterEach(() => {
		Controllers.prototype.updateControllers.restore && Controllers.prototype.updateControllers.restore();
	});

	it('should be a class', () => {
		assert.isFunction(Controllers);
	});

	it('should have a set of methods', () => {
		assert.isFunction(Controllers.prototype.getGamepad);
		assert.isFunction(Controllers.prototype.addController);
		assert.isFunction(Controllers.prototype.removeController);
		assert.isFunction(Controllers.prototype.updateControllers);
	});

	it('should have a set of properties', () => {
		assert.deepEqual(Controllers.prototype.currentControllers, {});
		assert.equal(Controllers.prototype.mainHandController, null);
	});

	describe('#constructor', () => {

		it('should set locomotion and add controllers', () => {
			assert.equal(controllers.locomotion, locomotion);
			assert.isTrue(controllers.updateControllers.calledOnce);
		});
	});

	describe('#getGamepad', () => {
		
		let id;
		let gamepad;
		let returnedGamepad;

		beforeEach(() => {
			id = 'testPad (left)';
			gamepad = {
				id: 'testPad',
				hand: 'left'
			};
			sinon.stub(navigator, 'getGamepads').returns([gamepad]);

			returnedGamepad = controllers.getGamepad(id);
		});

		afterEach(() => {
			navigator.getGamepads.restore();
		});

		it('should return gamepad by id', () => {
			assert.equal(returnedGamepad, gamepad);
		});
	});

	describe('#addController', () => {

		let gamepad;

		beforeEach(() => {
			gamepad = {
				id: 'testController',
				hand: 'left'
			};
		});

		describe('existing controller', () => {

			beforeEach(() => {
				controllers.currentControllers['testController (left)'] = true;
				controllers.addController(gamepad);
			});

			it('should not do anything', () => {
				assert.equal(controllers.currentControllers['testController (left)'], true);
			});
		});

		describe('pose controller', () => {

			beforeEach(() => {
				gamepad.pose = true;
				controllers.currentControllers = {};

				controllers.addController(gamepad);
			});

			it('should save PoseController', () => {
				assert.instanceOf(controllers.currentControllers['testController (left)'], PoseController);
				assert.instanceOf(controllers.mainHandController, PoseController);
			});
		});

		describe('gamepad controller', () => {

			beforeEach(() => {
				sinon.stub(THREE.Quaternion.prototype, 'fromArray');
				controllers.currentControllers = {};
				controllers.locomotion.scene = {
					camera: {
						quaternion: 1
					}
				};

				controllers.addController(gamepad);
			});

			afterEach(() => {
				THREE.Quaternion.prototype.fromArray.restore();
			});

			it('should save GamepadController', () => {
				assert.isTrue(THREE.Quaternion.prototype.fromArray.calledOnce);
				assert.isTrue(THREE.Quaternion.prototype.fromArray.calledWith(1));
				assert.instanceOf(controllers.currentControllers['testController (left)'], GamepadController);
			});
		});
	});

	describe('removeController', () => {

		let gamepad;

		beforeEach(() => {
			gamepad = {
				id: 'testController',
				hand: 'left',
				model: {
					visible: true
				}
			};
			controllers.currentControllers['testController (left)'] = gamepad;
			controllers.mainHandController = gamepad;

			controllers.removeController(gamepad);
		});

		it('should remove gamepad', () => {
			assert.isNull(controllers.mainHandController);
			assert.isUndefined(controllers.currentControllers['testController (left)']);
			assert.isFalse(gamepad.model.visible);
		});
	});

	describe('updateControllers', () => {

		beforeEach(() => {
			Controllers.prototype.updateControllers.restore();
		});

		describe('event', () => {

			describe('connected', () => {

				let event;

				beforeEach(() => {
					sinon.stub(controllers, 'addController');
					event = {
						gamepad: 1
					};

					controllers.updateControllers(event, true);
				});

				afterEach(() => {
					controllers.addController.restore();
				});

				it('should add controller', () => {
					assert.isTrue(controllers.addController.calledOnce);
					assert.isTrue(controllers.addController.calledWith(1));
				});
			});

			describe('disconnected', () => {

				let event;

				beforeEach(() => {
					sinon.stub(controllers, 'removeController');
					event = {
						gamepad: 1
					};

					controllers.updateControllers(event, false);
				});

				afterEach(() => {
					controllers.removeController.restore();
				});

				it('should add controller', () => {
					assert.isTrue(controllers.removeController.calledOnce);
					assert.isTrue(controllers.removeController.calledWith(1));
				});
			});
		});

		describe('no event', () => {

			let gamepad;
			let gamepad2;

			beforeEach(() => {
				gamepad = {};
				gamepad2 = {};
				sinon.stub(navigator, 'getGamepads').returns([gamepad, gamepad2]);
				sinon.stub(controllers, 'addController');
				
				controllers.updateControllers();
			});

			afterEach(() => {
				navigator.getGamepads.restore();
				controllers.addController.restore();
			});

			it('should add all controllers', () => {
				assert.isTrue(controllers.addController.calledTwice);
				assert.isTrue(controllers.addController.calledWith(gamepad));
				assert.isTrue(controllers.addController.calledWith(gamepad2));
			});
		});
	});
});