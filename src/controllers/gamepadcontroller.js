import * as THREE from 'three';
import EventEmitter from 'eventemitter3';

import {Utils} from '../utils/utils';
import {Controllers} from './controllers';

const ControllerButtons = {
	'Trigger': 0
};

/** Class wrapped for gamepad-like controllers that don't have a pose */
class GamepadController {

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
		// Initializes EventEmitter
		Object.setPrototypeOf(this.__proto__, new EventEmitter());

		this.id = `${gamepad.id} (${gamepad.hand})`;
	}

	/**
	 * Activates teleportation if trigger is pressed
	 *
	 * @param {boolean} state - Whether trigger is pressed
	 *
	 * @returns {undefined}
	 */
	handleTriggerPressed(state) {
		if (state) {
			this.emit('trigger');
		}
	}

	/**
	 * Gets latest information from gamepad
	 * It also applies the handlers for different buttons
	 *
	 * @returns {undefined}
	 */
	update() {
		const gamepad = Controllers.getGamepad(this.id);

		if (!gamepad) {
			// Temporary fix because gamepaddisconnected is not firing when leaving VR in Daydream
			this.emit('controllerdisconnected', {id: this.id});
			return;
		}

		for (const buttonName of Object.keys(ControllerButtons)) {
			const buttonId = ControllerButtons[buttonName];
			const button = gamepad.buttons[buttonId];
			if (button) {
				// As all functions follow the same naming pattern, we can avoid a switch clause
				if (button.pressed && !this.pressedButtons[buttonId]) {
					this[`handle${buttonName}Pressed`](button.pressed);
				}

				this.pressedButtons[buttonId] = button.pressed;
			}
		}
	}
}

export {GamepadController};
