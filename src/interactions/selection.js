import * as THREE from 'three';
import EventEmitter from 'eventemitter3';
import {Physics} from '../physics/physics';

const RETICLE_DISTANCE = 3;

/** Class for the Selection intraction */
class Selection {

	/** @property {object} objects - map of objects with ids that are selectable */
	get objects() {
		if (!this._objects) {
			this._objects = {};
		}
		return this._objects;
	}

	set objects(objects) {
		this._objects = objects;
	}

	/** @property {object} hovering - map of object ids that are being hovered */
	get hovering() {
		if (!this._hovering) {
			this._hovering = {};
		}
		return this._hovering;
	}

	set hovering(hovering) {
		this._hovering = hovering;
	}

	/** @property {number} innerRadius - The inner sphere's radisu */
	get innerRadius() {
		if (!this._innerRadius) {
			this._innerRadius = 0.02;
		}
		return this._innerRadius;
	}

	set innerRadius(innerRadius) {
		this._innerRadius = innerRadius;
	}

	/** @property {number} outerRadius - The outer sphere's radius */
	get outerRadius() {
		if (!this._outerRadius) {
			this._outerRadius = 0.04;
		}
		return this._outerRadius;
	}

	set outerRadius(outerRadius) {
		this._outerRadius = outerRadius;
	}

	/** @property {number} reticleDistance - Default distance where the reticle will be located */
	get reticleDistance() {
		if (!this._reticleDistance) {
			this._reticleDistance = RETICLE_DISTANCE;
		}
		return this._reticleDistance;
	}

	set reticleDistance(reticleDistance) {
		this._reticleDistance = reticleDistance;
	}

	/**
	 * Initializes a Selection instance
	 */
	constructor() {
		// Initializes EventEmitter
		Object.setPrototypeOf(this.__proto__, new EventEmitter());

		this.rayCaster = new THREE.Raycaster();
		this.rayCaster.far = 10;

		this.reticle = this._createReticle();
	}

	/**
	 * Add an object that can be selectable
	 *
	 * @param {THREE.Object3D} object - Object to add
	 *
	 * @returns {undefined}
	 */
	add(object) {
		const id = object.id;
		if (!this.objects[id]) {
			this.objects[id] = object;
		}
	}

	/**
	 * Removes an object so that it is no longer selectable
	 *
	 * @param {THREE.Object3D} object - Objects to be removed
	 *
	 * @returns {undefined}
	 */
	remove(object) {
		delete this.objects[object.id];
	}

	/**
	 * Sets the position that will act as the RayCaster's origin
	 *
	 * @param {THREE.Vector3} position - Origin position
	 *
	 * @returns {undefined}
	 */
	setOrigin(position) {
		this.rayCaster.ray.origin.copy(position);
		this._updateReticle();
	}

	/**
	 * Sets the orientation that represents the direction that the RayCaster should follow
	 *
	 * @param {THREE.Quaternion} orientation - The direction
	 *
	 * @returns {undefined}
	 */
	setDirection(orientation) {
		const pointAt = new THREE.Vector3(0, 0, -1).applyQuaternion(orientation);
		this.rayCaster.ray.direction.copy(pointAt);
		this._updateReticle();
	}

	/**
	 * Returns the currently hovered mesh
	 *
	 * @returns {THREE.Mesh} mesh
	 */
	getHoveredMesh() {
		let mesh;
		for (const id in this.hovering) {
			mesh = this.objects[id];
		}

		return mesh;
	}

	/**
	 * Selects the currently hovered mesh and emits a 'selected' event
	 *
	 * @returns {undefined}
	 */
	select() {
		const mesh = this.getHoveredMesh();
		this.emit('selected', {
			mesh
		});
	}

	/**
	 * Unselects the currently hovered mesh and emits a 'unselected' evemt
	 *
	 * @returns {undefined}
	*/
	unselect() {
		const mesh = this.getHoveredMesh();
		this.emit('unselected', {
			mesh
		});
	}

	/**
	 * Updates the reticle, and checks for intersections, emitting the appropriate events
	 *
	 * @param {THREE.Vector3} position - The position of the main interaction element
	 * @param {THREE.Quaternion} orientation = The orientation of the main interaction element
	 *
	 * @returns {undefined}
	 */
	update(position, orientation) {
		this.setOrigin(position);
		this.setDirection(orientation);

		for (const id in this.objects) {
			const object = this.objects[id];
			const intersection = Physics.checkRayCollision(this.rayCaster, object);
			const isHovering = this.hovering[id];

			if (intersection && !isHovering) {
				this.hovering[id] = true;
				this.reticle.children[0].material.color.setHex(0x99ff99);
				this.emit('hover', {
					mesh: object
				});
				this.isHovering = true;
			}

			if (!intersection && isHovering) {
				delete this.hovering[id];
				this.reticle.children[0].material.color.setHex(0xFFFFFF);
				this.emit('unhover', {
					mesh: object
				});
				this.isHovering = false;
			}

			if (intersection) {
				this._moveReticle(intersection);
			} else {
				this._moveReticle(null);
			}
		}
	}

	/**
	 * If reticle is hovering over a selectable item, select it
	 *
	 * @returns {undefined}
	 */
	handleSelection() {
		if (this.isHovering) {
			this.select();
		}
	}

	/**
	 * Creates a spherical reticle
	 *
	 * @returns {THREE.Group} reticle
	 *
	 * @private
	 */
	_createReticle() {
		const innerGeometry = new THREE.SphereGeometry(this.innerRadius, 32, 32);
		const innerMaterial = new THREE.MeshBasicMaterial({
			color: 0xFFFFFF,
			transparent: true,
			opacity: 0.9
		});
		const inner = new THREE.Mesh(innerGeometry, innerMaterial);

		const outerGeometry = new THREE.SphereGeometry(this.outerRadius, 32, 32);
		const outerMaterial = new THREE.MeshBasicMaterial({
			color: 0x333333,
			transparent: true,
			opacity: 0.3
		});
		const outer = new THREE.Mesh(outerGeometry, outerMaterial);

		const reticle = new THREE.Group();
		reticle.add(inner);
		reticle.add(outer);

		return reticle;
	}

	/**
     * Moves the reticle to a position so that it's just in front of the mesh that it intersected with.
	 *
	 * @param {object} intersection - An intersection
	 *
	 * @returns {undefined}
	 *
	 * @private
     */
	_moveReticle(intersection) {
		if (intersection) {
			this.reticleDistance = intersection.distance;
		} else {
			this.reticleDistance = RETICLE_DISTANCE;
		}

		this._updateReticle();
	}

	/**
	 * Updates the reticle's position
	 *
	 * @returns {undefined}
	 *
	 * @private
	 */
	_updateReticle() {
		const ray = this.rayCaster.ray;
		// Position the reticle at a distance, as calculated from the origin and direction.
		this.reticle.position.copy(ray.direction);
		this.reticle.position.multiplyScalar(this.reticleDistance);
		this.reticle.position.add(ray.origin);
	}
}

export {Selection};
