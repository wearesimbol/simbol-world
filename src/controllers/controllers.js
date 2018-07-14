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
	 *
	 * @returns {Controllers} this
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
	 */
	_setUpEventListeners(emitter) {
		emitter.on('error', (event) => {
			this.emit('error', event);
		});

		if (Object.getPrototypeOf(emitter) === KeyboardController.prototype) {
			emitter.on('ztranslationstart', (event) => {
				this.emit('ztranslationstart', event);
			});

			emitter.on('xtranslationstart', (event) => {
				this.emit('xtranslationstart', event);
			});

			emitter.on('ztranslationend', (event) => {
				this.emit('ztranslationend', event);
			});

			emitter.on('xtranslationend', (event) => {
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
				this.emit('orientation', event);
			});

			emitter.on('currentorientation', (event) => {
				this.emit('currentorientation', event);
			});

			emitter.on('triggerpressed', (event) => {
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
				this.emit('thumbpadpressed', event);
			});

			emitter.on('thumbpadtouched', (event) => {
				this.emit('thumbpadtouched', event);
			});

			emitter.on('thumbpaduntouched', (event) => {
				this.emit('thumbpaduntouched', event);
			});

			emitter.on('gesturechange', (event) => {
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
	 * Initialises the Controllers instance by adding event listener
	 * and searching for current gamepads
	 *
	 * @param {THREE.Mesh} mesh - The Virtual Persona mesh
	 *
	 * @returns {undefined}
	 */
	init(mesh) {
		window.addEventListener('gamepadconnected', this.addController.bind(this));
		window.addEventListener('gamepaddisconnected', this.removeController.bind(this));

		this.updateControllers(mesh);
	}

	/**
	 * Updates controller list
	 *
	 * @param {THREE.Mesh} mesh - Current Virtual Persona mesh. Used to associate hands to controllers
	 *
	 * @returns {undefined}
	 */
	updateControllers(mesh) {
		if (mesh) {
			this.mesh = mesh;

			for (const controller of Object.values(this.currentControllers)) {
				if (controller instanceof PoseController) {
					controller.vpMesh = mesh;
				}
			}
		}

		const gamepads = navigator.getGamepads();
		for (const gamepad of gamepads) {
			this.addController(gamepad);
		}
	}

	/**
	 * Adds a controller to the list
	 *
	 * @param {Gamepad} gamepad - Controller to add
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
				const poseController = new PoseController(gamepad, this.mesh, this.hand);
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
	 * @returns {string} id
	 */
	static getGamepadId(gamepad) {
		const id = `${gamepad.id} (${gamepad.hand})`;
		return id;
	}

	/**
	 * Gets GamePad in its latest state
	 *
	 * @param {string} id - The gamepad's id that you want to receive
	 *
	 * @returns {Gamepad} gamepad
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
