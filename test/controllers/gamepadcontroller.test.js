'use strict';

import * as THREE from 'three';
import EventEmitter from 'eventemitter3';
import {GamepadController} from '../../src/controllers/gamepadcontroller';
import { Controllers } from '../../src/controllers/controllers';

describe('GamepadController', () => {

	let gamepadController;
	let locomotion;

	beforeEach(() => {
		const gamepad = {
			id: 'gamepad',
			hand: 'left'
		};

		gamepadController = new GamepadController(gamepad);
	});

	it('should be a class', () => {
		assert.isFunction(GamepadController);
	});

	it('should have a set of methods', () => {
		assert.isFunction(GamepadController.prototype.handleTriggerPressed);
		assert.isFunction(GamepadController.prototype.update);
	});

	it('should have a set of properties', () => {
		assert.deepEqual(GamepadController.prototype.pressedButtons, {});
	});

	describe('#constructor', () => {

		it('should extend EventEmitter', () => {
			assert.instanceOf(gamepadController, EventEmitter);
		});

		it('should set some properties', () => {
			assert.equal(gamepadController.id, 'gamepad (left)');
		});
	});

	describe('#handleTriggerPressed', () => {
		
		beforeEach(() => {
			sinon.stub(gamepadController, 'emit');
			gamepadController.handleTriggerPressed(true);
		});

		it('should emit trigger event', () => {
			assert.isTrue(gamepadController.emit.calledOnce);
			assert.isTrue(gamepadController.emit.calledWith('triggerpressed'));
		})
	});
	
	describe('#update', () => {

		beforeEach(() => {
			sinon.stub(Controllers, 'getGamepad');
			sinon.stub(gamepadController, 'emit');
		});

		afterEach(() => {
			Controllers.getGamepad.restore();
		});

		describe('no gamepad', () => {

			beforeEach(() => {
				gamepadController.update();
			});

			it('should emit controllerdisconnected', () => {
				assert.isTrue(gamepadController.emit.calledOnce);
				assert.equal(gamepadController.emit.firstCall.args[0], 'controllerdisconnected');
				assert.deepEqual(gamepadController.emit.firstCall.args[1], {
					id: 'gamepad (left)'
				});
			});
		});

		describe('gamepad', () => {

			let gamepad = {
				buttons: {
					0: {
						pressed: true
					}
				}
			};

			beforeEach(() => {
				sinon.stub(gamepadController, 'handleTriggerPressed');
				Controllers.getGamepad.returns(gamepad);

				gamepadController.update();
			});

			it('should handle pressed button', () => {
				assert.isTrue(gamepadController.handleTriggerPressed.calledOnce);
				assert.isTrue(gamepadController.handleTriggerPressed.calledWith(true));
				assert.isTrue(gamepadController.pressedButtons[0]);
			});
		});
	});
});