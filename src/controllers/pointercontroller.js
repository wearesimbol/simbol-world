import EventEmitter from 'eventemitter3';
import * as THREE from 'three';
import { Utils } from '../utils/utils';

class PointerController {

	/** @property {THREE.Vector2} rotation - rotation vector */
	get rotation() {
		if (!this._rotation) {
			this._rotation = new THREE.Vector2();
		}
		return this._rotation;
	}

	set rotation(rotation) {
		this._rotation = rotation;
	}

	/**
	 * Listens to touch events and mouse click and emits appropriate events
	 *
	 * @return {undefined}
	*/
	constructor(canvas) {
		// Initializes EventEmitter
		Object.setPrototypeOf(this.__proto__, new EventEmitter());
	
		this._canvas = canvas;

		document.addEventListener('pointerlockchange', this._handlePointerLockChange.bind(this));
		this._canvas.addEventListener('click', this._handleClick.bind(this));

		this._canvas.addEventListener('touchstart', this._handleTouchStart.bind(this));
		this._canvas.addEventListener('touchend', () => {
			this.emit('ztranslationend');
		});
		this._moveHandler = this._moveHandler.bind(this);
		this._canvas.addEventListener('touchmove', this._moveHandler);
	}

	/**
	 * Handles touch inputs to listen to doueble taps
	 *
	 * @param {Event} event - Event object
	 *
	 * @return {undefined}
	 *
	 * @private
	 */
	_handleTouchStart(event) {
		if (event.touches.length > 1) {
			return;
		}

		this.rotation.set(event.touches[0].pageX, event.touches[0].pageY);

		const timeDelta = Math.abs(event.timeStamp - this._lastTouch);
		if (timeDelta < 250 || Utils.isPresenting) {
			this.emit('ztranslationstart', {
				direction: -1
			});
		} else {
			this.emit('trigger', {
				touch: true
			});

			this._lastTouch = event.timeStamp;
		}

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
		if (event.touches) {
			if (event.touches.length > 1) {
				return;
			}

			this.rotation.set(event.touches[0].pageX, event.touches[0].pageY);
		} else {
			this.rotation.set(this.rotation.x - event.movementX,
				this.rotation.y - event.movementY);
		}

		this.emit('orientation', {
			rotation: this.rotation
		});
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
			this.emit('trigger');
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
			document.removeEventListener('mousemove', this._moveHandler);
		}
	}

	/**
	 * Locks the pointer if not displaying to an HMD when canvas is clicked
	 *
	 * @return {undefined}
	 *
	 * @private
	*/
	_pointerLock() {
		this._canvas.requestPointerLock();
	}
}

export {PointerController};
