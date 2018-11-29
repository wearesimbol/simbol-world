import * as THREE from 'three';
import EventEmitter from 'eventemitter3';
import {Physics} from '../physics/physics';

const RETICLE_DISTANCE = 2.5;

/** Class for the Selection intraction */
class Selection extends EventEmitter {

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
		super();

		this.rayCaster = new THREE.Raycaster();
		this.rayCaster.far = 10;

		this.reticle = this._createReticle();
	}

	/**
	 * Add an object that can be selectable
	 *
	 * @param {THREE.Object3D} object - Object to add
	 *
	 * @example
	 * const selectableMesh = new THREE.Mesh();
	 * simbol.addToScene(selectableMesh);
	 * // Makes an object in the scene selectable
	 * selection.add(selectableMesh);
	 *
	 * @returns {undefined}
	 */
	add(object) {
		const id = object.id;
		if (!this.objects[id]) {
			for (const property in EventEmitter.prototype) {
				object[property] = EventEmitter.prototype[property];
			}
			EventEmitter.call(object);
			this.objects[id] = object;
		}
	}

	/**
	 * Removes an object so that it is no longer selectable
	 *
	 * @param {THREE.Object3D} object - Objects to be removed
	 *
	 * @example
	 * // selectableMesh will no longer be selectable
	 * selection.remove(selectableMesh);
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
	 * @example
	 * selection.setOrigin(new THREE.Vector3(1, 1, 1));
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
	 * @example
	 * selection.setDirection(new THREE.Quaternion());
	 *
	 * @returns {undefined}
	 */
	setDirection(orientation) {
		const pointAt = new THREE.Vector3(0, 0, -1).applyQuaternion(orientation);
		this.rayCaster.ray.direction.copy(pointAt);
		this._updateReticle();
	}

	/**
	 * Selects the currently hovered mesh and emits a 'selected' event
	 *
	 * @example
	 * selection.select();
	 *
	 * @returns {undefined}
	 *
	 * @emits Selection#selected
	 */
	select() {
		const mesh = this.hoveredMesh;
		if (this.selectedMesh && mesh !== this.selectedMesh) {
			this.selectedMesh.emit('unselected', {
				mesh: this.selectedMesh
			});
		}
		this.selectedMesh = mesh;

		if (mesh) {
			/**
			 * Selection selected event that's emitted with
			 * the selected mesh
			 *
			 * @event Selection#selected
			 * @type {object}
			 * @property mesh - Selected mesh
			 */
			mesh.emit('selected', {
				mesh
			});
			// Used, for example, to cancel teleportation
			this.emit('selected');
		}
	}

	/**
	 * Unselects the currently hovered mesh and emits a 'unselected' evemt
	 *
	 * @example
	 * selection.unselect();
	 *
	 * @returns {undefined}
	 *
	 * @emits Selection#unselected
	*/
	unselect() {
		const mesh = this.hoveredMesh;
		/**
		 * Selection unselected event that's emitted with
		 * the unselected mesh
		 *
		 * @event Selection#unselected
		 * @type {object}
		 * @property mesh - Unselected mesh
		 */
		mesh.emit('unselected', {
			mesh
		});
	}

	/**
	 * Updates the reticle, and checks for intersections, emitting the appropriate events
	 *
	 * @param {THREE.Vector3} position - The position of the main interaction element
	 * @param {THREE.Quaternion} orientation = The orientation of the main interaction element
	 *
	 * @example
	 * // Position and Orientation normally comes from the controller
	 * selection.update(controller.position, controller.quaternion);
	 *
	 * @returns {undefined}
	 *
	 * @emits Selection#hover
	 * @emits Selection#unhover
	 */
	update(position, orientation) {
		this.setOrigin(position);
		this.setDirection(orientation);

		let intersectionDistance = 0;

		for (const id in this.objects) {
			const object = this.objects[id];
			const intersection = Physics.checkRayCollision(this.rayCaster, object);
			const isHovering = this.hovering[id];

			if (intersection && !isHovering) {
				this.hovering[id] = true;
				this.reticle.children[0].material.color.setHex(0x99ff99);
				/**
				 * Selection hover event that's emitted with
				 * the hovered mesh
				 *
				 * @event Selection#hover
				 * @type {object}
				 * @property mesh - Hovered mesh
				 */
				object.emit('hover', {
					mesh: object
				});
				this.isHovering = true;
			}

			if (!intersection && isHovering) {
				if (object === this.hoveredMesh) {
					delete this.hoveredMesh;
				}
				delete this.hovering[id];
				this.reticle.children[0].material.color.setHex(0xFFFFFF);
				/**
				 * Selection unhover event that's emitted with
				 * the unhovered mesh
				 *
				 * @event Selection#unhover
				 * @type {object}
				 * @property mesh - Unhovered mesh
				 */
				object.emit('unhover', {
					mesh: object
				});
				this.isHovering = false;
			}

			if (intersection) {
				if (intersectionDistance === 0 || intersection.distance < intersectionDistance) {
					intersectionDistance = intersection.distance;
					this.hoveredMesh = object;
				}
			}
		}

		if (intersectionDistance > 0) {
			this._moveReticle(intersectionDistance);
		} else {
			this._moveReticle(null);
		}
	}

	/**
	 * If reticle is hovering over a selectable item, select it
	 *
	 * @example
	 * selection.handleSelection();
	 *
	 * @returns {undefined}
	 */
	handleSelection() {
		console.log(this.isHovering)
		if (this.isHovering) {
			this.select();
		}
	}

	/**
	 * Creates a spherical reticle
	 *
	 * @returns {THREE.Group} reticle
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
	 * @param {number} intersectionDistance - The intersection distance
	 *
	 * @returns {undefined}
	 * @private
     */
	_moveReticle(intersectionDistance) {
		if (intersectionDistance) {
			this.reticleDistance = intersectionDistance;
		} else {
			this.reticleDistance = RETICLE_DISTANCE;
		}

		this._updateReticle();
	}

	/**
	 * Updates the reticle's position
	 *
	 * @returns {undefined}
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
