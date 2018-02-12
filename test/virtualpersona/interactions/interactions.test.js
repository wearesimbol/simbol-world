'use strict';

import EventEmitter from 'eventemitter3';
import {Interactions} from '../../../src/virtualpersona/interactions/interactions';
import {Selection} from '../../../src/virtualpersona/interactions/selection';

describe('Interactions', () => {

	let interactions;

	beforeEach(() => {
		interactions = Object.create(Interactions);
	});

	it('should be an object', () => {
		assert.isObject(Interactions);
	});

	it('should have a set of methods', () => {
		assert.isFunction(Interactions.init);
		assert.isFunction(Interactions.update);
		assert.isFunction(Interactions.getMeshes);
	});

	describe('#init', () => {

		beforeEach(() => {
			sinon.stub(Selection, 'init');

			interactions.init();
		});

		it('should initialize EventEmitter and Selection', () => {
			assert.deepEqual(interactions.selection, Object.create(Selection));
			assert.isTrue(Selection.init.calledOnce);
			assert.instanceOf(interactions.__proto__, EventEmitter);
		});
	});

	describe('#update', () => {

		const position = 1;
		const orientation = 2;

		beforeEach(() => {
			interactions.selection = {
				update: sinon.stub()
			};

			interactions.update(position, orientation);
		});

		it('should update selection', () => {
			assert.isTrue(interactions.selection.update.calledOnce);
			assert.isTrue(interactions.selection.update.calledWith(position, orientation));
		});
	});

	describe('#getMeshes', () => {

		const reticle = 1;
		let meshes;

		beforeEach(() => {
			interactions.selection = {
				reticle
			};

			meshes = interactions.getMeshes();
		});

		it('should return all interaction meshes', () => {
			assert.deepEqual(meshes, [1]);
		});
	});
});