'use strict';

import * as THREE from 'three';
import {Link} from '../../src/scene/link';

describe('Link', () => {

	let link;

	beforeEach(() => {
		link = Object.create(Link);
	});

	it('should be an object', () => {
		assert.isObject(Link);
	});

	it('should have a set of methods', () => {
		assert.isFunction(Link.init);
		assert.isFunction(Link._constructMesh);
		assert.isFunction(Link.render);
		assert.isFunction(Link.hover);
		assert.isFunction(Link.navigate);
	});

	it('should have a set of properties', () => {
		assert.deepEqual(Link.defaultRingColor, new THREE.Color(1, 1, 1));
		assert.deepEqual(Link.defaultRingHoverColor, new THREE.Color(2, 2, 2));
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

	describe('#init', () => {

		let path;
		let position;
		let scene;

		beforeEach(() => {
			path = 'mypath';
			position = [1, 2, 3];
			scene = {};
			link._constructMesh = sinon.stub().returns(1);

			link.init(path, position, scene);
		});

		it('should set properties', () => {
			assert.equal(link.path, path);
			assert.deepEqual(link.position, new THREE.Vector3(1, 2, 3));
			assert.equal(link.scene, scene);
		});

		it('should call _consturctMesh', () => {
			assert.isTrue(link._constructMesh.calledOnce);
			assert.equal(link.mesh, 1);
		});
	});

	describe('#_constructMesh', () => {

		let mesh;

		beforeEach(() => {
			link._position = new THREE.Vector3(1, 2, 3);
			mesh = link._constructMesh();
		});

		it('should return a mesh', () => {
			assert.instanceOf(mesh, THREE.Mesh);
			assert.deepEqual(mesh.position, new THREE.Vector3(1, 2, 3));
		});
	});
	
	describe('#render', () => {

		let scene;

		beforeEach(() => {
			scene = {
				addToScene: sinon.stub()
			};
			link.mesh = {};
			link.scene = scene;

			link.render();
		});

		it('should add mesh to scene', () => {
			assert.isTrue(scene.addToScene.calledOnce);
			assert.isTrue(scene.addToScene.calledWith(link.mesh));
		});
	});
		
	describe('#hover', () => {

	});
	
	describe('#navigate', () => {
		// Can't test this, would break all tests as it changes the location
	});
});
