'use strict';

import * as THREE from 'three';
import {Link} from '../../src/utils/link';

describe('Link', () => {

	let link;
	let name;
	let path;
	let position;
	let identity;

	beforeEach(() => {
		name = 'path';
		path = 'http://example.com';
		position = [1, 2, 3];
		identity = {
			uPortData: 'test'
		};
		sinon.stub(Link.prototype, '_constructMesh').returns(1);
		sinon.stub(Link.prototype, '_constructAEl').returns(2);

		link = new Link(name, path, position, identity);
	});

	afterEach(() => {
		Link.prototype._constructMesh.restore && Link.prototype._constructMesh.restore();
		Link.prototype._constructAEl.restore && Link.prototype._constructAEl.restore();
	})

	it('should be a class', () => {
		assert.isFunction(Link);
	});

	it('should have a set of methods', () => {
		assert.isFunction(Link.prototype._constructMesh);
		assert.isFunction(Link.prototype._constructAEl);
		assert.isFunction(Link.prototype.render);
		assert.isFunction(Link.prototype.hover);
		assert.isFunction(Link.prototype.getPath);
		assert.isFunction(Link.prototype.navigate);
	});

	it('should have a set of properties', () => {
		assert.deepEqual(Link.prototype.defaultRingColor, new THREE.Color(1, 1, 1));
		assert.deepEqual(Link.prototype.defaultRingHoverColor, new THREE.Color(2, 2, 2));
	});
	
	describe('#setterPosition', () => {

		beforeEach(() => {
			link.mesh = {
				position: {
					copy: sinon.stub()
				}
			};

			link.position = [1, 2, 3];
		});

		it('should create a THREE.Vector3', () => {
			assert.deepEqual(link.position, new THREE.Vector3(1, 2, 3));
		});

		it('should set the mesh\'s position', () => {
			assert.isTrue(link.mesh.position.copy.calledOnce);
			assert.isTrue(link.mesh.position.copy.calledWith(link.position));
		});
	});

	describe('#constructor', () => {

		it('should set properties', () => {
			assert.equal(link.name, name);
			assert.equal(link.path, path);
			assert.deepEqual(link.position, new THREE.Vector3(1, 2, 3));
			assert.equal(link.identity, identity);
		});

		it('should call _consturctMesh', () => {
			assert.isTrue(link._constructMesh.calledOnce);
			assert.equal(link.mesh, 1);
		});
	});

	describe('#_constructMesh', () => {

		let mesh;

		beforeEach(() => {
			Link.prototype._constructMesh.restore();
			link._position = new THREE.Vector3(1, 2, 3);
			mesh = link._constructMesh();
		});

		it('should return a mesh', () => {
			assert.instanceOf(mesh, THREE.Mesh);
			assert.deepEqual(mesh.position, new THREE.Vector3(1, 2, 3));
		});
	});

	describe('#_constructAEl', () => {

		let aEl;

		beforeEach(() => {
			Link.prototype._constructAEl.restore();
			aEl = link._constructAEl();
		});

		it('should return a mesh', () => {
			assert.instanceOf(aEl, HTMLAnchorElement);
			assert.equal(aEl.href, 'http://example.com/');
			assert.equal(aEl.textContent, 'path');
		});
	});
	
	describe('#render', () => {

		let scene;

		beforeEach(() => {
			scene = {
				addToScene: sinon.stub()
			};
			link.mesh = {};

			link.render(scene);
		});

		it('should add mesh to scene', () => {
			assert.isTrue(scene.addToScene.calledOnce);
			assert.isTrue(scene.addToScene.calledWith(link.mesh));
		});
	});
		
	xdescribe('#hover', () => {

	});

	describe('#getPath', () => {

		let path;

		beforeEach(() => {
			path = link.getPath();
		});

		it('should generate path with url parameters', () => {
			console.log(path)
			assert.equal(path, 'http://example.com?simbolIdentity=%22test%22');
		});
	});
	
	xdescribe('#navigate', () => {
		// Can't test this, would break all tests as it changes the location
	});
});
