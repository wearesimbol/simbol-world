import * as THREE from 'three';
import {Utils} from '../../utils/utils';

const ControllerButtons = {
	'Trigger': 0
};

/**
 * GamepadController
 * @namespace
 */
const GamepadController = {

	/** @property {Object} pressedButtons - Objects that maps buttons to their states */
	pressedButtons: {},

	/**
	 * Initialises a GamepadController
	 *
	 * @param {Gamepad} gamepad - Gamepad object associated to this controller
	 * @param {Locomotion} locomotion - Locomotion instance this controller is associated to
	 *
	 * @return {undefined}
	 */
	init(gamepad, locomotion) {
		this.locomotion = locomotion;
		this.id = `${gamepad.id} (${gamepad.hand})`;
		this.cameraQuaternion = new THREE.Quaternion().fromArray(this.locomotion.scene.camera.quaternion);
	},

	/**
	 * Activates transportation if trigger is pressed
	 *
	 * @param {boolean} state - Whether trigger is pressed
	 *
	 * @return {undefined}
	 */
	handleTriggerPressed(state) {
		if (state) {
			if (this.locomotion.virtualPersona.interactions.selection.isHovering) {
				this.locomotion.virtualPersona.interactions.selection.select();
				return;
			}

			if (this.locomotion.teleportation.isRayCurveActive) {
				this.locomotion.teleportation.resetTeleport();
			} else {
				this.locomotion.teleportation.setRayCurveState(true);
			}
		} else {
			this.locomotion.virtualPersona.interactions.selection.unselect();
		}
	},

	update() {
		const gamepad = this.locomotion.controllers.getGamepad(this.id);

		if (!gamepad) {
			// Temporary fix because gamepaddisconnected is not firing when leaving VR in Daydream
			this.locomotion.controllers.removeController({id: this.id});
			return;
		}

		if (this.locomotion.teleportation.hitPoint) {
			// Compare both quaternions, and if the difference is big enough, activateTeleport
			const areQuaternionsEqual = Utils.areQuaternionsEqual(this.cameraQuaternion, this.locomotion.scene.camera.quaternion);
			if (!areQuaternionsEqual) {
				// Debounced function
				this.locomotion.teleportation.activateTeleport();
			}
		}

		this.cameraQuaternion.copy(this.locomotion.scene.camera.quaternion);

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
};

export {GamepadController};
