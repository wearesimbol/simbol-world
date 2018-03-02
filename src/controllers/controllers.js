import EventEmitter from 'eventemitter3';
import {PoseController} from './posecontroller';
import {GamepadController} from './gamepadcontroller';
import {KeyboardController} from './keyboardcontroller';
import {PointerController} from './pointercontroller';

/** Class to act as a wrapper for all controllers */
class Controllers {

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

	/** Initialises a Controllers instance */
	constructor(canvas) {
		// Initializes EventEmitter
		Object.setPrototypeOf(this.__proto__, new EventEmitter());
	
		window.addEventListener('gamepadconnected', this._handleGamepadConnected.bind(this));
		window.addEventListener('gamepaddisconnected', this._handleGamepadDisconnected.bind(this));

		// TODO: Check if it's a mobile device or standalone
		this.currentControllers['KeyboardController'] = new KeyboardController();
		this.currentControllers['PointerController'] = new PointerController(canvas);
		this._setUpEventListeners(this.currentControllers['KeyboardController']);
		this._setUpEventListeners(this.currentControllers['PointerController']);
		this.updateControllers();
	}

	/**
	 * Helper that forwards events from controllers
	 *
	 * @param {EventEmitter} emitter - Controller that can emit events
	 *
	 * @returns {undefined}
	 */
	_setUpEventListeners(emitter) {
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

			emitter.on('trigger', (event) => {
				this.emit('trigger', event);
			});
		}

		if (Object.getPrototypeOf(emitter) === GamepadController.prototype) {
			emitter.on('controllerdisconnected', (event) => {
				this.removeController(event);
			});

			emitter.on('trigger', (event) => {
				this.emit('trigger', event);
			});
		}

		if (Object.getPrototypeOf(emitter) === PoseController.prototype) {
			emitter.on('controllerdisconnected', (event) => {
				this.removeController(event);
			});

			emitter.on('trigger', (event) => {
				this.emit('trigger', event);
			});

			emitter.on('add', (event) => {
				this.emit('add', event);
			});

			emitter.on('thumpadpressed', (event) => {
				this.emit('thumpadpressed', event);
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
		emitter.removeAllListeners('ztranslationstart')
			.removeAllListeners('xtranslationstart')
			.removeAllListeners('ztranslationend')
			.removeAllListeners('xtranslationend')
			.removeAllListeners('orientation')
			.removeAllListeners('controllerdisconnected')
			.removeAllListeners('add')
			.removeAllListeners('trigger')
			.removeAllListeners('thumbpadpressed');
	}

	/**
	 * Event handler for 'gamepadconnected' indicating the controllers that a controller has been added
	 *
	 * @param {Event} event - Event object with the gamepad information
	 *
	 * @returns {undefined}
	 *
	 * @private
	 */
	_handleGamepadConnected(event) {
		this.updateControllers(event, true);
	}

	/**
	 * Event handler for 'gamepaddisconnected' indicating the controllers that a controller has been removed
	 *
	 * @param {Event} event - Event object with the gamepad information
	 *
	 * @returns {undefined}
	 *
	 * @private
	 */
	_handleGamepadDisconnected(event) {
		this.updateControllers(event, false);
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

		const gamepadId = Controllers.getGamepadId(gamepad);
		if (!this.currentControllers[gamepadId]) {
			if (gamepad.pose) {
				const poseController = new PoseController(gamepad);
				this.currentControllers[gamepadId] = poseController;
				this.mainHandController = poseController;
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
		if (this.currentControllers[gamepadId]) {
			if (this.currentControllers[gamepadId].model) {
				this.currentControllers[gamepadId].model.visible = false;
			}

			delete this.currentControllers[gamepadId];
		}
	}

	/**
	 * Updates controller list
	 *
	 * @param {Event} event - Gamepad connection event object
	 * @param {boolean} connected - Whether a given gamepad is being connected or not
	 *
	 * @returns {undefined}
	 */
	updateControllers(event, connected) {
		if (event) {
			if (connected) {
				this.addController(event.gamepad);
			} else {
				this.removeController(event.gamepad);
			}
		} else {
			const gamepads = navigator.getGamepads();
			for (const gamepad of gamepads) {
				this.addController(gamepad);
			}
		}
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
