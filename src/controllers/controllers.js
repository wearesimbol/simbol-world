import {PoseController} from './posecontroller';
import {GamepadController} from './gamepadcontroller';

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

	/**
	 * Initialises a Controllers instance
	 *
	 * @param {Locomotion} locomotion - Locomotion instance ccontrollers will be associated to
	 */
	constructor(locomotion) {
		this.locomotion = locomotion;
		this.updateControllers();
	}

	/**
	 * Gets unique GamePad id
	 *
	 * @param {Gamepad} gamepad - Gamepad to generate id from
	 *
	 * @returns {string} id
	 */
	getGamepadId(gamepad) {
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
	getGamepad(id) {
		const gamepads = navigator.getGamepads();

		for (const gamepad of gamepads) {
			if (gamepad && this.getGamepadId(gamepad) === id) {
				return gamepad;
			}
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

		const gamepadId = this.getGamepadId(gamepad);
		if (!this.currentControllers[gamepadId]) {
			if (gamepad.pose) {
				const poseController = new PoseController(gamepad, this.locomotion);
				this.currentControllers[gamepadId] = poseController;
				this.mainHandController = poseController;
			} else {
				const gamepadController = new GamepadController(gamepad, this.locomotion);
				this.currentControllers[gamepadId] = gamepadController;
			}
		}
	}

	/**
	 * Removes a controller from the list
	 *
	 * @param {Gamepad} gamepad - Controller to Adds
	 *
	 * @returns {undefined}
	 */
	removeController(gamepad) {
		const gamepadId = this.getGamepadId(gamepad);
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
}

export {Controllers};
