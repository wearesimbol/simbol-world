'use strict';

import * as THREE from 'three';
import {Utils} from '../../../src/utils/utils';
import {GamepadController} from '../../../src/virtualpersona/controllers/gamepadcontroller';

describe('GamepadController', () => {

	let gamepadController;

	beforeEach(() => {
		gamepadController = Object.create(GamepadController);
	});

	it('should be an object', () => {
		assert.isObject(GamepadController);
	});

	it('should have a set of methods', () => {
		assert.isFunction(GamepadController.init);
		assert.isFunction(GamepadController.handleTriggerPressed);
		assert.isFunction(GamepadController.update);
	});

	it('should have a set of properties', () => {
		assert.deepEqual(GamepadController.pressedButtons, {});
	});

	describe('#init', () => {

		let locomotion;

		beforeEach(() => {
			const gamepad = {
				id: 'gamepad',
				hand: 'left'
			};
			locomotion = {
				scene: {
					camera: {
						quaternion: [1, 2, 3, 4]
					}
				}
			};

			gamepadController.init(gamepad, locomotion);
		});

		it('should set some properties', () => {
			assert.equal(gamepadController.locomotion, locomotion);
			assert.equal(gamepadController.id, 'gamepad (left)');
			assert.deepEqual(gamepadController.cameraQuaternion.toArray(), [1, 2, 3, 4]);
		});
	});

	describe('#handleTriggerPressed', () => {

		let locomotion;
		
		beforeEach(() => {
			locomotion = {
				teleportation: {
					isRayCurveActive: false,
					resetTeleport: sinon.stub(),
					setRayCurveState: sinon.stub()
				},
				virtualPersona: {
					interactions: {
						selection: {
							isHovering: false
						}
					}
				}
			};

			gamepadController.locomotion = locomotion;
		});

		describe('ray curve inactive', () => {

			beforeEach(() => {
				gamepadController.handleTriggerPressed(true);
			});
			
			it('should activate ray curve', () => {
				assert.isTrue(locomotion.teleportation.setRayCurveState.calledOnce);
				assert.isTrue(locomotion.teleportation.setRayCurveState.calledWith(true));
			});
		});

		describe('ray curve inactive', () => {

			beforeEach(() => {
				locomotion.teleportation.isRayCurveActive = true;

				gamepadController.handleTriggerPressed(true);
			});
			
			it('should activate ray curve', () => {
				assert.isTrue(locomotion.teleportation.resetTeleport.calledOnce);
			});
		});
	});
	
	describe('#update', () => {

		let locomotion;

		beforeEach(() => {
			sinon.stub(Utils, 'areQuaternionsEqual').returns(true);
			locomotion = {

			};
			gamepadController.locomotion = locomotion;

			gamepadController.update();
		});

		afterEach(() => {
			Utils.areQuaternionsEqual.restore();
		});

		it('')
	});
});