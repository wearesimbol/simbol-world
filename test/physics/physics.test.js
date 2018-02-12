'use strict';

import {Physics} from '../../src/physics/physics';

describe('Physics', () => {

	it('should be an object', () => {
		assert.isObject(Physics);
	});

	it('should have a set of methods', () => {
		assert.isFunction(Physics.checkRayCollision);
		assert.isFunction(Physics.checkMeshCollision);
	});

	describe('#checkRayCollision', () => {

		let rayCaster;
		let intersection;

		beforeEach(() => {
			rayCaster = {
				intersectObjects: sinon.stub().returns([1]),
				intersectObject: sinon.stub().returns([])
			};
		});

		describe('group mesh', () => {

			beforeEach(() => {
				const mesh = {
					children: [1]
				};

				intersection = Physics.checkRayCollision(rayCaster, mesh);
			});

			it('should try to intersect with a group mesh', () => {
				assert.isFalse(rayCaster.intersectObject.called);
				assert.isTrue(rayCaster.intersectObjects.calledOnce);
				assert.deepEqual(rayCaster.intersectObjects.firstCall.args[0], [1]);
			});

			it('should intersect', () => {
				assert.equal(intersection, 1);
			});
		});

		describe('single mesh', () => {

			beforeEach(() => {
				const mesh = {
					children: []
				};

				intersection = Physics.checkRayCollision(rayCaster, mesh);
			});

			it('should try to intersect with a single mesh', () => {
				assert.isFalse(rayCaster.intersectObjects.called);
				assert.isTrue(rayCaster.intersectObject.calledOnce);
				assert.deepEqual(rayCaster.intersectObject.firstCall.args[0], {children: []});
			});

			it('should not intersect', () => {
				assert.isFalse(intersection);
			});
		});
	});

	describe('#checkMeshCollision', () => {

		beforeEach(() => {

		});

		it('TODO', () => {

		});
	});
});