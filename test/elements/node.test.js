'use strict';

import * as THREE from 'three';
import EventEmitter from 'eventemitter3';
import {NodeElement} from '../../src/elements/node';

describe('NodeElement', () => {

	let nodeElement;

	beforeEach(() => {
		nodeElement = new NodeElement();
	});

	it('should be a class', () => {
		assert.isFunction(NodeElement);
	});

	it('should have a set of methods', () => {
		assert.isFunction(NodeElement.prototype.add);
		assert.isFunction(NodeElement.prototype.remove);
	});

	it('should have a set of properties', () => {
		assert.deepEqual(NodeElement.prototype.children, []);
		assert.instanceOf(NodeElement.prototype.mesh, THREE.Group);
	});

	describe('#constructor', () => {

		it('should extend EventEmitter', () => {
			assert.instanceOf(nodeElement, EventEmitter);
		});
	});

	describe('#add', () => {

		let node;

		describe('not a NodeElement', () => {

			beforeEach(() => {
				node = {};
				
				nodeElement.add(node);
			});

			it('should return', () => {
				assert.equal(nodeElement.children.length, 0);
			});
		});

		describe('NodeElement', () => {

			beforeEach(() => {
				node = new NodeElement();
				sinon.stub(nodeElement.mesh, 'add');
				
				nodeElement.add(node);
			});

			it('should add child node', () => {
				assert.deepEqual(nodeElement.children, [node]);
				assert.equal(node.parent, nodeElement);
				assert.isTrue(nodeElement.mesh.add.calledOnce);
				assert.isTrue(nodeElement.mesh.add.calledWith(node.mesh));
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
			nodeElement.children = [];
			nodeElement.children.push(node);
			sinon.stub(nodeElement.mesh, 'remove');

			nodeElement.remove(node);
		});

		it('should remove child node', () => {
			assert.deepEqual(nodeElement.children, []);
			assert.isTrue(nodeElement.mesh.remove.calledOnce);
			assert.isTrue(nodeElement.mesh.remove.calledWith(1));
			assert.isUndefined(node.parent);
		});
	});
});
