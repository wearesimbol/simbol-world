'use strict';

import * as THREE from 'three';
import EventEmitter from 'eventemitter3';
import {Physics} from '../../src/physics/physics';
import {Selection} from '../../src/interactions/selection';

describe('Selection', () => {

	let selection;

	beforeEach(() => {
		sinon.stub(Selection.prototype, '_createReticle');

		selection = new Selection();
	});

	afterEach(() => {
		Selection.prototype._createReticle.restore && Selection.prototype._createReticle.restore();
	});


	it('should be a class', () => {
		assert.isFunction(Selection);
	});

	it('should have a set of methods', () => {
		assert.isFunction(Selection.prototype.add);
		assert.isFunction(Selection.prototype.remove);
		assert.isFunction(Selection.prototype.setOrigin);
		assert.isFunction(Selection.prototype.setDirection);
		assert.isFunction(Selection.prototype.getHoveredMesh);
		assert.isFunction(Selection.prototype.select);
		assert.isFunction(Selection.prototype.unselect);
		assert.isFunction(Selection.prototype.update);
		assert.isFunction(Selection.prototype.handleSelection);
		assert.isFunction(Selection.prototype._createReticle);
		assert.isFunction(Selection.prototype._moveReticle);
		assert.isFunction(Selection.prototype._updateReticle);
	});

	it('should have a set of properties', () => {
		assert.deepEqual(Selection.prototype.objects, {});
		assert.deepEqual(Selection.prototype.hovering, {});
		assert.equal(Selection.prototype.innerRadius, 0.02);
		assert.equal(Selection.prototype.outerRadius, 0.04);
		assert.equal(Selection.prototype.reticleDistance, 3);
	});

	describe('#constructor', () => {

		it('should extend EventEmitter and set properties', () => {
			assert.instanceOf(selection, EventEmitter);
			assert.instanceOf(selection.rayCaster, THREE.Raycaster);
			assert.equal(selection.rayCaster.far, 10);
			assert.isTrue(selection._createReticle.calledOnce);
		});
	});

	describe('#add', () => {

		let object;

		beforeEach(() => {
			object = {
				id: 1
			};

			selection.add(object);
		});

		it('should save object', () => {
			assert.equal(selection.objects[1], object);
		});
	});

	describe('#remove', () => {

		let object;

		beforeEach(() => {
			object = {
				id: 1
			};

			selection.objects[1] = object;

			selection.remove(object);
		});

		it('should remove object', () => {
			assert.isUndefined(selection.objects[1]);
		});
	});

	describe('#setOrigin', () => {
		
		beforeEach(() => {
			selection.rayCaster = {
				ray: {
					origin: {
						copy: sinon.stub()
					}
				}
			};

			sinon.stub(selection, '_updateReticle');

			selection.setOrigin(1);
		});

		it('should update ray origin', () => {
			assert.isTrue(selection.rayCaster.ray.origin.copy.calledOnce);
			assert.isTrue(selection.rayCaster.ray.origin.copy.calledWith(1));
			assert.isTrue(selection._updateReticle.calledOnce);
		});
	});

	describe('#setDirection', () => {

		beforeEach(() => {
			selection.rayCaster = {
				ray: {
					direction: {
						copy: sinon.stub()
					}
				}
			};
			sinon.stub(selection, '_updateReticle');
			const quaternion = new THREE.Quaternion();
			selection.setDirection(quaternion);
		});

		it('should update ray direction', () => {
			assert.isTrue(selection.rayCaster.ray.direction.copy.calledOnce);
			assert.deepEqual(selection.rayCaster.ray.direction.copy.firstCall.args[0], new THREE.Vector3(0, 0, -1));
			assert.isTrue(selection._updateReticle.calledOnce);
		});
	});

	describe('#getHoveredMesh', () => {

		let object;
		let mesh;

		beforeEach(() => {
			object = {
				id: 1
			};
			selection.objects[1] = object;
			selection.hovering[1] = true;

			mesh = selection.getHoveredMesh();
		});

		it('should return selected mesh', () => {
			assert.equal(object, mesh);
		});
	});

	describe('#select', () => {

		beforeEach(() => {
			sinon.stub(selection, 'getHoveredMesh').returns(1);
			sinon.stub(selection, 'emit');

			selection.select();
		});

		it('should emit "selected" event with mesh', () => {
			assert.isTrue(selection.getHoveredMesh.calledOnce);
			assert.isTrue(selection.emit.calledOnce);
			assert.deepEqual(selection.emit.firstCall.args[0], 'selected');
			assert.deepEqual(selection.emit.firstCall.args[1], {mesh:1});
		});
	});

	describe('#unselect', () => {

		beforeEach(() => {
			sinon.stub(selection, 'getHoveredMesh').returns(1);
			sinon.stub(selection, 'emit');

			selection.unselect();
		});

		it('should emit "unselected" event with mesh', () => {
			assert.isTrue(selection.getHoveredMesh.calledOnce);
			assert.isTrue(selection.emit.calledOnce);
			assert.deepEqual(selection.emit.firstCall.args[0], 'unselected');
			assert.deepEqual(selection.emit.firstCall.args[1], {mesh:1});
		});
	});

	describe('#update', () => {

		let object;

		beforeEach(() => {
			sinon.stub(selection, 'setOrigin');
			sinon.stub(selection, 'setDirection');
			sinon.stub(selection, '_moveReticle');
			sinon.stub(Physics, 'checkRayCollision').returns(false);

			selection.emit = sinon.stub();
			
			object = {
				id: 1
			};
			selection.objects[1] = object;
			selection.rayCaster = 1;
			selection.reticle = {
				children: [{
					material: {
						color: {
							setHex: sinon.stub()
						}
					}
				}]
			};
		});

		afterEach(() => {
			Physics.checkRayCollision.restore();
		});

		describe('common', () => {

			beforeEach(() => {
				selection.update(1, 1);
			});

			it('should update position and orientation', () => {
				assert.isTrue(selection.setOrigin.calledOnce);
				assert.isTrue(selection.setOrigin.calledWith(1));
				assert.isTrue(selection.setDirection.calledOnce);
				assert.isTrue(selection.setDirection.calledWith(1));
			});
	
			it('should check collision', () => {
				assert.isTrue(Physics.checkRayCollision.calledOnce);
				assert.isTrue(Physics.checkRayCollision.calledWith(1, object));
			});
		});

		describe('hover', () => {

			beforeEach(() => {
				Physics.checkRayCollision.returns(true);

				selection.update();
			});

			it('should activate hover', () => {
				assert.isTrue(selection.hovering[1]);
				assert.isTrue(selection.reticle.children[0].material.color.setHex.calledOnce);
				assert.isTrue(selection.reticle.children[0].material.color.setHex.calledWith(0x99ff99));
				assert.isTrue(selection.emit.calledOnce);
				assert.deepEqual(selection.emit.firstCall.args[0], 'hover');
				assert.deepEqual(selection.emit.firstCall.args[1], {mesh:object});
				assert.isTrue(selection.isHovering);
			});

			it('should update reticle', () => {
				assert.isTrue(selection._moveReticle.calledOnce);
				assert.isTrue(selection._moveReticle.calledWith(true));
			});
		});

		describe('unhover', () => {

			beforeEach(() => {
				selection.isHovering = true;
				selection.update();
			});

			it('should activate unhover', () => {
				assert.isUndefined(selection.hovering[1]);
				assert.isTrue(selection.reticle.children[0].material.color.setHex.calledOnce);
				assert.isTrue(selection.reticle.children[0].material.color.setHex.calledWith(0xFFFFFF));
				assert.isTrue(selection.emit.calledOnce);
				assert.deepEqual(selection.emit.firstCall.args[0], 'unhover');
				assert.deepEqual(selection.emit.firstCall.args[1], {mesh:object});
				assert.isFalse(selection.isHovering);
			});

			it('should update reticle', () => {
				assert.isTrue(selection._moveReticle.calledOnce);
				assert.isTrue(selection._moveReticle.calledWith(null));
			});
		});
	});

	describe('#_createReticle', () => {

		let reticle;

		beforeEach(() => {
			Selection.prototype._createReticle.restore();

			reticle = selection._createReticle();
		});

		it('should return a THREE.Group with 2 children meshes', () => {
			assert.instanceOf(reticle, THREE.Group);
			assert.equal(reticle.children.length, 2);
		});

		it('should create 2 sphere geometries', () => {
			assert.instanceOf(reticle.children[0].geometry, THREE.SphereGeometry);
			assert.equal(reticle.children[0].geometry.parameters.radius, 0.02);
			assert.equal(reticle.children[0].geometry.parameters.heightSegments, 32);
			assert.equal(reticle.children[0].geometry.parameters.widthSegments, 32);
			assert.instanceOf(reticle.children[1].geometry, THREE.SphereGeometry);
			assert.equal(reticle.children[1].geometry.parameters.radius, 0.04);
			assert.equal(reticle.children[1].geometry.parameters.heightSegments, 32);
			assert.equal(reticle.children[1].geometry.parameters.widthSegments, 32);	
		});

		it('should create 2 basic materials', () => {
			assert.instanceOf(reticle.children[0].material, THREE.MeshBasicMaterial);
			assert.equal(reticle.children[0].material.color.getHexString(), 'ffffff');
			assert.equal(reticle.children[0].material.transparent, true);
			assert.equal(reticle.children[0].material.opacity, 0.9);
			assert.instanceOf(reticle.children[1].material, THREE.MeshBasicMaterial);
			assert.equal(reticle.children[1].material.color.getHexString(), '333333');
			assert.equal(reticle.children[1].material.transparent, true);
			assert.equal(reticle.children[1].material.opacity, 0.3);	
		});
	});

	describe('#_moveReticle', () => {

		beforeEach(() => {
			sinon.stub(selection, '_updateReticle');
		});

		describe('intersected', () => {

			beforeEach(() => {
				selection._moveReticle({
					distance: 1
				});
			});

			it('should set reticleDistance and update it', () => {
				assert.equal(selection.reticleDistance, 1);
				assert.isTrue(selection._updateReticle.calledOnce);
			});
		});

		describe('not intersected', () => {
			
			beforeEach(() => {
				selection._moveReticle(false);
			});

			it('should set reticleDistance and update it', () => {
				assert.equal(selection.reticleDistance, 3);
				assert.isTrue(selection._updateReticle.calledOnce);
			});
		});
	});

	describe('#handleSelection', () => {

		beforeEach(() => {
			sinon.stub(selection, 'select');
			selection.isHovering = true;

			selection.handleSelection();
		});

		it('should select if hovering', () => {
			assert.isTrue(selection.select.calledOnce);
		});
	});

	describe('#_updateReticle', () => {

		beforeEach(() => {
			selection.rayCaster = {
				ray: {
					origin: 1,
					direction: 2
				}
			};

			selection.reticle = {
				position: {
					copy: sinon.stub(),
					multiplyScalar: sinon.stub(),
					add: sinon.stub()
				}
			};

			selection._updateReticle()
		});

		it('should update reticle position', () => {
			assert.isTrue(selection.reticle.position.copy.calledOnce);
			assert.isTrue(selection.reticle.position.copy.calledWith(2));
			assert.isTrue(selection.reticle.position.multiplyScalar.calledOnce);
			assert.isTrue(selection.reticle.position.multiplyScalar.calledWith(3));
			assert.isTrue(selection.reticle.position.add.calledOnce);
			assert.isTrue(selection.reticle.position.add.calledWith(1));
		});
	});
});
