import EventEmitter from 'eventemitter3';
import * as THREE from 'three';
Object.assign(window.THREE = {}, THREE);
import * as webvrPolyfill from 'webvr-polyfill'; // eslint-disable-line no-unused-vars

import {Utils, Loader, Link} from './utils/utils';
import {Physics} from './physics/physics';
import {Controllers} from './controllers/controllers';
import {Interactions} from './interactions/interactions';
import {Locomotion} from './locomotion/locomotion';
import {VirtualPersona} from './virtualpersona/virtualpersona';
import {Scene} from './scene/scene';

if (!navigator.getVRDisplays) {
	InitializeWebVRPolyfill(); // eslint-disable-line
}

/**  Main class for Simbol */
class Simbol extends EventEmitter {

	/** @property {string} hand - The user's height */
	get hand() {
		if (typeof this._hand === 'undefined') {
			this._hand = 'left';
		}
		return this._hand;
	}

	set hand(hand) {
		if (hand === 'left' || hand === 'right') {
			this._hand = hand;
		}
	}

	/**
	 * Creates a Simbol instance
	 *
	 * @param {object} config - Config object
	 * @param {string} config.hand - The user's preferred hand
	 * @param {object} config.scene - Configuration object for a Simbol scene
	 * @param {object} config.virtualPersona - Configuration object for a VirtualPersona
	 * @param {object} config.virtualPersona.multiVP - Configuration object for a WebRTC based social experience
	 */
	constructor(config) {
		super();

		this.hand = config.hand;

		this._scene = new Scene(config.scene);

		this.virtualPersona = new VirtualPersona(config.virtualPersona);

		this.controllers = new Controllers(this._scene.canvas, this.hand);

		this.locomotion = new Locomotion();
		this.interactions = new Interactions();

		this.interactions.setUpEventListeners(this.controllers);
		this.locomotion.setUpEventListeners(this.controllers, this.interactions);
		this.addListeners(this.virtualPersona, this.controllers, this.interactions);
	}

	/**
	 * Initialises Simbol by initialising its different components
	 * and adding all necessary meshes into the scene
	 *
	 * @returns {Promise} promise - Signals that all components have been initiated
	 */
	init() {
		return this._scene.init()
			.then(() => this.virtualPersona.init())
			.then(() => {
				this.vpMesh = this.virtualPersona.mesh;
				this.controllers.init(this.vpMesh);

				this.addToScene([
					...this.interactions.getMeshes(),
					...this.locomotion.getMeshes()
				]);
				this.addAnimateFunctions([this.animate.bind(this)]);

				return Promise.resolve();
			})
			.catch((error) => Promise.reject(error));
	}

	/**
	 * Listens to a set of common events from different Simbol components
	 *
	 * @param {Object} components - List of Simbol components that fire common events
	 *
	 * @returns {undefined}
	 */
	addListeners(...components) {
		for (const component of components) {
			component.on('add', (event) => {
				this.addToScene([event.mesh]);
			});

			component.on('remove', (event) => {
				this.removeFromScene(event.mesh);
			});

			component.on('addanimatefunctions', (event) => {
				this.addAnimateFunctions(event.functions);
			});

			component.on('error', (event) => {
				this.emit('error', event);
			});
		}
	}

	/**
	 * Helper function that wraps Simbol.Scene.prototype.addToScene
	 *
	 * @param {array} meshes - Meshes to add to the scene
	 * @param {boolean} collidable - Whether this mesh should be checked in a collision test
	 * @param {boolean} shadow - Whether this mesh should cast and receive shadows
	 *
	 * @returns {undefined}
	 */
	addToScene(meshes, collidable = false, shadow = false) {
		this._scene.addToScene([...meshes], collidable, shadow);
	}

	/**
	 * Helper function that removes a mesh from the scene
	 *
	 * @param {THREE.Mesh} mesh - Mesh to be removed from scene
	 *
	 * @returns {undefined}
	 */
	removeFromScene(mesh) {
		this._scene.scene && this._scene.scene.remove(mesh);
	}

	/**
	 * Helper function that wraps Simbol.Scene.prototype.addAnimateFunctions
	 *
	 * @param {array} functions - Array of functions to add to the animation loop
	 *
	 * @returns {undefined}
	 */
	addAnimateFunctions(functions) {
		this._scene.addAnimateFunctions(...functions);
	}

	/**
	 * Helper function that wraps VREffect.prototype.requestPresent
	 * and sets Utils.isPresenting
	 *
	 * @returns {undefined}
	 */
	startPresenting() {
		this._scene.vrEffect.requestPresent();
		Utils.isPresenting = true;
	}

	/**
	 * Helper function that wraps VREffect.prototype.exitPresent
	 * and sets Utils.isPresenting
	 *
	 * @returns {undefined}
	 */
	stopPresenting() {
		this._scene.vrEffect.exitPresent();
		Utils.isPresenting = false;
	}
}

/**
* Main animation function that takes care of positioning the Virtual Persona
* and controllers correctly on each frame
*
* @param {number} time - Current time (ms) to make smooth animations
*
* @returns {undefined}
*/
Simbol.prototype.animate = (function() {
	const unalteredCamera = new THREE.Camera();
	const previousCameraPosition = new THREE.Vector3();
	const previousControllerQuaternion = new THREE.Quaternion();
	previousControllerQuaternion.initialised = false;
	const translationDirection = new THREE.Vector3();
	let previousTime = 0;
	let delta = 0;

	return function(time) {
		// Convert from milliseconds to seconds
		time = time / 1000;
		delta = time - previousTime;
		previousTime = time;

		// Gets the correct controller
		const camera = this._scene.camera;
		let controller = camera;
		if (Utils.isPresenting && this.controllers.mainHandController) {
			controller = this.controllers.mainHandController;
		}

		if (!previousControllerQuaternion.initialised) {
			previousControllerQuaternion.copy(controller.quaternion);
			previousControllerQuaternion.initialised = true;
		}

		// Handle position
		camera.position.copy(previousCameraPosition);

			// Translation
		if (this.locomotion.translatingZ || this.locomotion.translatingX) {
			translationDirection.set(Math.sign(this.locomotion.translatingX || 0), 0, Math.sign(this.locomotion.translatingZ || 0));
			translationDirection.applyQuaternion(camera.quaternion);
			const collision = Physics.checkMeshCollision(this.vpMesh, this._scene.collidableMeshes, this.virtualPersona.climbableHeight, translationDirection);
			if (!collision) {
				if (this.locomotion.translatingZ) {
					camera.translateZ(this.locomotion.translatingZ * delta);
				}

				if (this.locomotion.translatingX) {
					camera.translateX(this.locomotion.translatingX * delta);
				}
			}
		}

			// Teleportation
		if (this.locomotion.teleportation.isRayCurveActive) {
			this.locomotion.teleportation.updateRayCurve(controller, this._scene.scene);
		}

		if (this.locomotion.teleportation.isTeleportActive) {
			camera.position.setX(this.locomotion.teleportation.hitPoint.x);
			camera.position.setY(this.locomotion.teleportation.hitPoint.y + this.virtualPersona.userHeight);
			camera.position.setZ(this.locomotion.teleportation.hitPoint.z);
			this.locomotion.teleportation.resetTeleport();
		}

		if (this.locomotion.teleportation.hitPoint) {
			// Compare both quaternions, and if the difference is big enough, activateTeleport
			const areQuaternionsEqual = Utils.areQuaternionsEqual(previousControllerQuaternion, controller.quaternion);
			if (!areQuaternionsEqual) {
				// Debounced function
				this.locomotion.teleportation.activateTeleport();
			}
		}

			// Camera height
		if (!camera.position.equals(previousCameraPosition)) {
			this.virtualPersona.setFloorHeight(this._scene);
		}

		camera.position.setY(this.virtualPersona.floorHeight + this.virtualPersona.userHeight);

		previousCameraPosition.copy(camera.position);
		if (controller.quaternion) {
			previousControllerQuaternion.copy(controller.quaternion);
		}

		unalteredCamera.copy(camera);

			// Immersive mode + Rotation
		if (Utils.isPresenting) {
			this.virtualPersona.vrControls.update();

			camera.rotation.order = 'YXZ';
			camera.position.add(this.virtualPersona.fakeCamera.position);
			camera.quaternion.copy(this.virtualPersona.fakeCamera.quaternion);

			this.vpMesh.rotation.y = camera.rotation.y + Math.PI;
		} else {
			this.vpMesh.rotation.y = this.locomotion.orientation.euler.y + Math.PI;
			camera.rotation.order = 'XYZ';
			camera.rotation.copy(this.locomotion.orientation.euler);
		}

		// Adjust the mesh's position
		this.vpMesh.position.copy(camera.position);
		const meshYPosition = camera.position.y - this.virtualPersona._meshHeight;
		this.vpMesh.position.setY(meshYPosition);

		// MultiVP
		this.virtualPersona.multiVP.sendData(this.vpMesh);

		// Interactions
		this.interactions.update(controller.position, controller.quaternion);

		// Controllers
		const controllerIds = Object.keys(this.controllers.currentControllers);
		for (const controllerId of controllerIds) {
			// Gets the controller from the list with this id and updates it
			const controller = this.controllers.currentControllers[controllerId];
			controller.update && controller.update(
				delta,
				// Uses a camera that hasn't been applied the HMD data so that
				// it works properly to get the exact controller position
				unalteredCamera,
				this.virtualPersona.userHeight
			);
		}
	};
}());

export default Simbol;
export {Utils, Loader, Link};
export {Simbols} from './simbols/simbols';
