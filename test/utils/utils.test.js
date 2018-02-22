'use strict';

import * as THREE from 'three';
import {Utils} from '../../src/utils/utils';

xdescribe('Utils', () => {

	it('should be a class', () => {
		assert.isFunction(Utils);
	});

	it('should have a set of methods', () => {
		assert.isFunction(Utils.debounce);
		assert.isFunction(Utils.areQuaternionsEqual);
	});

	describe('#debounce', () => {

		let clock;
		let callback;
		let debounced;

		beforeEach(() => {
			clock = sinon.useFakeTimers();
			callback = sinon.spy();

			debounced = Utils.debounce(callback, 100);
		});

		afterEach(() => {
			clock.restore();
		});

		it('should debounce callback by 100ms', (done) => {
			debounced();

			clock.tick(99);
			assert.equal(callback.callCount, 0);

			debounced();

			clock.tick(99);
			assert.equal(callback.callCount, 0);

			clock.tick(1);
			assert.equal(callback.callCount, 1);

			done();
		});

		it('should add a timeout id', (done) => {
			debounced();
			assert.isNumber(debounced.id);
			done();
		});
	});

	describe('#areQuaternionsEqual', () => {

		let difference;

		beforeEach(() => {
			const quaternion1 = new THREE.Quaternion().set(1, 1, 1, 1);
			const quaternion2 = new THREE.Quaternion().set(0.999, 0.999, 0.999, 1);
			difference = Utils.areQuaternionsEqual(quaternion1, quaternion2);
		});

		it('should return false if quaternion rotation is too much', () => {
			assert.isFalse(difference);
		});
	});
});