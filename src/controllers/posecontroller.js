import * as THREE from 'three';
import {Utils} from '../utils/utils';
import {MTLLoader} from '../libs/MTLLoader';
import {OBJLoader} from '../libs/OBJLoader';

const VERTICAL_VECTOR = new THREE.Vector3(0, -1, 0);

const ControllerModels = {
	'Daydream Controller': 'https://cdn.aframe.io/controllers/google/vr-controller-daydream',
	'OpenVR Gamepad': 'https://cdn.aframe.io/controllers/vive/vr-controller-vive',
	'OpenVR Controller': 'https://cdn.aframe.io/controllers/vive/vr-controller-vive',
	'Oculus Touch (Right)': 'https://cdn.aframe.io/controllers/oculus/oculus-touch-controller-right',
	'Oculus Touch (Left)': 'https://cdn.aframe.io/controllers/oculus/oculus-touch-controller-left'
};

const ControllerButtons = {
	'Thumbpad': 0,
	'Trigger': 1,
	'Grip': 2,
	'AppMenu': 3
};

const eyesToElbow = new THREE.Vector3(0.175, -0.3, -0.03);
const forearm = new THREE.Vector3(0, 0, -0.175);

/** Class wrapper for all controllers that have a pose */
class PoseController {

	/** @property {Object} pressedButtons - Objects that maps buttons to their states */
	get pressedButtons() {
		if (!this._pressedButtons) {
			this._pressedButtons = {};
		}
		return this._pressedButtons;
	}

	/**
	 * Initialises a PoseController
	 *
	 * @param {Gamepad} gamepad - Gamepad object associated to this controller
	 * @param {Locomotion} locomotion - Locomotion instance this controller is associated to
	 */
	constructor(gamepad, locomotion) {
		this.locomotion = locomotion;
		this.id = `${gamepad.id} (${gamepad.hand})`;
		this.hand = gamepad.hand;
		this.gamepadId = gamepad.id;

		this.quaternion = new THREE.Quaternion();
		this.prevQuaternion = new THREE.Quaternion();
		this.euler = new THREE.Euler();
		// Some controllers don't return an orientation and position until further on
		if (gamepad.pose.orientation) {
			this.quaternion.fromArray(gamepad.pose.orientation);
		}
		this.position = new THREE.Vector3().set(0, -0.015, 0.05);

		const modelPath = ControllerModels[this.gamepadId];
		if (!modelPath) {
			return;
		}

		const modelRootPath = modelPath.substr(0, modelPath.lastIndexOf('/') + 1);
		const objLoader = new OBJLoader();
		const mtlLoader = new MTLLoader();
		mtlLoader.crossOrigin = '';
		mtlLoader.setTexturePath(modelRootPath);

		mtlLoader.load(`${modelPath}.mtl`, (materials) => {
			materials.preload();
			objLoader.setMaterials(materials);
			objLoader.load(`${modelPath}.obj`, (model) => {
				this.model = model;
				this.locomotion.scene.addToScene(this.model, false, false);
				this._configureControllerModel(gamepad.id, modelRootPath);
			});
		});
	}

	/**
	 * Configures the controller model depending on the controller
	 *
	 * @param {string} id - The controller's id
	 * @param {string} modelRootPath - Path for a specific controller's model
	 *
	 * @return {undefined}
	 */
	_configureControllerModel(id, modelRootPath) {
		const textureLoader = new THREE.TextureLoader();
		textureLoader.crossOrigin = '';
		switch(id) {
		case 'Daydream Controller':
			this.model.position.copy(this.locomotion.scene.camera.position).setY(0.5);
			this.model.scale.multiplyScalar(2.5);
			this.armModel = true;
			this.offset = new THREE.Vector3();
			break;
		case 'OpenVR Gamepad':
			this.model.material.map = textureLoader.load(`${modelRootPath}onepointfive_texture.png`);
			this.model.material.specularMap = textureLoader.load(`${modelRootPath}onepointfive_spec.png`);
			this.model.material.color = new THREE.Color(1, 1, 1);
			break;
		}
	}

	/**
	 * Activates transportation if thumbpad is pressed
	 *
	 * @param {boolean} state - Whether thumbpad is pressed
	 *
	 * @return {undefined}
	 */
	handleThumbpadPressed(state) {
		if (state) {
			if (this.locomotion.teleportation.isRayCurveActive) {
				this.locomotion.teleportation.resetTeleport();
			} else {
				clearTimeout(this._thumbpadTouchedTimeout);
				this.locomotion.stopTranslateZ();
				this.locomotion.teleportation.setRayCurveState(true);
			}
		}
	}

	/**
	 * Activates z translation if thumbpad is touched
	 *
	 * @param {boolean} state - Whether thumbpad is touched
	 *
	 * @return {undefined}
	 */
	handleThumbpadTouched(state) {
		if (state && !this.locomotion.teleportation.isRayCurveActive) {
			this._thumbpadTouchedTimeout = setTimeout(() => {
				this.locomotion.translateZ(-this.locomotion.velocity);
			}, 500);
		} else {
			clearTimeout(this._thumbpadTouchedTimeout);
			this.locomotion.stopTranslateZ();
		}
	}

	/**
	 * Handles trigger pressed
	 *
	 * @param {boolean} state - Whether trigger is pressed
	 *
	 * @return {undefined}
	 */
	handleTriggerPressed(state) {
		if (state) {
			// Hack until controllers are separated from locomotion
			this.locomotion.virtualPersona.interactions.selection.select();
		} else {
			this.locomotion.virtualPersona.interactions.selection.unselect();
		}
	}

	/**
	 * Handles grip pressed
	 *
	 * @param {boolean} state - Whether grip is pressed
	 *
	 * @return {undefined}
	 */
	handleGripPressed(state) {
		state;
	}

	/**
	 * Handles menu pressed
	 *
	 * @param {boolean} state - Whether menu is pressed
	 *
	 * @return {undefined}
	 */
	handleAppMenuPressed(state) {
		state;
	}

	/**
	 * Gets latest information from gamepad and updates the model based on it
	 * It applies an arm model if it's a 3DOF controller
	 * It also applies the handlers for different buttons
	 *
	 * @return {undefined}
	 */
	update() {
		const gamepad = this.locomotion.controllers.getGamepad(this.id);

		if (!gamepad) {
			// Temporary fix because gamepaddisconnected is not firing when leaving VR in Daydream
			this.locomotion.controllers.removeController({
				id: this.gamepadId,
				hand: this.hand
			});
			return;
		}

		if (gamepad.pose.orientation) {
			this.prevQuaternion.copy(this.quaternion);
			this.quaternion.fromArray(gamepad.pose.orientation || [0, 0, 0, 1]);
		}

		if (gamepad.pose.position) {
			this.position.fromArray(gamepad.pose.position);
		}

		if (this.armModel) {
			// Arm model from https://github.com/ryanbetts/aframe-daydream-controller-component
			this.position.copy(this.locomotion.scene.camera.position);
			// Set offset for degenerate "arm model" to elbow
			this.offset.set(
				this.hand === 'left' ? -eyesToElbow.x : eyesToElbow.x, // Hand is to your left, or right
				eyesToElbow.y, // Lower than your eyes
				eyesToElbow.z); // Slightly out in front
			// Scale offset by user height
			this.offset.multiplyScalar(this.locomotion.virtualPersona.userHeight);
			// Apply camera Y rotation (not X or Z, so you can look down at your hand)
			this.offset.applyAxisAngle(VERTICAL_VECTOR, this.locomotion.scene.camera.rotation.y);
			// Apply rotated offset to camera position
			this.position.add(this.offset);

			// Set offset for degenerate "arm model" forearm
			this.offset.set(forearm.x, forearm.y, forearm.z); // Forearm sticking out from elbow
			// Scale offset by user height
			this.offset.multiplyScalar(this.locomotion.virtualPersona.userHeight);
			// Apply controller X and Y rotation (tilting up/down/left/right is usually moving the arm)
			this.euler.setFromQuaternion(this.quaternion);
			this.euler.set(this.euler.x, this.euler.y, 0);
			this.offset.applyEuler(this.euler);
			// Apply rotated offset to camera position
			this.position.add(this.offset);
			this.model.quaternion.copy(this.quaternion);
			this.model.position.copy(this.position);
		} else if (this.model) {
			this.model.quaternion.copy(this.quaternion);
			this.model.position.copy(this.position);
		}

		const standingMatrix = this.locomotion.virtualPersona.vrControls.getStandingMatrix();
		this.model.matrixAutoUpdate = false;
		this.model.matrix.compose(this.model.position, this.model.quaternion, this.model.scale);
		this.model.matrix.multiplyMatrices(standingMatrix, this.model.matrix);
		this.model.matrixWorldNeedsUpdate = true;
		this.model.position.y += this.locomotion.virtualPersona.userHeight;

		if (this.locomotion.teleportation.hitPoint) {
			// Compare both quaternions, and if the difference is big enough, activateTeleport
			const areQuaternionsEqual = Utils.areQuaternionsEqual(this.prevQuaternion, this.quaternion);
			if (!areQuaternionsEqual) {
				// Debounced function
				this.locomotion.teleportation.activateTeleport();
			}
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

				if (buttonName === 'Thumbpad') {
					this[`handle${buttonName}Touched`](button.touched);
				}
			}
		}
	}
}

export {PoseController};
