import EventEmitter from 'eventemitter3';
import * as THREE from 'three';
Object.assign(window.THREE = {}, THREE);
import * as webvrPolyfill from 'webvr-polyfill'; // eslint-disable-line no-unused-vars

import {Utils, Loader, Link} from './utils/utils';
import {Physics} from './physics/physics'; 
import {Controllers} from './controllers/controllers';
import {Interactions} from './interactions/interactions';
import {Locomotion} from './locomotion/locomotion'
import {VirtualPersona} from './virtualpersona/virtualpersona';
import {Scene} from './scene/scene';

if (!navigator.getVRDisplays) {
	InitializeWebVRPolyfill(); // eslint-disable-line
}

/**  Main class for Holonet */
class Holonet {

	/**
	 * Creates a Holonet instance
	 *
	 * @param {object} config - Config object
	 * @param {object} config.scene - Configuration object for a Holonet scene
	 * @param {object} config.virtualPersona - Configuration object for a VirtualPersona
	 * @param {object} config.virtualPersona.multiVP - Configuration object for a WebRTC based social experience
	 */
	constructor(config) {
		// Initializes EventEmitter
		Object.setPrototypeOf(this.__proto__, new EventEmitter());

		this._scene = new Scene(config.scene);

		this.virtualPersona = new VirtualPersona(config.virtualPersona);

		this.controllers = new Controllers(this._scene.canvas);

		this.locomotion = new Locomotion();
		this.interactions = new Interactions();

		this.interactions.setUpEventListeners(this.controllers);
		this.locomotion.setUpEventListeners(this.controllers, this.interactions);
		this.addListeners(this.virtualPersona, this.controllers, this.interactions);
	}

	/**
	 * Initialises Holonet by initialising its different components
	 * and adding all necessary meshes into the scene
	 *
	 * @returns {Promise} promise - Signals that all components have been initiated
	 */
	init() {
		return this._scene.init()
			.then(() => this.virtualPersona.init())
			.then(() => {
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
	 * Listens to a set of common events from different Holonet components
	 *
	 * @param {Object} components - List of Holonet components that fire common events
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
	 * Helper function that wraps Holonet.Scene.prototype.addToScene
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
	 * Helper function that wraps Holonet.Scene.prototype.addAnimateFunctions
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
Holonet.prototype.animate = (function() {
	const rotatedPosition = new THREE.Quaternion();
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
		const controller = this.controllers.mainHandController || camera;

		if (!previousControllerQuaternion.initialised) {
			previousControllerQuaternion.copy(controller.quaternion);
			previousControllerQuaternion.initialised = true;
		}

		// Handle position
		camera.position.copy(previousCameraPosition);

		if (this.locomotion.translatingZ || this.locomotion.translatingX) {
			translationDirection.set(Math.sign(this.locomotion.translatingX || 0), 0, Math.sign(this.locomotion.translatingZ || 0));
			translationDirection.applyQuaternion(camera.quaternion);
			const collision = Physics.checkMeshCollision(this.virtualPersona.mesh, this._scene.collidableMeshes, this.virtualPersona.climbableHeight, translationDirection);
			if (!collision) {
				if (this.locomotion.translatingZ) {
					camera.translateZ(this.locomotion.translatingZ * delta);
				}

				if (this.locomotion.translatingX) {
					camera.translateX(this.locomotion.translatingX * delta);
				}
			}
		}

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

		if (!camera.position.equals(previousCameraPosition)) {
			this.virtualPersona.setFloorHeight(this._scene);
		}

		camera.position.setY(this.virtualPersona.floorHeight + this.virtualPersona.userHeight);

		previousCameraPosition.copy(camera.position);
		previousControllerQuaternion.copy(controller.quaternion);

		// Handle rotation
		camera.rotation.copy(this.locomotion.orientation.euler);

		if (Utils.isPresenting) {
			this.virtualPersona.vrControls.update();

			rotatedPosition.copy(this.virtualPersona.fakeCamera.position.applyQuaternion(camera.quaternion));
			camera.position.add(rotatedPosition);
			camera.quaternion.multiply(this.virtualPersona.fakeCamera.quaternion);

			this.virtualPersona.mesh.rotation.y = camera.rotation.y + Math.PI;
		} else {
			this.virtualPersona.mesh.rotation.y = this.locomotion.orientation.euler.y + Math.PI;
		}

		// Adjust vertical position
		this.virtualPersona.mesh.position.copy(camera.position);
		if (this.headMesh) {
			const meshYPosition = camera.position.y - this.virtualPersona.headMesh.position.y;
			this.virtualPersona.mesh.position.setY(meshYPosition);
		} else {
			this.virtualPersona.mesh.position.setY(this.virtualPersona.floorHeight);
		}

		// MultiVP
		this.virtualPersona.multiVP.sendData(this.virtualPersona.mesh);

		// Interactions
		this.interactions.update(controller.position, controller.quaternion);

		// Controllers
		const controllerIds = Object.keys(this.controllers.currentControllers);
		for (const controllerId of controllerIds) {
			// Gets the controller from the list with this id and updates it
			const controller = this.controllers.currentControllers[controllerId];
			controller.update && controller.update(camera,
				this.virtualPersona.userHeight,
				this.virtualPersona.vrControls.getStandingMatrix());
		}
	};
}());

export default Holonet;
export {Utils, Loader, Link};
export {Elements} from './elements/elements';
