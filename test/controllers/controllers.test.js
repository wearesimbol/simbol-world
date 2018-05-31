'use strict';

import * as THREE from 'three';
import EventEmitter from 'eventemitter3';
import {Controllers} from '../../src/controllers/controllers';
import {PoseController} from '../../src/controllers/posecontroller';
import {GamepadController} from '../../src/controllers/gamepadcontroller';
import {KeyboardController} from '../../src/controllers/keyboardcontroller';
import {PointerController} from '../../src/controllers/pointercontroller';

describe('Controllers', () => {

	let controllers;
	const canvas = document.createElement('canvas');

	beforeEach(() => {
		sinon.stub(window, 'addEventListener');
		sinon.stub(Controllers.prototype, 'updateControllers');
		sinon.stub(Controllers.prototype, '_setUpEventListeners');

		controllers = new Controllers(canvas);
	});

	afterEach(() => {
		window.addEventListener.restore();
		Controllers.prototype.updateControllers.restore && Controllers.prototype.updateControllers.restore();
		Controllers.prototype._setUpEventListeners.restore && Controllers.prototype._setUpEventListeners.restore();
	});

	it('should be a class', () => {
		assert.isFunction(Controllers);
	});

	it('should have a set of methods', () => {
		assert.isFunction(Controllers.prototype._setUpEventListeners);
		assert.isFunction(Controllers.prototype._removeEventListeners);
		assert.isFunction(Controllers.prototype._handleGamepadConnected);
		assert.isFunction(Controllers.prototype._handleGamepadDisconnected);
		assert.isFunction(Controllers.prototype.addController);
		assert.isFunction(Controllers.prototype.removeController);
		assert.isFunction(Controllers.prototype.updateControllers);
		assert.isFunction(Controllers.getGamepadId);
		assert.isFunction(Controllers.getGamepad);
	});

	it('should have a set of properties', () => {
		assert.deepEqual(Controllers.prototype.currentControllers, {});
		assert.equal(Controllers.prototype.mainHandController, null);
	});

	describe('#constructor', () => {

		it('should extend EventEmitter', () => {
			assert.instanceOf(controllers, EventEmitter);
		});

		it('should listen to gamepad events', () => {
			assert.isTrue(window.addEventListener.calledTwice);
			assert.isTrue(window.addEventListener.firstCall.calledWith('gamepadconnected'));
			assert.isTrue(window.addEventListener.secondCall.calledWith('gamepaddisconnected'));
		});

		it('should add controllers', () => {
			assert.isTrue(controllers.updateControllers.calledOnce);
			assert.instanceOf(controllers.currentControllers['KeyboardController'], KeyboardController);
			assert.instanceOf(controllers.currentControllers['PointerController'], PointerController);
			assert.isTrue(controllers._setUpEventListeners.calledTwice);
			assert.isTrue(controllers._setUpEventListeners.firstCall.calledWith(controllers.currentControllers['KeyboardController']));
			assert.isTrue(controllers._setUpEventListeners.secondCall.calledWith(controllers.currentControllers['PointerController']));
		});
	});

	describe('#_setUpEventListeners', () => {

		beforeEach(() => {
			sinon.spy(EventEmitter.prototype, 'on');
			sinon.spy(controllers, 'emit');
			controllers._setUpEventListeners.restore();
		});

		afterEach(() => {
			EventEmitter.prototype.on.restore();
		});

		describe('KeyboardController', () => {

			let emitter;
			const event = {};

			beforeEach(() => {
				emitter = new KeyboardController();
				controllers._setUpEventListeners(emitter);
			});

			it('should add all event handlers', () => {
				assert.equal(EventEmitter.prototype.on.callCount, 4);
				assert.isTrue(EventEmitter.prototype.on.getCall(0).calledWith('ztranslationstart'));
				assert.isTrue(EventEmitter.prototype.on.getCall(1).calledWith('xtranslationstart'));
				assert.isTrue(EventEmitter.prototype.on.getCall(2).calledWith('ztranslationend'));
				assert.isTrue(EventEmitter.prototype.on.getCall(3).calledWith('xtranslationend'));
			});

			it('should forward ztranslationstart', (done) => {
				controllers.on('ztranslationstart', (fwdevent) => {
					assert.equal(fwdevent, event);
					done();
				});
				emitter.emit('ztranslationstart', event);
			});

			it('should forward xtranslationstart', (done) => {
				controllers.on('xtranslationstart', (fwdevent) => {
					assert.equal(fwdevent, event);
					done();
				});
				emitter.emit('xtranslationstart', event);
			});

			it('should forward ztranslationend', (done) => {
				controllers.on('ztranslationend', (fwdevent) => {
					assert.equal(fwdevent, event);
					done();
				});
				emitter.emit('ztranslationend', event);
			});

			it('should forward xtranslationend', (done) => {
				controllers.on('xtranslationend', (fwdevent) => {
					assert.equal(fwdevent, event);
					done();
				});
				emitter.emit('xtranslationend', event);
			});
		});

		describe('PointerController', () => {

			let emitter;
			const event = {};

			beforeEach(() => {
				emitter = new PointerController(canvas);
				controllers._setUpEventListeners(emitter);
			});

			it('should add all event handlers', () => {
				assert.equal(EventEmitter.prototype.on.callCount, 4);
				assert.isTrue(EventEmitter.prototype.on.getCall(0).calledWith('ztranslationstart'));
				assert.isTrue(EventEmitter.prototype.on.getCall(1).calledWith('ztranslationend'));
				assert.isTrue(EventEmitter.prototype.on.getCall(2).calledWith('orientation'));
				assert.isTrue(EventEmitter.prototype.on.getCall(3).calledWith('trigger'));
			});

			it('should forward ztranslationstart', (done) => {
				controllers.on('ztranslationstart', (fwdevent) => {
					assert.equal(fwdevent, event);
					done();
				});
				emitter.emit('ztranslationstart', event);
			});

			it('should forward ztranslationend', (done) => {
				controllers.on('ztranslationend', (fwdevent) => {
					assert.equal(fwdevent, event);
					done();
				});
				emitter.emit('ztranslationend', event);
			});

			it('should forward orientation', (done) => {
				controllers.on('orientation', (fwdevent) => {
					assert.equal(fwdevent, event);
					done();
				});
				emitter.emit('orientation', event);
			});

			it('should forward trigger', (done) => {
				controllers.on('trigger', (fwdevent) => {
					assert.equal(fwdevent, event);
					done();
				});
				emitter.emit('trigger', event);
			});
		});

		describe('GamepadController', () => {

			let emitter;
			const event = {};

			beforeEach(() => {
				emitter = new GamepadController({});
				controllers._setUpEventListeners(emitter);
			});

			it('should add all event handlers', () => {
				assert.equal(EventEmitter.prototype.on.callCount, 2);
				assert.isTrue(EventEmitter.prototype.on.getCall(0).calledWith('controllerdisconnected'));
				assert.isTrue(EventEmitter.prototype.on.getCall(1).calledWith('trigger'));
			});

			// Doesn't emit another event, should remove handler to test separately
			xit('should forward controllerdisconnected', (done) => {
				controllers.on('controllerdisconnected', (fwdevent) => {
					assert.equal(fwdevent, event);
					done();
				});
				emitter.emit('controllerdisconnected', event);
			});

			it('should forward trigger', (done) => {
				controllers.on('trigger', (fwdevent) => {
					assert.equal(fwdevent, event);
					done();
				});
				emitter.emit('trigger', event);
			});
		});

		describe('PoseController', () => {

			let emitter;
			const event = {};

			beforeEach(() => {
				emitter = new PoseController({pose:{}});
				controllers._setUpEventListeners(emitter);
			});

			it('should add all event handlers', () => {
				assert.equal(EventEmitter.prototype.on.callCount, 4);
				assert.isTrue(EventEmitter.prototype.on.getCall(0).calledWith('controllerdisconnected'));
				assert.isTrue(EventEmitter.prototype.on.getCall(1).calledWith('trigger'));
				assert.isTrue(EventEmitter.prototype.on.getCall(2).calledWith('add'));
				assert.isTrue(EventEmitter.prototype.on.getCall(3).calledWith('thumpadpressed'));
			});

			// Doesn't emit another event, should remove handler to test separately
			xit('should forward controllerdisconnected', (done) => {
				controllers.on('controllerdisconnected', (fwdevent) => {
					assert.equal(fwdevent, event);
					done();
				});
				emitter.emit('controllerdisconnected', event);
			});

			it('should forward trigger', (done) => {
				controllers.on('trigger', (fwdevent) => {
					assert.equal(fwdevent, event);
					done();
				});
				emitter.emit('trigger', event);
			});

			it('should forward add', (done) => {
				controllers.on('add', (fwdevent) => {
					assert.equal(fwdevent, event);
					done();
				});
				emitter.emit('add', event);
			});

			it('should forward thumpadpressed', (done) => {
				controllers.on('thumpadpressed', (fwdevent) => {
					assert.equal(fwdevent, event);
					done();
				});
				emitter.emit('thumpadpressed', event);
			});
		});
	});

	describe('_removeEventListeners', () => {

		let emitter;

		beforeEach(() => {
			emitter = new EventEmitter();
			sinon.spy(emitter, 'removeAllListeners');

			controllers._removeEventListeners(emitter);
		});

		it('should remove all listeners', () => {
			assert.equal(emitter.removeAllListeners.callCount, 9);
			assert.isTrue(emitter.removeAllListeners.getCall(0).calledWith('ztranslationstart'));
			assert.isTrue(emitter.removeAllListeners.getCall(1).calledWith('xtranslationstart'));
			assert.isTrue(emitter.removeAllListeners.getCall(2).calledWith('ztranslationend'));
			assert.isTrue(emitter.removeAllListeners.getCall(3).calledWith('xtranslationend'));
			assert.isTrue(emitter.removeAllListeners.getCall(4).calledWith('orientation'));
			assert.isTrue(emitter.removeAllListeners.getCall(5).calledWith('controllerdisconnected'));
			assert.isTrue(emitter.removeAllListeners.getCall(6).calledWith('add'));
			assert.isTrue(emitter.removeAllListeners.getCall(7).calledWith('trigger'));
			assert.isTrue(emitter.removeAllListeners.getCall(8).calledWith('thumbpadpressed'));
		});
	});

	describe('_handleGamepadConnected', () => {

		beforeEach(() => {
			controllers._handleGamepadConnected(true);
		});

		it('should update controllers', () => {
			assert.isTrue(controllers.updateControllers.calledTwice);
			assert.isTrue(controllers.updateControllers.secondCall.calledWith(true, true));
		});
	});

	describe('_handleGamepadDisconnected', () => {

		beforeEach(() => {
			controllers._handleGamepadDisconnected(false);
		});

		it('should update controllers', () => {
			assert.isTrue(controllers.updateControllers.calledTwice);
			assert.isTrue(controllers.updateControllers.secondCall.calledWith(false, false));
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
				assert.isTrue(controllers._setUpEventListeners.calledThrice);
				assert.isTrue(controllers._setUpEventListeners.thirdCall.calledWith(controllers.currentControllers['testController (left)']));
			});
		});

		describe('gamepad controller', () => {

			beforeEach(() => {
				controllers.currentControllers = {};

				controllers.addController(gamepad);
			});

			it('should save GamepadController', () => {
				assert.instanceOf(controllers.currentControllers['testController (left)'], GamepadController);
				assert.isTrue(controllers._setUpEventListeners.calledThrice);
				assert.isTrue(controllers._setUpEventListeners.thirdCall.calledWith(controllers.currentControllers['testController (left)']));
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

				it('should remove controller', () => {
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

	describe('#getGamepadId', () => {
		
		let gamepad;
		let id;

		beforeEach(() => {
			gamepad = {
				id: 'testPad',
				hand: 'left'
			};

			id = Controllers.getGamepadId(gamepad);
		});

		it('should return id', () => {
			assert.equal(id, 'testPad (left)');
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

			returnedGamepad = Controllers.getGamepad(id);
		});

		afterEach(() => {
			navigator.getGamepads.restore();
		});

		it('should return gamepad by id', () => {
			assert.equal(returnedGamepad, gamepad);
		});
	});
});