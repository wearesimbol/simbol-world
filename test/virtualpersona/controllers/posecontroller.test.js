'use strict';

import * as THREE from 'three';
import {Utils} from '../../../src/utils/utils';
import {PoseController} from '../../../src/virtualpersona/controllers/posecontroller';

describe('PoseController', () => {

	let poseController;

	beforeEach(() => {
		poseController = Object.create(PoseController);
	});

	it('should be an object', () => {
		assert.isObject(PoseController);
	});

	it('should have a set of methods', () => {
		assert.isFunction(PoseController.init);
		assert.isFunction(PoseController.handleThumbpadPressed);
		assert.isFunction(PoseController.handleThumbpadTouched);
		assert.isFunction(PoseController.handleTriggerPressed);
		assert.isFunction(PoseController.handleGripPressed);
		assert.isFunction(PoseController.handleAppMenuPressed);
		assert.isFunction(PoseController.update);
	});

	it('should have a set of properties', () => {
		// assert.deepEqual(PoseController.pressedButtons, {});
	});

	describe('#init', () => {

	});
});
