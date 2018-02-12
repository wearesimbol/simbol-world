import * as THREE from 'three';
import EventEmitter from 'eventemitter3';
import {Physics} from '../../physics/physics';

const RETICLE_DISTANCE = 3;

/**
 * Selection
 * @namespace
 */
const Selection = {

	/** @property {object} objects - map of objects with ids that are selectable */
	objects: {},

	/** @property {object} hovering - map of object ids that are being hovered */
	hovering: {},

	/** @property {number} innerRadius - The inner sphere's radisu */
	innerRadius: 0.02,

	/** @property {number} outerRadius - The outer sphere's radius */
	outerRadius: 0.04,

	/** @property {number} reticleDistance - Default distance where the reticle will be located */
	reticleDistance: RETICLE_DISTANCE,

	/**
	 * Initializes a Selection instance
	 *
	 * @return {undefined}
	 */
	init() {
		// Initializes EventEmitter
		Object.setPrototypeOf(this.__proto__, new EventEmitter());

		this.rayCaster = new THREE.Raycaster();
		this.rayCaster.far = 10;

		this.reticle = this._createReticle();
	},

	/**
	 * Add an object that can be selectable
	 *
	 * @param {THREE.Object3D} object - Object to add
	 *
	 * @return {undefined}
	 */
	add(object) {
		const id = object.id;
		if (!this.objects[id]) {
			this.objects[id] = object;
		}
	},

	/**
	 * Removes an object so that it is no longer selectable
	 *
	 * @param {THREE.Object3D} object - Objects to be removed
	 *
	 * @return {undefined}
	 */
	remove(object) {
		delete this.objects[object.id];
	},

	/**
	 * Sets the position that will act as the RayCaster's origin
	 *
	 * @param {THREE.Vector3} position - Origin position
	 *
	 * @return {undefined}
	 */
	setOrigin(position) {
		this.rayCaster.ray.origin.copy(position);
		this._updateReticle();
	},

	/**
	 * Sets the orientation that represents the direction that the RayCaster should follow
	 *
	 * @param {THREE.Quaternion} orientation - The direction
	 *
	 * @return {undefined}
	 */
	setDirection(orientation) {
		const pointAt = new THREE.Vector3(0, 0, -1).applyQuaternion(orientation);
		this.rayCaster.ray.direction.copy(pointAt);
		this._updateReticle();
	},

	/**
	 * Returns the currently hovered mesh
	 *
	 * @return {THREE.Mesh} mesh
	 */
	getHoveredMesh() {
		let mesh;
		for (const id in this.hovering) {
			mesh = this.objects[id];
		}

		return mesh;
	},

	/**
	 * Selects the currently hovered mesh and emits a 'selected' event
	 *
	 * @return {undefined}
	 */
	select() {
		const mesh = this.getHoveredMesh();
		this.emit('selected', mesh);
	},

	/**
	 * Unselects the currently hovered mesh and emits a 'unselected' evemt
	 *
	 * @return {undefined}
	*/
	unselect() {
		const mesh = this.getHoveredMesh();
		this.emit('unselected', mesh);
	},

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
				this.emit('hover', object);
				this.isHovering = true;
			}

			if (!intersection && isHovering) {
				delete this.hovering[id];
				this.reticle.children[0].material.color.setHex(0xFFFFFF);
				this.emit('unhover', object);
				this.isHovering = false;
			}

			if (intersection) {
				this._moveReticle(intersection);
			} else {
				this._moveReticle(null);
			}
		}
	},

	/**
	 * Creates a spherical reticle
	 *
	 * @return {THREE.Group} reticle
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
	},

	/**
     * Moves the reticle to a position so that it's just in front of the mesh that it intersected with.
	 *
	 * @param {object} intersection - An intersection
	 *
	 * @return {undefined}
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
	},

	/**
	 * Updates the reticle's position
	 *
	 * @return {undefined}
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
};

export {Selection};
