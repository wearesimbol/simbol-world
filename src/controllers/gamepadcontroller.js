import EventEmitter from 'eventemitter3';

import {Controllers} from './controllers';

const ControllerButtons = {
	'Trigger': 0
};

/** Class wrapped for gamepad-like controllers that don't have a pose */
class GamepadController extends EventEmitter {

	/** @property {Object} pressedButtons - Objects that maps buttons to their states */
	get pressedButtons() {
		if (!this._pressedButtons) {
			this._pressedButtons = {};
		}
		return this._pressedButtons;
	}

	/**
	 * Initialises a GamepadController
	 *
	 * @param {Gamepad} gamepad - Gamepad object associated to this controller
	 */
	constructor(gamepad) {
		super();

		this.id = `${gamepad.id} (${gamepad.hand})`;
	}

	/**
	 * Gets latest information from gamepad
	 * It also applies the handlers for different buttons
	 *
	 * @example
	 * // This is executed in an animation loop
	 * gamepadController.update();
	 *
	 * @returns {undefined}
	 *
	 * @emits GamepadController#controllerdisconnected
	 * @emits GamepadController#triggerpressed
	 * @emits GamepadController#triggerunpressed
	 */
	update() {
		const gamepad = Controllers.getGamepad(this.id);

		if (!gamepad) {
			/**
			 * Temporary fix because gamepaddisconnected is not firing when leaving VR in Daydream
			 * GamepadController controllerdisconnected event for when a gamepad is no longer available
			 *
			 * @event GamepadController#controllerdisconnected
			 * @type {object}
			 * @property id - The controller's id
			 */
			this.emit('controllerdisconnected', {id: this.id});
			return;
		}

		for (const buttonName of Object.keys(ControllerButtons)) {
			const buttonId = ControllerButtons[buttonName];
			const button = gamepad.buttons[buttonId];
			if (button) {
				if (button.pressed && !this.pressedButtons[buttonName]) {
					/**
					 * GamepadController triggerpressed event, fired when the trigger is pressed
					 *
					 * @event GamepadController#triggerpressed
					 */
					this.emit(`${buttonName.toLowerCase()}pressed`);
					this.pressedButtons[buttonName] = true;
				} else if (!button.pressed && this.pressedButtons[buttonName]) {
					/**
					 * GamepadController triggerunpressed event, fired when the trigger is unpressed
					 *
					 * @event GamepadController#triggerunpressed
					 */
					this.emit(`${buttonName.toLowerCase()}unpressed`);
					this.pressedButtons[buttonName] = false;
				}
			}
		}
	}
}

export {GamepadController};
