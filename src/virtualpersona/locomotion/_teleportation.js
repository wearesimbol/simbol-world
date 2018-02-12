import * as THREE from 'three';
import {Physics} from '../../physics/physics';
import {Utils} from '../../utils/utils';

/**
 * Teleportation
 * @namespace
 */
const Teleportation = {

	/** @property {number} rayCurvePoints - Number of points on the Ray Curve Mesh */
	rayCurvePoints: 30,

	/** @property {number} rayWidth - The Ray Curve's width (m) */
	rayCurveWidth: 0.025,

	/** @property {number} hitCylinderRadius - The HitCylinder's radius (m) */
	hitCylinderRadius: 0.25,

	/** @property {number} hitCylinderHeight - The HitCylinder's height (m) */
	hitCylinderHeight: 0.3,

	/** @property {number} maxAngle - Maximum angle a mesh can be in so you can teleport to it */
	maxAngle: 45,

	/** @property {THREE.Color} hitColor - Color applied to the Ray Curve and the Hit Cylinder when there's a valid intersection */
	hitColor: new THREE.Color('#99ff99'),

	/** @property {THREE.Color} missColor - Color applied to the Ray Curve and the Hit Cylinder */
	missColor: new THREE.Color('#ff0000'),

	/** @property {number} velocity - The ray's speed */
	velocity: 5,

	/** @property {number} _acceleration - Gravity */
	acceleration: -9.8,

	/**
	 * @property {THREE.Vector3} _direction - The ray's direction
	 *
	 * @private
	 */
	_direction: new THREE.Vector3(),

	/**
	 * @property {THREE.Vector3} _shootAxis - Axis where the ray will be shooted at
	 *
	 * @private
	 */
	_shootAxis: new THREE.Vector3(0, 0, -1),

	/**
	 * @property {THREE.Vector3} _referenceNormal - The normal vector used to compare with the ray curve's landing angle and represents the y axis
	 *
	 * @private
	 */
	_referenceNormal: new THREE.Vector3(0, 1, 0),

	/**
	 * @property {number} _teleportActivationTimeout - Time (s) that needs to pass for the teleportation to activate
	 *
	 * @private
	 */
	_teleportActivationTimeout: 0.5,

	/** @property {boolean} isRayCurveActive - Whether the ray is being displayed */
	isRayCurveActive: false,

	/**
	 * @property {boolean} isTeleportActive - Whether the ray has been held at a specific position
	 * for more than _teleportActivationTimeout
	 */
	isTeleportActive: false,

	/** @property {boolean|THREE.Vector3} _hitPoint - Point where there was the last successful hit  */
	hitPoint: false,

	/**
	 * Initialises teleportation component
	 *
	 * @param {Scene} scene - The scene to add teleporation controls to
	 *
	 * @return {undefined}
	 */
	init(scene) {
		this.scene = scene;
		this.rayCaster = new THREE.Raycaster();
		this.rayCurve = this.renderRayCurve();
		this.hitCylinder = this.renderHitCylinder();

		this.scene.addToScene([this.rayCurve, this.hitCylinder], false, false);

		this.activateTeleport = Utils.debounce(this.activateTeleport.bind(this), this._teleportActivationTimeout * 1000);
	},

	/**
	 * Sets whether the Ray Curve is active or not
	 *
	 * @param {boolean} active - Whethere it's active
	 *
	 * @return {undefined}
	 */
	setRayCurveState(active) {
		this.isRayCurveActive = active;
	},

	/**
	 * Activates teleportation
	 *
	 * @return {undefined}
	 */
	activateTeleport() {
		this.isTeleportActive = true;
	},

	/**
	 * Resets teleportation
	 *
	 * @return {undefined}
	 */
	resetTeleport() {
		this.setRayCurveState(false);
		this.isTeleportActive = false;
		clearTimeout(this.activateTeleport.id);
		this.hitPoint = false;
		this.rayCurve.visible = false;
		this.hitCylinder.visible = false;
	},

	/**
	 * Parabolic curve equation
	 *
	 * @param {number} point - Initial position
	 * @param {number} velocity - Initial velocity
	 * @param {number} acceleration - Acceleration, will normally be the value of gravity
	 * @param {number} time - Time value
	 *
	 * @return {number} Position on the curve at {time}
	 *
	 * @private
	 */
	_parabolicCurveScalar(point, velocity, acceleration, time) {
		return point + velocity * time + 0.5 * acceleration * time * time;
	},

	/**
	 * Calculates a parabolic curve for a 3D Vector3
	 *
	 * @param {number} point - Initial position
	 * @param {velocity} velocity - Initial velocity
	 * @param {number} time - Time value
	 *
	 * @return {THREE.Vector3} Vector3 with the parabolic curve position for each axis
	 *
	 * @private
	 */
	_parabolicCurve(point, velocity, time) {
		const returnedVector = new THREE.Vector3();
		returnedVector.x = this._parabolicCurveScalar(point.x, velocity.x, 0, time);
		returnedVector.y = this._parabolicCurveScalar(point.y, velocity.y, this.acceleration, time);
		returnedVector.z = this._parabolicCurveScalar(point.z, velocity.z, 0, time);
		return returnedVector;
	},

	/**
	 * Sets each point of the ray
	 *
	 * @param {number} pointInCurve - Point in the ray
	 * @param {THREE.Vector3} currentPoint - The current's point Vector3
	 *
	 * @return {undefined}
	 *
	 * @private
	 */
	_setRayCurvePoint(pointInCurve, currentPoint) {
		// As pointInCurve starts at 1, to set each vertex, it's more convenient for it to start at 0
		pointInCurve--;
		const posA = currentPoint.clone().add(this._direction);
		const posB = currentPoint.clone().sub(this._direction);

		let idx = 2 * 3 * pointInCurve;
		this.rayCurve.vertices[idx++] = posA.x;
		this.rayCurve.vertices[idx++] = posA.y;
		this.rayCurve.vertices[idx++] = posA.z;

		this.rayCurve.vertices[idx++] = posB.x;
		this.rayCurve.vertices[idx++] = posB.y;
		this.rayCurve.vertices[idx++] = posB.z;

		this.rayCurve.geometry.attributes.position.needsUpdate = true;
	},

	_isValidNormalsAngle(collision) {
		const collisionNormalMatrix = new THREE.Matrix3().getNormalMatrix(collision.object.matrixWorld);
		const collisionNormal = collision.face.normal.clone().applyMatrix3(collisionNormalMatrix);
		const angleNormal = this._referenceNormal.angleTo(collisionNormal);
		return THREE.Math.RAD2DEG * angleNormal <= this.maxAngle;
	},

	/**
	 * Sets direction
	 *
	 * @param {THREE.Vector3} direction - Provided direction
	 *
	 * @return {undefined}
	 */
	_setDirection(direction) {
		this._direction
			.copy(direction)
			.cross(this._referenceNormal)
			.normalize()
			.multiplyScalar(this.rayCurveWidth / 2);
	},

	/**
	 * Renders the ray
	 *
	 * @return {THREE.Object3D} The ray's mesh
	 */
	renderRayCurve() {
		const geometry = new THREE.BufferGeometry();
		const vertices = new Float32Array(this.rayCurvePoints * 2 * 3);

		geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3).setDynamic(true));
		const material = new THREE.MeshBasicMaterial({
			side: THREE.DoubleSide,
			color: 0xff0000
		});
		const mesh = new THREE.Mesh(geometry, material);
		mesh.drawMode = THREE.TriangleStripDrawMode;
		mesh.frustumCulled = false;
		mesh.vertices = vertices;
		mesh.visible = false;

		return mesh;
	},

	/**
	 * Renders the hit cylinder
	 *
	 * @return {THREE.Object3D} The hit cylinder
	 */
	renderHitCylinder() {
		const hitCylinder = new THREE.Group();
		const geometry = new THREE.CylinderGeometry(this.hitCylinderRadius, this.hitCylinderRadius, this.hitCylinderHeight, 8, 1, true);
		const material = new THREE.MeshBasicMaterial({
			side: THREE.DoubleSide,
			color: this.hitColor
		});
		const mesh = new THREE.Mesh(geometry, material);
		mesh.position.set(0, this.hitCylinderHeight / 2, 0);
		hitCylinder.add(mesh);
		hitCylinder.visible = false;

		return hitCylinder;
	},

	/**
	 * Updates the ray, when active, depending on the world position
	 *
	 * @param {PoseController|GamepadController|THREE.Object3D} controller - Controller that will dispatch the ray curve
	 *
	 * @return {undefined}
	 */
	updateRayCurve(controller) {
		if (!controller || !(controller instanceof THREE.Object3D) && !(controller.model instanceof THREE.Object3D)) {
			this.setRayCurveState(false);
			return;
		}

		/**
		 * Updated renders depend on movement/rotation and debounce activateTeleport there
		 * but on initial render we also need to debounce activateTeleport or it won't do anything
		 * as there is no movement necessarily on the first click
		 */
		const initialRender = !this.rayCurve.visible;
		this.hitCylinder.visible = false;
		this.hitPoint = false;
		this.rayCurve.visible = true;
		this.rayCurve.material.color.set(this.missColor);

		controller = controller.model || controller;
		const quaternion = controller.getWorldQuaternion();
		const direction = this._shootAxis.clone().applyQuaternion(quaternion).normalize();
		this._setDirection(direction);
		const position = controller.position.clone();
		const velocity = direction.clone().multiplyScalar(this.velocity);

		const lastSegment = position.clone();
		const nextSegment = new THREE.Vector3();
		const collisionMesh = this.scene.scene.getObjectByName('HolonetMainScene');
		for (let i = 1; i <= this.rayCurvePoints; i++) {
			const time = i / this.rayCurvePoints;
			nextSegment.copy(this._parabolicCurve(position, velocity, time));

			const directionLastNextSegments = nextSegment.clone().sub(lastSegment).normalize();
			this.rayCaster.far = directionLastNextSegments.length();
			this.rayCaster.set(lastSegment, directionLastNextSegments);

			const intersection = Physics.checkRayCollision(this.rayCaster, collisionMesh);
			if (intersection) {
				const point = intersection.point;

				// If hit, just fill the rest of the points with the hit point and break the loop
				for (let j = i; j <= this.rayCurvePoints; j++) {
					this._setRayCurvePoint(j, point);
				}

				if (this._isValidNormalsAngle(intersection)) {
					this.rayCurve.material.color.set(this.hitColor);
					this.hitCylinder.position.copy(point);
					this.hitCylinder.visible = true;
					this.hitPoint = point;
					if (initialRender) {
						this.activateTeleport();
					}
				}

				break;
			} else {
				this._setRayCurvePoint(i, nextSegment);
				lastSegment.copy(nextSegment);
			}
		}

		if (!this.hitPoint) {
			clearTimeout(this.activateTeleport.id);
		}
	}
};

export {Teleportation};
