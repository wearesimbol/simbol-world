'use strict';

import * as THREE from 'three';
import {Utils} from '../../src/utils/utils';
import {PoseController} from '../../src/controllers/posecontroller';

describe('PoseController', () => {

	let poseController;
	let gamepad;
	let locomotion;

	beforeEach(() => {
		sinon.stub(THREE.Quaternion.prototype, 'fromArray');
		gamepad = {
			id: 'test',
			hand: 'left',
			pose: {
				orientation: 1
			}
		};
		locomotion = {};
		poseController = new PoseController(gamepad, locomotion);
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
		// assert.deepEqual(PoseController.pressedButtons, {});
	});

	xdescribe('#constructor', () => {

	});
});
