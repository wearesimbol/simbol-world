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
		sinon.stub(Controllers.prototype, '_setUpEventListeners');

		controllers = new Controllers(canvas, 'left');
	});

	afterEach(() => {
		Controllers.prototype._setUpEventListeners.restore && Controllers.prototype._setUpEventListeners.restore();
	});

	it('should be a class', () => {
		assert.isFunction(Controllers);
	});

	it('should have a set of methods', () => {
		assert.isFunction(Controllers.prototype._setUpEventListeners);
		assert.isFunction(Controllers.prototype._removeEventListeners);
		assert.isFunction(Controllers.prototype.init);
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

        it('should set hand', () => {
            assert.equal(controllers.hand, 'left');
        });

		it('should add controllers', () => {
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
				assert.equal(EventEmitter.prototype.on.callCount, 5);
				assert.isTrue(EventEmitter.prototype.on.getCall(0).calledWith('error'));
				assert.isTrue(EventEmitter.prototype.on.getCall(1).calledWith('ztranslationstart'));
				assert.isTrue(EventEmitter.prototype.on.getCall(2).calledWith('xtranslationstart'));
				assert.isTrue(EventEmitter.prototype.on.getCall(3).calledWith('ztranslationend'));
				assert.isTrue(EventEmitter.prototype.on.getCall(4).calledWith('xtranslationend'));
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
				assert.equal(EventEmitter.prototype.on.callCount, 6);
				assert.isTrue(EventEmitter.prototype.on.getCall(0).calledWith('error'));
				assert.isTrue(EventEmitter.prototype.on.getCall(1).calledWith('ztranslationstart'));
				assert.isTrue(EventEmitter.prototype.on.getCall(2).calledWith('ztranslationend'));
				assert.isTrue(EventEmitter.prototype.on.getCall(3).calledWith('orientation'));
				assert.isTrue(EventEmitter.prototype.on.getCall(4).calledWith('currentorientation'));
				assert.isTrue(EventEmitter.prototype.on.getCall(5).calledWith('triggerpressed'));
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
				controllers.on('triggerpressed', (fwdevent) => {
					assert.equal(fwdevent, event);
					done();
				});
				emitter.emit('triggerpressed', event);
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
				assert.equal(EventEmitter.prototype.on.callCount, 3);
				assert.isTrue(EventEmitter.prototype.on.getCall(0).calledWith('error'));
				assert.isTrue(EventEmitter.prototype.on.getCall(1).calledWith('controllerdisconnected'));
				assert.isTrue(EventEmitter.prototype.on.getCall(2).calledWith('triggerpressed'));
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
				controllers.on('triggerpressed', (fwdevent) => {
					assert.equal(fwdevent, event);
					done();
				});
				emitter.emit('triggerpressed', event);
			});
		});

		describe('PoseController', () => {

			let emitter;
			const event = {};

			beforeEach(() => {
				sinon.stub(PoseController.prototype, 'renameAnimations');
				sinon.stub(PoseController.prototype, 'setGesture');
				emitter = new PoseController();
				controllers._setUpEventListeners(emitter);
			});

			afterEach(() => {
				PoseController.prototype.renameAnimations.restore();
				PoseController.prototype.setGesture.restore();
			});

			it('should add all event handlers', () => {
				assert.equal(EventEmitter.prototype.on.callCount, 7);
				assert.isTrue(EventEmitter.prototype.on.getCall(0).calledWith('error'));
				assert.isTrue(EventEmitter.prototype.on.getCall(1).calledWith('controllerdisconnected'));
				assert.isTrue(EventEmitter.prototype.on.getCall(2).calledWith('triggerpressed'));
				assert.isTrue(EventEmitter.prototype.on.getCall(3).calledWith('thumbpadpressed'));
				assert.isTrue(EventEmitter.prototype.on.getCall(4).calledWith('thumbpadtouched'));
				assert.isTrue(EventEmitter.prototype.on.getCall(5).calledWith('thumbpaduntouched'));
				assert.isTrue(EventEmitter.prototype.on.getCall(6).calledWith('gesturechange'));
			});

			// Doesn't emit another event, should remove handler to test separately
			xit('should forward controllerdisconnected', (done) => {
				controllers.on('controllerdisconnected', (fwdevent) => {
					assert.equal(fwdevent, event);
					done();
				});
				emitter.emit('controllerdisconnected', event);
			});

			it('should forward triggerpressed', (done) => {
				controllers.on('triggerpressed', (fwdevent) => {
					assert.equal(fwdevent, event);
					done();
				});
				emitter.emit('triggerpressed', event);
			});

			it('should forward thumbpadpressed', (done) => {
				controllers.on('thumbpadpressed', (fwdevent) => {
					assert.equal(fwdevent, event);
					done();
				});
				emitter.emit('thumbpadpressed', event);
			});
		});
	});

	describe('#_removeEventListeners', () => {

		let emitter;

		beforeEach(() => {
			emitter = new EventEmitter();
			sinon.spy(emitter, 'removeAllListeners');

			controllers._removeEventListeners(emitter);
		});

		it('should remove all listeners', () => {
			assert.equal(emitter.removeAllListeners.callCount, 14);
			assert.isTrue(emitter.removeAllListeners.getCall(0).calledWith('error'));
			assert.isTrue(emitter.removeAllListeners.getCall(1).calledWith('ztranslationstart'));
			assert.isTrue(emitter.removeAllListeners.getCall(2).calledWith('xtranslationstart'));
			assert.isTrue(emitter.removeAllListeners.getCall(3).calledWith('ztranslationend'));
			assert.isTrue(emitter.removeAllListeners.getCall(4).calledWith('xtranslationend'));
			assert.isTrue(emitter.removeAllListeners.getCall(5).calledWith('orientation'));
			assert.isTrue(emitter.removeAllListeners.getCall(6).calledWith('currentorientation'));
			assert.isTrue(emitter.removeAllListeners.getCall(7).calledWith('controllerdisconnected'));
			assert.isTrue(emitter.removeAllListeners.getCall(8).calledWith('add'));
			assert.isTrue(emitter.removeAllListeners.getCall(9).calledWith('triggerpressed'));
			assert.isTrue(emitter.removeAllListeners.getCall(10).calledWith('thumbpadpressed'));
			assert.isTrue(emitter.removeAllListeners.getCall(11).calledWith('thumbpadtouched'));
			assert.isTrue(emitter.removeAllListeners.getCall(12).calledWith('thumbpaduntouched'));
			assert.isTrue(emitter.removeAllListeners.getCall(13).calledWith('gesturechange'));
		});
	});

	describe('#init', () => {
		
		let mesh = 1;

		beforeEach(() => {
			sinon.stub(window, 'addEventListener');
			sinon.stub(controllers, 'updateControllers');

			controllers.init(mesh);
		});

		afterEach(() => {
			window.addEventListener.restore();
		});

		it('should listen to gamepad events', () => {
			assert.isTrue(window.addEventListener.calledTwice);
			assert.isTrue(window.addEventListener.firstCall.calledWith('gamepadconnected'));
			assert.isTrue(window.addEventListener.secondCall.calledWith('gamepaddisconnected'));
		});

		it('should update controllers', () => {
			assert.isTrue(controllers.updateControllers.calledOnce);
			assert.isTrue(controllers.updateControllers.calledWith(mesh));
		});
	});

	describe('#updateControllers', () => {

		let gamepad;
		let gamepad2;

		beforeEach(() => {
			gamepad = {};
			gamepad2 = {};
			sinon.stub(navigator, 'getGamepads').returns([gamepad, gamepad2]);
			sinon.stub(PoseController.prototype, 'renameAnimations');
			sinon.stub(PoseController.prototype, 'setGesture');
			sinon.stub(controllers, 'addController');
			
			controllers.updateControllers();
		});

		afterEach(() => {
			navigator.getGamepads.restore();
			PoseController.prototype.renameAnimations.restore();
			PoseController.prototype.setGesture.restore();
			controllers.addController.restore();
		});

		it('should add all controllers', () => {
			assert.isTrue(controllers.addController.calledTwice);
			assert.isTrue(controllers.addController.calledWith(gamepad));
			assert.isTrue(controllers.addController.calledWith(gamepad2));
		});

		describe('mesh', () => {
			
			const mesh = new THREE.Mesh();

			beforeEach(() => {
				controllers.currentControllers['1'] = new PoseController({}, new THREE.Mesh());

				controllers.updateControllers(mesh);
			});

			it('should save mesh', () => {
				assert.equal(controllers.mesh, mesh);
			});

			it('should update all PoseControllers', () => {
				assert.equal(controllers.currentControllers['1'].vpMesh, mesh);
			});
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
				sinon.stub(PoseController.prototype, 'renameAnimations');
				sinon.stub(PoseController.prototype, 'setGesture');
				gamepad.pose = true;
				controllers.currentControllers = {};
				controllers.mesh = new THREE.Mesh();

				controllers.addController(gamepad);
			});

			afterEach(() => {
				PoseController.prototype.renameAnimations.restore();
				PoseController.prototype.setGesture.restore();
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
				hand: 'left'
			};
			controllers.currentControllers['testController (left)'] = gamepad;
			controllers.mainHandController = gamepad;

			controllers.removeController(gamepad);
		});

		it('should remove gamepad', () => {
			assert.isNull(controllers.mainHandController);
			assert.isUndefined(controllers.currentControllers['testController (left)']);
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