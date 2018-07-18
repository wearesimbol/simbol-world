import EventEmitter from 'eventemitter3';
import * as THREE from 'three';
import { Utils } from '../utils/utils';

class PointerController extends EventEmitter {

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
	 * @param {HTMLCanvasElement} canvas - Canvas that listens to different events
	 *
	 * @returns {undefined}
	 *
	 * @emits PointerController#ztranslationend
	*/
	constructor(canvas) {
		super();

		this._canvas = canvas;

		document.addEventListener('pointerlockchange', this._handlePointerLockChange.bind(this));
		this._canvas.addEventListener('click', this._handleClick.bind(this));

		this._canvas.addEventListener('touchstart', this._handleTouchStart.bind(this));
		this._canvas.addEventListener('touchend', () => {
			/**
			 * PointerController ztranslationend event,
			 * fired when translation on the z axis ends
			 *
			 * @event PointerController#ztranslationend
			 */
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
	 * @private
	 * @emits PointerController#currentorientation
	 * @emits PointerController#ztranslationstart
	 * @emits PointerController#triggerpressed
	 */
	_handleTouchStart(event) {
		if (event.touches.length > 1) {
			return;
		}

		/**
		 * PointerController currentorientation event,
		 * fired with the initial orientation when touch starts
		 *
		 * @event PointerController#currentorientation
		 * @type {object}
		 * @property rotation - 2 element array with the rotation for the X and Y axis
		 */
		this.emit('currentorientation', {
			rotation: [event.touches[0].pageX, event.touches[0].pageY]
		});

		const timeDelta = Math.abs(event.timeStamp - this._lastTouch);
		if (timeDelta < 250 || Utils.isPresenting) {
			/**
			* PointerController ztranslationstart event,
			* fired when translation on the z axis starts
			*
			* @event PointerController#ztranslationstart
			* @type {object}
			* @property direction - Positive or negative depending on the direction
			*/
			this.emit('ztranslationstart', {
				direction: -1
			});
		} else {
			/**
			* PointerController triggerpressed event,
			* fired when the canvas is touched
			*
			* @event PointerController#triggerpressed
			* @type {object}
			* @property touch - Whether the event comes from a touch action
			*/
			this.emit('triggerpressed', {
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
	 * @private
	 * @emits PointerController#orientation
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

		/**
		* PointerController orientation event,
		* fired with each touch or mouse movement
		*
		* @event PointerController#orientation
		* @type {object}
		* @property rotation - 2 element array with the rotation for the X and Y axis
		*/
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
	 * @private
	 * @emits PointerController#triggerpressed
	 */
	_handleClick(event) {
		if (!document.pointerLockElement) {
			this._pointerLock(event);
		} else {
			/**
			* PointerController triggerpressed event,
			* fired when the canvas is clicked
			*
			* @event PointerController#triggerpressed
			*/
			this.emit('triggerpressed');
		}
	}

	/**
	 * Handles pointer lock changes to enable/disable mousemouve event handlers
	 *
	 * @param {CanvasHTMLElement} canvas - Canvas that locks the pointer
	 *
	 * @return {undefined}
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
	 * @private
	*/
	_pointerLock() {
		this._canvas.requestPointerLock();
	}
}

export {PointerController};
