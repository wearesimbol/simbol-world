import EventEmitter from 'eventemitter3';
import * as THREE from 'three';

import {Controllers} from './controllers';

const VERTICAL_VECTOR = new THREE.Vector3(0, 1, 0);

const HAND_GESTURES = {
	open: 'Open',
	fist: 'Fist',
	okay: 'Okay',
	point: 'Point',
	thumb: 'Thumb',
	thumbPoint: 'ThumbPoint'
};

const ControllerButtons = {
	'Thumbpad': 0,
	'Trigger': 1,
	'Grip': 2,
	'A': 3,
	'B': 4
};

const eyesToElbow = new THREE.Vector3(0.175, -0.3, -0.03);
const forearm = new THREE.Vector3(0, 0, -0.175);

/** Class wrapper for all controllers that have a pose */
class PoseController extends EventEmitter {

	/** @property {Object} pressedButtons - Objects that maps buttons to their states */
	get pressedButtons() {
		if (!this._pressedButtons) {
			this._pressedButtons = {};
		}
		return this._pressedButtons;
	}

	set pressedButtons(pressedButtons) {
		this._pressedButtons = pressedButtons;
	}

	/** @property {Object} touchedButtons - Objects that maps buttons to their states */
	get touchedButtons() {
		if (!this._touchedButtons) {
			this._touchedButtons = {};
		}
		return this._touchedButtons;
	}

	set touchedButtons(touchedButtons) {
		this._touchedButtons = touchedButtons;
	}

	/**
	 * Initialises a PoseController
	 *
	 * @param {Gamepad} gamepad - Gamepad object associated to this controller
	 * @param {THREE.Mesh} vpMesh - The Virtual Persona's mesh used to associate controller to hand
	 *
	 * @emits PoseController#error
	 */
	constructor(gamepad = {}, vpMesh) {
		super();

		this.id = `${gamepad.id} (${gamepad.hand})`;
		this.hand = gamepad.hand;
		this.gamepadId = gamepad.id;
		this.vpMesh = vpMesh;

		if (!this.vpMesh || !(this.vpMesh instanceof THREE.Object3D)) {
			/**
			 * PoseController error event when there's not a valid
			 * Virtual Persona mesh
			 *
			 * @event PoseController#error
			 * @type {Error}
			 */
			this.emit('error', {
				error: new Error('The Virtual Persona mesh must be set and passed onto the PoseController to associate the controller with a hand')
			});

			return;
		}

		this.quaternion = new THREE.Quaternion();
		this.euler = new THREE.Euler();
		// Some controllers don't return an orientation and position until further on
		if (gamepad.pose && gamepad.pose.orientation) {
			this.quaternion.fromArray(gamepad.pose.orientation);
		}
		this.position = new THREE.Vector3().set(0, -0.015, 0.05);

		if (this.hand === 'left') {
			this.handMesh = this.vpMesh.getObjectByName('VirtualPersonaHandLeft');
		} else if (this.hand === 'right') {
			this.handMesh = this.vpMesh.getObjectByName('VirtualPersonaHandRight');
		}

		this.renameAnimations();
		this._animationMixer = new THREE.AnimationMixer(this.vpMesh);
		this.setGesture(HAND_GESTURES.open);
	}

	// TODO: Remove if no exporters add prefixes
	renameAnimations() {
		const gestures = Object.values(HAND_GESTURES)
			.map((gesture) => this.getGestureName(gesture));

		this.vpMesh.animations = this.vpMesh.animations.map((animation) => {
			for (const gesture of gestures) {
				if (animation.name.includes(gesture)) {
					animation.name = gesture;
					return animation;
				}
			}
			return animation;
		});
	}

	/**
	 * Based on the hand and gesture, it generates the complete gesture name
	 * e.g. "Open" => "HandLeftOpen"
	 *
	 * @param {string} gesture - The short gesture name ("Open")
	 *
	 * @example
	 * const fullGestureName = poseController.getGestureName('Open');
	 *
	 * @returns {string} gestureName - The full gesture name ("HandLeftOpen")
	 */
	getGestureName(gesture) {
		const hand = this.hand === 'left' ? 'Left' : 'Right';
		const gestureName = `Hand${hand}${gesture}`;
		return gestureName;
	}

	/**
	 * Based on pressed and touched buttons, it determines the correct gesture
	 *
	 * @example
	 * const currentGesture = poseController.determineGesture();
	 *
	 * @returns {string} gesture - The gesture name ("Open")
	 */
	determineGesture() {
		let gesture = HAND_GESTURES.open;
		const isGripActive = this.pressedButtons['Grip'];
		const isThumbpadActive = this.touchedButtons['Thumbpad'] || this.touchedButtons['A'] || this.touchedButtons['B'];
		const isTriggerActive = this.touchedButtons['Trigger'] || this.pressedButtons['Trigger'];

		if (isGripActive) {
			if (isThumbpadActive) {
				gesture = isTriggerActive ? HAND_GESTURES.fist : HAND_GESTURES.point;
			} else {
				gesture = isTriggerActive ? HAND_GESTURES.thumb : HAND_GESTURES.thumbPoint;
			}
		} else {
			if (isTriggerActive) {
				gesture = isThumbpadActive ? HAND_GESTURES.okay : HAND_GESTURES.fist;
			}
		}

		return gesture;
	}

	/**
	 * Applies the gesture by playing the animation
	 *
	 * @param {string} gesture - Short gesture name ("Open")
	 *
	 * @example
	 * poseController.setGesture('Open');
	 *
	 * @returns {undefined}
	 *
	 * @emits PoseController#gesturechange
	 */
	setGesture(gesture) {
		if (!Object.values(HAND_GESTURES).includes(gesture)) {
			return;
		}

		const gestureName = this.getGestureName(gesture);

		if (gestureName === this.currentGesture) {
			return;
		}

		const clipAction = this._animationMixer.clipAction(gestureName);
		if (!clipAction) {
			return;
		}
		clipAction.clampWhenFinished = true;
		clipAction.loop = THREE.LoopRepeat;
		clipAction.repetitions = 0;
		clipAction.weight = 1;

		this._animationMixer.stopAllAction();

		if (!this.currentGesture) {
			clipAction.play();
			/**
			 * PoseController gesturechange event emitted when
			 * there's a new hand gesture
			 *
			 * @event PoseController#gesturechange
			 * @type {object}
			 * @property gesture - The name of the gesture
			 * @property previousGesture - The name of the previous gesture
			 */
			this.emit('gesturechange', {
				gesture: gestureName,
				previousGesture: false
			});
			return;
		}

		const previousAction = this._animationMixer.clipAction(this.currentGesture);
		if (!previousAction) {
			return;
		}
		previousAction.weight = 0.15;
		previousAction.play();
		clipAction.play();

		this.emit('gesturechange', {
			gesture: gestureName,
			previousGesture: this.currentGesture
		});

		this.currentGesture = gestureName;
	}

	/**
	 * Gets latest information from gamepad and updates the model based on it
	 * It applies an arm model if it's a 3DOF controller
	 * It applies the correct hand gesture
	 * It also emits events for different button states that have the structure:
	 * "button""pressed/unpressed/touched/untouched" e.g. "triggerpressed"
	 *
	 * @param {number} delta - Delta from the animation frame
	 * @param {THREE.Camera} camera - Scene camera
	 * @param {number} userHeight - The user's set height
	 *
	 * @example
	 * // This is executed in an animation loop
	 * gamepadController.update();
	 *
	 * @return {undefined}
	 *
	 * @emits PoseController#controllerdisconnected
	 * @emits PoseController#thumbpadpressed
	 * @emits PoseController#thumbpadunpressed
	 * @emits PoseController#thumbpadtouched
	 * @emits PoseController#thumbpaduntouched
	 * @emits PoseController#triggerpressed
	 * @emits PoseController#triggerunpressed
	 * @emits PoseController#triggertouched
	 * @emits PoseController#triggeruntouched
	 * @emits PoseController#grippressed
	 * @emits PoseController#gripunpressed
	 * @emits PoseController#griptouched
	 * @emits PoseController#gripuntouched
	 * @emits PoseController#apressed
	 * @emits PoseController#aunpressed
	 * @emits PoseController#atouched
	 * @emits PoseController#auntouched
	 * @emits PoseController#bpressed
	 * @emits PoseController#bunpressed
	 * @emits PoseController#btouched
	 * @emits PoseController#buntouched
	 */
	update(delta, camera, userHeight) {
		const gamepad = Controllers.getGamepad(this.id);

		if (!gamepad) {
			/**
			 * Temporary fix because gamepaddisconnected is not firing when leaving VR in Daydream
			 * PoseController controllerdisconnected event for when a gamepad is no longer available
			 *
			 * @event PoseController#controllerdisconnected
			 * @type {object}
			 * @property id - The controller's id
			 */
			this.emit('controllerdisconnected', {
				id: this.gamepadId,
				hand: this.hand
			});
			return;
		}

		for (const buttonName of Object.keys(ControllerButtons)) {
			const buttonId = ControllerButtons[buttonName];
			const button = gamepad.buttons[buttonId];
			if (button) {
				if (button.pressed && !this.pressedButtons[buttonName]) {
					this.emit(`${buttonName.toLowerCase()}pressed`);
					this.pressedButtons[buttonName] = true;
				} else if (!button.pressed && this.pressedButtons[buttonName]) {
					this.emit(`${buttonName.toLowerCase()}unpressed`);
					this.pressedButtons[buttonName] = false;
				}

				if (button.touched && !this.touchedButtons[buttonName]) {
					this.emit(`${buttonName.toLowerCase()}touched`);
					this.touchedButtons[buttonName] = true;
				} else if (!button.touched && this.touchedButtons[buttonName]) {
					this.emit(`${buttonName.toLowerCase()}untouched`);
					this.touchedButtons[buttonName] = false;
				}
			}
		}

		const gesture = this.determineGesture();
		this.setGesture(gesture);

		this._animationMixer.update(delta);

		if (gamepad.pose.orientation) {
			this.quaternion.fromArray(gamepad.pose.orientation || [0, 0, 0, 1]);
		}

		if (gamepad.pose.position) {
			this.position.fromArray(gamepad.pose.position);
		}

		if (this.handMesh) {
			if (!this.worldToLocal) {
				this.worldToLocal = new THREE.Matrix4().getInverse(this.handMesh.parent.matrixWorld);
			} else {
				this.worldToLocal.getInverse(this.handMesh.parent.matrixWorld);
			}
			if (!this.poseMatrix) {
				this.poseMatrix = new THREE.Matrix4();
			}

			if (!gamepad.pose.position) {
				// Arm model from https://github.com/ryanbetts/aframe-daydream-controller-component
				this.position.copy(camera.position);

				if (!this.offset) {
					this.offset = new THREE.Vector3();
				}
				// Set offset for degenerate "arm model" to elbow
				this.offset.set(
					this.hand === 'left' ? -eyesToElbow.x : eyesToElbow.x, // Hand is to your left, or right
					eyesToElbow.y, // Lower than your eyes
					eyesToElbow.z); // Slightly out in front
				// Scale offset by user height
				this.offset.multiplyScalar(userHeight);
				// Apply camera Y rotation (not X or Z, so you can look down at your hand)
				this.offset.applyAxisAngle(VERTICAL_VECTOR, camera.rotation.y);
				// Apply rotated offset to camera position
				this.position.add(this.offset);

				// Set offset for degenerate "arm model" forearm
				this.offset.set(forearm.x, forearm.y, forearm.z); // Forearm sticking out from elbow
				// Scale offset by user height
				this.offset.multiplyScalar(userHeight);
				// Apply controller X and Y rotation (tilting up/down/left/right is usually moving the arm)
				this.euler.setFromQuaternion(this.quaternion);
				this.euler.set(this.euler.x, this.euler.y, 0);
				this.offset.applyEuler(this.euler);
				// Apply rotated offset to camera position
				this.position.add(this.offset);
			}

			this.poseMatrix.makeRotationFromQuaternion(this.quaternion);
			this.poseMatrix.setPosition(this.position);
			this.poseMatrix.multiplyMatrices(this.worldToLocal, this.poseMatrix);
			this.poseMatrix.decompose(this.handMesh.position, this.handMesh.quaternion, {});

			if (gamepad.pose.position) {
				this.handMesh.position.add(camera.position);
			}
		}
	}
}

export {PoseController};
