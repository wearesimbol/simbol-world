import * as THREE from 'three';
import {VirtualPersona} from '../virtualpersona/virtualpersona';
import {Teleportation} from './_teleportation';
import {Controllers} from '../controllers/controllers';

/** Class for all general locomotion purposes */
class Locomotion {

	/** @property {number} velocity - translation velocity in m/s */
	get velocity() {
		if (!this._velocity) {
			this._velocity = 1.5;
		}
		return this._velocity;
	}

	set velocity(velocity) {
		this._velocity = velocity;
	}

	/** @property {number} angularVelocity - angular velocity */
	get angularVelocity() {
		if (!this._angularVelocity) {
			this._angularVelocity = 1;
		}
		return this._angularVelocity;
	}

	set angularVelocity(angularVelocity) {
		this._angularVelocity = angularVelocity;
	}

	/**
	 * @property {object} orientation - contains quaternion and euler angles
	 * @property {THREE.Quaternion} orientation.quaternion - Quaternion representing the orientation set by phi and theta
	 * @property {THREE.Euler} orientation.euler - Euler angles representing the orientation set by phi and theta
	 */
	get orientation() {
		if (!this._orientation) {
			this._orientation = {
				quaternion: new THREE.Quaternion(),
				euler: new THREE.Euler()
			};
		}
		return this._orientation;
	}

	set orientation(orientation) {
		this._orientation = orientation;
	}

	/** @property {THREE.Vector2} currentRotation - current rotation vector */
	get currentRotation() {
		if (!this._currentRotation) {
			this._currentRotation = new THREE.Vector2();
		}
		return this._currentRotation;
	}

	set currentRotation(currentRotation) {
		this._currentRotation = currentRotation;
	}

	/** @property {boolean|number} translatingZ - is there translation in the Z axis and by how much */
	get translatingZ() {
		if (typeof this._translatingZ === 'undefined') {
			this._translatingZ = false;
		}
		return this._translatingZ;
	}

	set translatingZ(translatingZ) {
		this._translatingZ = translatingZ;
	}

	/** @property {boolean|number} translatingX - is there translation in the X axis and by how much */
	get translatingX() {
		if (typeof this._translatingX === 'undefined') {
			this._translatingX = false;
		}
		return this._translatingX;
	}

	set translatingX(translatingX) {
		this._translatingX = translatingX;
	}

	/**
	 * Initialises a Locomotion instance for a VirtualPersona
	 *
	 * @param {VirtualPersona} virtualPersona - The VirtualPersona this will add movement controls to
	 */
	constructor(virtualPersona) {
		if (!virtualPersona || !VirtualPersona.prototype.isPrototypeOf(virtualPersona)) {
			throw 'A VirtualPersona is required';
		}

		this._theta = 0;
		this._phi = 0;

		this._canvas = virtualPersona.scene.canvas;
		this._moveHandler = this._moveHandler.bind(this);
		this.scene = virtualPersona.scene;
		this.virtualPersona = virtualPersona;

		this.initKeyboardInput();
		this.initMouseInput();
		this.initTouchInput();
		this.initGamepadInputs();

		this.teleportation = new Teleportation(this.scene);
	}

	/**
	 * Starts translating across the Z axis at the stated velocity
	 *
	 * @param {number} velocity - Value to translate by
	 *
	 * @returns {undefined}
	 */
	translateZ(velocity) {
		this.translatingZ = velocity;
	}

	/**
	 * Starts translating across the X axis at the stated velocity
	 *
	 * @param {number} velocity - Value to translate by
	 *
	 * @returns {undefined}
	 */
	translateX(velocity) {
		this.translatingX = velocity;
	}

	/**
	 * Stops translating across the Z axis
	 *
	 * @returns {undefined}
	 */
	stopTranslateZ() {
		this.translatingZ = false;
	}

	/**
	 * Stops translating across the X axis
	 *
	 * @returns {undefined}
	 */
	stopTranslateX() {
		this.translatingX = false;
	}

	/**
	 * Helper function that moves the first person camera along to a position in the scene
	 *
	 * @param {array} position - Vector array containing the new position for the camera
	 *
	 * @return {undefined}
	*/
	translateTo(position) {
		this.scene.camera.position.set(...position);
	}

	/**
	 * Handles direction keys to move the VirtualPersona
	 *
	 * @param {Event} event - Event object
	 *
	 * @return {undefined}
	 *
	 * @private
	 */
	_handleKeyDownEvent(event) {
		switch (event.keyCode) {
		// Up or w
		case 87:
		case 38:
			this.translateZ(-this.velocity);
			break;
		// Down or s
		case 83:
		case 40:
			this.translateZ(this.velocity);
			break;
		// Left or a
		case 65:
		case 37:
			this.translateX(-this.velocity);
			break;
		// Right or d
		case 68:
		case 39:
			this.translateX(this.velocity);
			break;
		}
	}

	/**
	 * Handles direction keys to move the VirtualPersona
	 *
	 * @param {Event} event - Event object
	 *
	 * @return {undefined}
	 *
	 * @private
	 */
	_handleKeyUpEvent(event) {
		switch (event.keyCode) {
		// Up or w, down or s
		case 87:
		case 38:
		case 83:
		case 40:
			this.stopTranslateZ();
			break;
		// Left or a, right or d
		case 65:
		case 37:
		case 68:
		case 39:
			this.stopTranslateX();
			break;
		}
	}

	/**
	 * Listens to keyboard presses and translates VirtualPersona accordingly
	 *
	 * @return {undefined}
	*/
	initKeyboardInput() {
		document.addEventListener('keydown', this._handleKeyDownEvent.bind(this));
		document.addEventListener('keyup', this._handleKeyUpEvent.bind(this));
	}

	/**
	 * Handler to rotate VirtualPersona on mousemove and touchmove
	 *
	 * @param {Event} event - Event object
	 *
	 * @return {undefined}
	 *
	 * @private
	*/
	_moveHandler(event) {
		// Gets the new rotation vector
		const rotation = new THREE.Vector2();
		if (event.touches) {
			if (event.touches.length > 1) {
				return;
			}

			rotation.set(event.touches[0].pageX, event.touches[0].pageY);
		} else {
			rotation.set(this.currentRotation.x - event.movementX,
				this.currentRotation.y - event.movementY);
		}

		// Calculates the delta between the current move event and the previous one
		const rotationDelta = new THREE.Vector2();
		rotationDelta.subVectors(rotation, this.currentRotation);

		// Saves current rotation for next move event
		this.currentRotation.copy(rotation);

		// Calculates cumulative euler angles
		const phi = this._phi + 2 * Math.PI * rotationDelta.y / screen.height * this.angularVelocity;
		this._phi = Math.max(-Math.PI/2, Math.min(phi, Math.PI/2));
		this._theta += 2 * Math.PI * rotationDelta.x / screen.width * this.angularVelocity;

		this.orientation.euler.set(this._phi, this._theta, 0, 'YXZ');
		this.orientation.quaternion.setFromEuler(this.orientation.euler);

		if (this.teleportation.hitPoint) {
			// Debounced function
			this.teleportation.activateTeleport();
		}
	}

	/**
	 * Handles pointer lock changes to enable/disable mousemouve event handlers
	 *
	 * @param {CanvasHTMLElement} canvas - Canvas that locks the pointer
	 *
	 * @return {undefined}
	 *
	 * @private
	*/
	_handlePointerLockChange() {
		if (document.pointerLockElement === this._canvas) {
			document.addEventListener('mousemove', this._moveHandler);
		} else {
			this.teleportation.resetTeleport();
			document.removeEventListener('mousemove', this._moveHandler);
		}
	}

	/**
	 * Locks the pointer if not displaying to an HMD when canvas is clicked
	 *
	 * @param {Event} event - Event supplied
	 *
	 * @return {undefined}
	 *
	 * @private
	*/
	_pointerLock(event) {
		this.currentRotation.set(event.clientX, event.clientY);
		this._canvas.requestPointerLock();
	}

	/**
	 * Handles teleportation
	 *
	 * @return {undefined}
	 *
	 * @private
	 */
	_handleTeleportation() {
		this.teleportation.setRayCurveState(true);
	}

	/**
	 * Handles click events. Either locks the pointer, or if it's already locked, shows the teleportation ray curve
	 *
	 * @param {Event} event - Event supplied
	 *
	 * @return {undefined}
	 *
	 * @private
	 */
	_handleClick(event) {
		if (!document.pointerLockElement) {
			this._pointerLock(event);
		} else {
			if (this.virtualPersona.interactions.selection.isHovering) {
				this.virtualPersona.interactions.selection.select();
				return;
			}

			if (this.teleportation.isRayCurveActive) {
				this.teleportation.resetTeleport();
			} else {
				this._handleTeleportation();
			}
		}
	}

	/**
	 * Listens to mouse click to lock the cursor to rotate the VirtualPersona
	 *
	 * @return {undefined}
	 *
	*/
	initMouseInput() {
		document.addEventListener('pointerlockchange', this._handlePointerLockChange.bind(this));
		this._canvas.addEventListener('click', this._handleClick.bind(this));
	}

	/**
	 * Handles touch inputs to listen to doueble taps
	 *
	 * @param {Event} event - Event object
	 *
	 *	@return {undefined}
	 *
	 * @private
	 */
	_handleTouchStart(event) {
		if (event.touches.length > 1) {
			return;
		}

		if (this.virtualPersona.interactions.selection.isHovering) {
			this.virtualPersona.interactions.selection.select();
			return;
		}

		this.currentRotation.set(event.touches[0].pageX, event.touches[0].pageY);

		const timeDelta = Math.abs(event.timeStamp - this._lastTouch);
		if (timeDelta < 250 || this.scene.vrEffect.isPresenting) {
			this.translateZ(-this.velocity);
		} else {
			this._lastTouch = event.timeStamp;
		}

	}

	/**
	 * Listens to touch events to rotate and translate the VirtualPersona
	 *
	 * @return {undefined}
	*/
	initTouchInput() {
		this._canvas.addEventListener('touchstart', this._handleTouchStart.bind(this));
		this._canvas.addEventListener('touchend', this.stopTranslateZ.bind(this));
		this._canvas.addEventListener('touchmove', this._moveHandler);
	}

	/**
	 * Event handler for 'gamepadconnected' indicating the controllers that a controller has been added
	 *
	 * @param {Event} event - Event object with the gamepad information
	 *
	 * @returns {undefined}
	 */
	_handleGamepadConnected(event) {
		this.controllers.updateControllers(event, true);
	}

	/**
	 * Event handler for 'gamepaddisconnected' indicating the controllers that a controller has been removed
	 *
	 * @param {Event} event - Event object with the gamepad information
	 *
	 * @returns {undefined}
	 */
	_handleGamepadDisconnected(event) {
		this.controllers.updateControllers(event, false);
	}

	/**
	 * Looks for gamepads and initialises them
	 *
	 * @return {undefined}
	 */
	initGamepadInputs() {
		this.controllers = new Controllers(this);
		window.addEventListener('gamepadconnected', this._handleGamepadConnected.bind(this));
		window.addEventListener('gamepaddisconnected', this._handleGamepadDisconnected.bind(this));
	}
}

export {Locomotion};
