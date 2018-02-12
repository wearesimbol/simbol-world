'use strict';

import {Controllers} from '../../../src/virtualpersona/controllers/controllers';
import {PoseController} from '../../../src/virtualpersona/controllers/posecontroller';
import {GamepadController} from '../../../src/virtualpersona/controllers/gamepadcontroller';

describe('Controllers', () => {

	let controllers;

	beforeEach(() => {
		controllers = Object.create(Controllers);
	});

	it('should be an object', () => {
		assert.isObject(Controllers);
	});

	it('should have a set of methods', () => {
		assert.isFunction(Controllers.init);
		assert.isFunction(Controllers.getGamepad);
		assert.isFunction(Controllers.addController);
		assert.isFunction(Controllers.removeController);
		assert.isFunction(Controllers.updateControllers);
	});

	it('should have a set of properties', () => {
		assert.deepEqual(Controllers.currentControllers, {});
		assert.equal(Controllers.mainHandController, null);
	});

	describe('init', () => {

		let locomotion;

		beforeEach(() => {
			locomotion = {};
			sinon.stub(controllers, 'updateControllers');

			controllers.init(locomotion);
		});

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
			controllers.locomotion = {};
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
				sinon.stub(PoseController, 'init');
				gamepad.pose = true;
				controllers.currentControllers = {};

				controllers.addController(gamepad);
			});

			afterEach(() => {
				PoseController.init.restore();
			});

			it('should save PoseController', () => {
				assert.isTrue(PoseController.init.calledOnce);
				assert.isTrue(PoseController.init.calledWith(gamepad, controllers.locomotion));
				assert.isTrue(PoseController.isPrototypeOf(controllers.currentControllers['testController (left)']));
				assert.isTrue(PoseController.isPrototypeOf(controllers.mainHandController));
			});
		});

		describe('gamepad controller', () => {

			beforeEach(() => {
				sinon.stub(GamepadController, 'init');
				controllers.currentControllers = {};

				controllers.addController(gamepad);
			});

			afterEach(() => {
				GamepadController.init.restore();
			});

			it('should save GamepadController', () => {
				assert.isTrue(GamepadController.init.calledOnce);
				assert.isTrue(GamepadController.init.calledWith(gamepad, controllers.locomotion));
				assert.isTrue(GamepadController.isPrototypeOf(controllers.currentControllers['testController (left)']));
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