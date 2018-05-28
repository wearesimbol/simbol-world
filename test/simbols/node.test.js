'use strict';

import * as THREE from 'three';
import EventEmitter from 'eventemitter3';
import {NodeSimbol} from '../../src/simbols/node';

describe('NodeSimbol', () => {

	let nodeSimbol;

	beforeEach(() => {
		nodeSimbol = new NodeSimbol();
	});

	it('should be a class', () => {
		assert.isFunction(NodeSimbol);
	});

	it('should have a set of methods', () => {
		assert.isFunction(NodeSimbol.prototype.add);
		assert.isFunction(NodeSimbol.prototype.remove);
	});

	it('should have a set of properties', () => {
		assert.deepEqual(NodeSimbol.prototype.children, []);
		assert.instanceOf(NodeSimbol.prototype.mesh, THREE.Group);
	});

	describe('#constructor', () => {

		it('should extend EventEmitter', () => {
			assert.instanceOf(nodeSimbol, EventEmitter);
		});
	});

	describe('#add', () => {

		let node;

		describe('not a NodeSimbol', () => {

			beforeEach(() => {
				node = {};
				
				nodeSimbol.add(node);
			});

			it('should return', () => {
				assert.equal(nodeSimbol.children.length, 0);
			});
		});

		describe('NodeSimbol', () => {

			beforeEach(() => {
				node = new NodeSimbol();
				sinon.stub(nodeSimbol.mesh, 'add');
				
				nodeSimbol.add(node);
			});

			it('should add child node', () => {
				assert.deepEqual(nodeSimbol.children, [node]);
				assert.equal(node.parent, nodeSimbol);
				assert.isTrue(nodeSimbol.mesh.add.calledOnce);
				assert.isTrue(nodeSimbol.mesh.add.calledWith(node.mesh));
			});
		});
	});

	describe('#remove', () => {

		let node;

		beforeEach(() => {
			node = {
				parent: true,
				mesh: 1
			};
			nodeSimbol.children = [];
			nodeSimbol.children.push(node);
			sinon.stub(nodeSimbol.mesh, 'remove');

			nodeSimbol.remove(node);
		});

		it('should remove child node', () => {
			assert.deepEqual(nodeSimbol.children, []);
			assert.isTrue(nodeSimbol.mesh.remove.calledOnce);
			assert.isTrue(nodeSimbol.mesh.remove.calledWith(1));
			assert.isUndefined(node.parent);
		});
	});
});
