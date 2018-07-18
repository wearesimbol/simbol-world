import EventEmitter from 'eventemitter3';
import {PoseController} from './posecontroller';
import {GamepadController} from './gamepadcontroller';
import {KeyboardController} from './keyboardcontroller';
import {PointerController} from './pointercontroller';

/** Class to act as a wrapper for all controllers */
class Controllers extends EventEmitter {

	/** @property {object} currentControllers - maps of controller ids to controller instances */
	get currentControllers() {
		if (!this._currentControllers) {
			this._currentControllers = {};
		}
		return this._currentControllers;
	}

	set currentControllers(currentControllers) {
		this._currentControllers = currentControllers;
	}

	/** @property {PoseController} mainHandController - Controller associated to your main hand */
	get mainHandController() {
		if (typeof this._mainHandController === 'undefined') {
			this._mainHandController = null;
		}
		return this._mainHandController;
	}

	set mainHandController(mainHandController) {
		this._mainHandController = mainHandController;
	}

	/**
	 * Initialises a Controllers instance
	 *
	 * @param {HTMLCanvasElement} canvas - <canvas> element required by PointerController
	 * @param {string} hand - The user's preferred hand
	 */
	constructor(canvas, hand) {
		super();

		this.hand = hand;

		// TODO: Check if it's a mobile device or standalone
		this.currentControllers['KeyboardController'] = new KeyboardController();
		this.currentControllers['PointerController'] = new PointerController(canvas);
		this._setUpEventListeners(this.currentControllers['KeyboardController']);
		this._setUpEventListeners(this.currentControllers['PointerController']);
	}

	/**
	 * Helper that forwards events from controllers
	 *
	 * @param {EventEmitter} emitter - Controller that can emit events
	 *
	 * @returns {undefined}
	 *
	 * @emits Controllers#error
	 * @emits Controllers#ztranslationstart
	 * @emits Controllers#ztranslationend
	 * @emits Controllers#xtranslationstart
	 * @emits Controllers#xtranslationend
	 * @emits Controllers#orientation
	 * @emits Controllers#currentorientation
	 * @emits Controllers#triggerpressed
	 * @emits Controllers#thumbpadpressed
	 * @emits Controllers#thumbpadtouched
	 * @emits Controllers#thumbpaduntouched
	 * @emits Controllers#gesturechange
	 *
	 * @private
	 */
	_setUpEventListeners(emitter) {
		emitter.on('error', (event) => {
			/**
			 * Controllers error event that forwards the event
			 * from any kind of controllers
			 *
			 * @event Controllers#error
			 * @type {Error}
			 */
			this.emit('error', event);
		});

		if (Object.getPrototypeOf(emitter) === KeyboardController.prototype) {
			emitter.on('ztranslationstart', (event) => {
				/**
				 * Controllers ztranslationstart event that forwards the event
				 * from a controller
				 *
				 * @event Controllers#ztranslationstart
				 * @type {object}
				 */
				this.emit('ztranslationstart', event);
			});

			emitter.on('xtranslationstart', (event) => {
				/**
				 * Controllers xtranslationstart event that forwards the event
				 * from a controller
				 *
				 * @event Controllers#xtranslationstart
				 * @type {object}
				 */
				this.emit('xtranslationstart', event);
			});

			emitter.on('ztranslationend', (event) => {
				/**
				 * Controllers ztranslationend event that forwards the event
				 * from a controller
				 *
				 * @event Controllers#ztranslationend
				 * @type {object}
				 */
				this.emit('ztranslationend', event);
			});

			emitter.on('xtranslationend', (event) => {
				/**
				 * Controllers xtranslationend event that forwards the event
				 * from a controller
				 *
				 * @event Controllers#xtranslationend
				 * @type {object}
				 */
				this.emit('xtranslationend', event);
			});
		}

		if (Object.getPrototypeOf(emitter) === PointerController.prototype) {
			emitter.on('ztranslationstart', (event) => {
				this.emit('ztranslationstart', event);
			});

			emitter.on('ztranslationend', (event) => {
				this.emit('ztranslationend', event);
			});

			emitter.on('orientation', (event) => {
				/**
				 * Controllers orientation event that forwards the event
				 * from a PointerController
				 *
				 * @event Controllers#orientation
				 * @type {object}
				 */
				this.emit('orientation', event);
			});

			emitter.on('currentorientation', (event) => {
				/**
				 * Controllers currentorientation event that forwards the event
				 * from a PointerController
				 *
				 * @event Controllers#currentorientation
				 * @type {object}
				 */
				this.emit('currentorientation', event);
			});

			emitter.on('triggerpressed', (event) => {
				/**
				 * Controllers triggerpressed event that forwards the event
				 * from a controller
				 *
				 * @event Controllers#triggerpressed
				 * @type {object}
				 */
				this.emit('triggerpressed', event);
			});
		}

		if (Object.getPrototypeOf(emitter) === GamepadController.prototype) {
			emitter.on('controllerdisconnected', (event) => {
				this.removeController(event);
			});

			emitter.on('triggerpressed', (event) => {
				this.emit('triggerpressed', event);
			});
		}

		if (Object.getPrototypeOf(emitter) === PoseController.prototype) {
			emitter.on('controllerdisconnected', (event) => {
				this.removeController(event);
			});

			emitter.on('triggerpressed', (event) => {
				this.emit('triggerpressed', event);
			});

			emitter.on('thumbpadpressed', (event) => {
				/**
				 * Controllers thumbpadpressed event that forwards the event
				 * from a controller
				 *
				 * @event Controllers#thumbpadpressed
				 * @type {object}
				 */
				this.emit('thumbpadpressed', event);
			});

			emitter.on('thumbpadtouched', (event) => {
				/**
				 * Controllers thumbpadtouched event that forwards the event
				 * from a controller
				 *
				 * @event Controllers#thumbpadtouched
				 * @type {object}
				 */
				this.emit('thumbpadtouched', event);
			});

			emitter.on('thumbpaduntouched', (event) => {
				/**
				 * Controllers thumbpaduntouched event that forwards the event
				 * from a controller
				 *
				 * @event Controllers#thumbpaduntouched
				 * @type {object}
				 */
				this.emit('thumbpaduntouched', event);
			});

			emitter.on('gesturechange', (event) => {
				/**
				 * Controllers gesturechange event that forwards the event
				 * from a controller
				 *
				 * @event Controllers#gesturechange
				 * @type {object}
				 */
				this.emit('gesturechange', event);
			});
		}
	}

	/**
	 * Helper function that removes all event handlers from an emitter
	 *
	 * @param {EventEmitter} emitter - Controller that has event handlers set up
	 *
	 * @returns {undefined}
	 * @private
	 */
	_removeEventListeners(emitter) {
		emitter.removeAllListeners('error')
			.removeAllListeners('ztranslationstart')
			.removeAllListeners('xtranslationstart')
			.removeAllListeners('ztranslationend')
			.removeAllListeners('xtranslationend')
			.removeAllListeners('orientation')
			.removeAllListeners('currentorientation')
			.removeAllListeners('controllerdisconnected')
			.removeAllListeners('add')
			.removeAllListeners('triggerpressed')
			.removeAllListeners('thumbpadpressed')
			.removeAllListeners('thumbpadtouched')
			.removeAllListeners('thumbpaduntouched')
			.removeAllListeners('gesturechange');
	}

	/**
	 * Initialises the Controllers instance by adding gamepad event listeners
	 * and searching for current gamepads
	 *
	 * @param {THREE.Mesh} vpMesh - The Virtual Persona mesh
	 *
	 * @example
	 * controllers.init(virtualPersonaMesh);
	 *
	 * @returns {undefined}
	 */
	init(vpMesh) {
		window.addEventListener('gamepadconnected', this.addController.bind(this));
		window.addEventListener('gamepaddisconnected', this.removeController.bind(this));

		this.updateControllers(vpMesh);
	}

	/**
	 * Updates controller list by checking for available gamepads
	 * If a vpMesh is supplied, it also sets all current controllers' vpMesh to it
	 *
	 * @param {THREE.Mesh} vpMesh - Current Virtual Persona mesh. Used to associate hands to controllers
	 *
	 * @example
	 * // Update current controllers to a new virtualPersonaMesh and get new gamepads
	 * controllers.updateControllers(virtualPersonaMesh);
	 * @example
	 * // Only gets new gamepads
	 * controllers.updateControllers();
	 *
	 * @returns {undefined}
	 */
	updateControllers(vpMesh) {
		if (vpMesh) {
			this.vpMesh = vpMesh;

			for (const controller of Object.values(this.currentControllers)) {
				if (controller instanceof PoseController) {
					controller.vpMesh = vpMesh;
				}
			}
		}

		const gamepads = navigator.getGamepads();
		for (const gamepad of gamepads) {
			this.addController(gamepad);
		}
	}

	/**
	 * Adds a controller to the currentControlles list
	 *
	 * @param {Gamepad} gamepad - Controller to add
	 *
	 * @example
	 * // gamepad comes from the 'gamepadconnected' event or from 'navigator.getGamepads()'
	 * controllers.addController(gamepad);
	 *
	 * @returns {undefined}
	 */
	addController(gamepad) {
		if (!gamepad) {
			return;
		}

		gamepad = gamepad.gamepad || gamepad;

		const gamepadId = Controllers.getGamepadId(gamepad);
		if (!this.currentControllers[gamepadId]) {
			if (gamepad.pose) {
				const poseController = new PoseController(gamepad, this.vpMesh, this.hand);
				this.currentControllers[gamepadId] = poseController;
				if (gamepad.hand === this.hand) {
					this.mainHandController = poseController;
				}
			} else {
				const gamepadController = new GamepadController(gamepad);
				this.currentControllers[gamepadId] = gamepadController;
			}
			this._setUpEventListeners(this.currentControllers[gamepadId]);
		}
	}

	/**
	 * Removes a controller from the list
	 *
	 * @param {Gamepad} gamepad - Controller to remove
	 *
	 * @example
	 * // gamepad comes from the 'gamepaddisconnected' event
	 * controllers.removeController(gamepad);
	 *
	 * @returns {undefined}
	 */
	removeController(gamepad) {
		const gamepadId = Controllers.getGamepadId(gamepad);
		if (this.mainHandController && this.mainHandController.id === gamepad.id) {
			this.mainHandController = null;
		}

		delete this.currentControllers[gamepadId];
	}

	/**
	 * Gets unique GamePad id
	 *
	 * @param {Gamepad} gamepad - Gamepad to generate id from
	 *
	 * @example
	 * // gamepad comes from 'navigator.getGamepads();
	 * Controllers.getGamepadId(gamepad);
	 *
	 * @returns {string} id
	 *
	 * @static
	 */
	static getGamepadId(gamepad) {
		const id = `${gamepad.id} (${gamepad.hand})`;
		return id;
	}

	/**
	 * Gets GamePad in its latest state using the id Simbol uses
	 *
	 * @param {string} id - The gamepad's id that you want to receive
	 *
	 * @example
	 * Controllers.getGamepad('GamepadID (left)');
	 *
	 * @returns {Gamepad} gamepad
	 *
	 * @static
	 */
	static getGamepad(id) {
		const gamepads = navigator.getGamepads();

		for (const gamepad of gamepads) {
			if (gamepad && Controllers.getGamepadId(gamepad) === id) {
				return gamepad;
			}
		}
	}
}

export {Controllers};
