import EventEmitter from 'eventemitter3';
import * as THREE from 'three';
if (THREE) {
	const t = Object.assign({}, THREE);
	window.THREE = t;
}
import WebVRPolyfill from 'webvr-polyfill';

import {Utils, Loader, Link} from './utils/utils';
import {Physics} from './physics/physics';
import {Controllers} from './controllers/controllers';
import {Interactions} from './interactions/interactions';
import {Locomotion} from './locomotion/locomotion';
import {VirtualPersona} from './virtualpersona/virtualpersona';
import {Scene} from './scene/scene';

// Always polyfill as the polyfill itself checks if it's necessary
new WebVRPolyfill();

const defaultConfig = {
	locomotion: true,
	interactions: true
};

/**
 * Main class for Simbol
 *
 * @extends EventEmitter
 */
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
	 * @param {boolean} config.locomtion - Whether Simbol should provide locomotion utilities
	 */
	constructor(config = {locomotion: true}) {
		super();

		config = Object.assign({}, defaultConfig, config);

		this.hand = config.hand;

		this._scene = new Scene(config.scene);

		this.virtualPersona = new VirtualPersona(config.virtualPersona);

		this.controllers = new Controllers(this._scene.canvas, this.hand);

		if (config.interactions) {
			this.interactions = new Interactions();
			this.interactions.setUpEventListeners(this.controllers);
		}

		if (config.locomotion) {
			this.locomotion = new Locomotion();
			this.locomotion.setUpEventListeners(this.controllers, this.interactions);
		}

		this.addListeners(this.virtualPersona, this.controllers, this.interactions);
	}

	/**
	 * Initialises Simbol by initialising its different components
	 * and adding all necessary meshes into the scene
	 *
	 * @example
	 * simbol.init()
	 * 	.then(() => {
	 * 		// Instantiated
	 * 	})
	 * 	.catch((error) => {
	 * 		console.log(error);
	 * 	});
	 *
	 * @returns {Promise} promise - Signals that all components have been initiated
	 */
	init() {
		return this._scene.init()
			.then(() => this.virtualPersona.init())
			.then(() => {
				this.vpMesh = this.virtualPersona.mesh;
				this.controllers.init(this.vpMesh);

				// Adds the UI from other components into the scene
				if (this.interactions) {
					this.addToScene([...this.interactions.getMeshes()]);
				}
				if (this.locomotion) {
					this.addToScene([...this.locomotion.getMeshes()]);
				}

				// Prepares multiVP for positional audio from other peers
				if (this.virtualPersona.multiVP) {
					this._scene.camera.add(this.virtualPersona.multiVP.audioListener);
					document.body.addEventListener('click', () => {
						this.virtualPersona.multiVP.audioListener.context.resume();
					});
				}

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
	 * @example
	 * simbol.addListeners(virtualPersona, controllers, interactions);
	 *
	 * @returns {undefined}
	 *
	 * @emits Simbol#error
	 */
	addListeners(...components) {
		for (const component of components) {
			if (!component) {
				return;
			}

			component.on('add', (event) => {
				if (event.type === 'VirtualPersona') {
					this.vpMesh = event.mesh;
					this.controllers.updateControllers(this.vpMesh);
					this._scene.camera.rotation.order = 'YXZ';
					this.virtualPersona.eyeBone.add(this._scene.camera);
					// Fix so it doesn't look backwards
					this._scene.camera.rotation.y = Math.PI;
				}

				this.addToScene([event.mesh]);
			});

			component.on('remove', (event) => {
				this.removeFromScene(event.mesh);
			});

			component.on('addanimatefunctions', (event) => {
				this.addAnimateFunctions(event.functions);
			});

			component.on('addinteraction', (event) => {
				this.addInteraction(event);
			});

			component.on('error', (event) => {
				/**
				 * Simbol error event that forwards an error event from any of its components
				 *
				 * @event Simbol#error
				 * @type {Error}
				 *
				 */
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
	 * @example
	 * // Not collidable (avatars can go through it) and no shadows (better for performance)
	 * simbol.addToScene([mesh1, mesh2], false, false);
	 *
	 * @returns {undefined}
	 */
	addToScene(meshes, collidable = false, shadow = false) {
		if (!(meshes instanceof Array)) {
			meshes = [meshes];
		}

		this._scene.addToScene([...meshes], collidable, shadow);
	}

	/**
	 * Helper function that removes a mesh from the scene
	 *
	 * @param {THREE.Mesh} mesh - Mesh to be removed from scene
	 *
	 * @example
	 * simbol.removeFromScene(mesh1);
	 *
	 * @returns {undefined}
	 */
	removeFromScene(mesh) {
		this._scene.scene && this._scene.scene.remove(mesh);
	}

	addInteraction(config) {
		switch(config.interaction) {
		case 'selection':
			this.interactions.selection.add(config.mesh);
			if (config.callbacks) {
				for (const callback of config.callbacks) {
					config.mesh.on(callback.event, callback.callback);
				}
			}
		}
	}

	/**
	 * Helper function that wraps Simbol.Scene.prototype.addAnimateFunctions
	 *
	 * @param {array} functions - Array of functions to add to the animation loop
	 *
	 * @example
	 * simbol.addAnimateFunctions(function1, function2);
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
	 * @example
	 * simbol.startPresenting();
	 *
	 * @returns {undefined}
	 */
	startPresenting() {
		this._scene.vrEffect.requestPresent()
			.catch((error) => {
				this.emit('error', error);
			});
		Utils.isPresenting = true;
	}

	/**
	 * Helper function that wraps VREffect.prototype.exitPresent
	 * and sets Utils.isPresenting
	 *
	 * @example
	 * simbol.stopPresenting();
	 *
	 * @returns {undefined}
	 */
	stopPresenting() {
		this._scene.vrEffect.exitPresent();
		Utils.isPresenting = false;
	}

	/**
	 * Helper function that wraps VirtualPersona.prototype.startSocial
	 *
	 * @example
	 * simbol.startSocial();
	 *
	 * @returns {undefined}
	 */
	startSocial() {
		this.virtualPersona.startSocial();
	}
}

/**
* Main animation function that takes care of positioning the Virtual Persona
* and controllers correctly on each frame
*
* @param {number} time - Current time (ms) to make smooth animations
*
* @example
* // This is already done in Simbol#init
* simbol.addAnimateFunctions([simbol.animate.bind(simbol)]);
*
* @returns {undefined}
*/
Simbol.prototype.animate = (function() {
	let initialised = false;
	const unalteredCamera = new THREE.Object3D();
	const previousPosition = new THREE.Vector3();
	const previousControllerQuaternion = new THREE.Quaternion();
	previousControllerQuaternion.initialised = false;
	const translationDirection = new THREE.Vector3();

	const locomotionRotation = new THREE.Euler();
	const cameraWorldToLocal = new THREE.Matrix4();
	const cameraPosition = new THREE.Vector3();
	const cameraQuaternion = new THREE.Quaternion();
	const poseMatrix = new THREE.Matrix4();
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

		if (!initialised) {
			previousControllerQuaternion.copy(controller.quaternion);
			// Hack to fix initial rotation due to Euler(0,0,0) being converted world-to-local is not 0
			this.locomotion.orientation.euler.set(0.0001, 0.0001, 0, 'YXZ');
			initialised = true;
		}

		// Handle position
		if (this.locomotion) {
			// Resets position, specially due to running #add methods on it
			this.vpMesh.position.copy(previousPosition);

			// Translation
			if (this.locomotion.translatingZ || this.locomotion.translatingX) {
				translationDirection.set(Math.sign(this.locomotion.translatingX || 0), 0, Math.sign(this.locomotion.translatingZ || 0));
				translationDirection.applyQuaternion(camera.quaternion);
				const collision = Physics.checkMeshCollision(this.vpMesh, this._scene.collidableMeshes, this.virtualPersona.climbableHeight, translationDirection);
				if (!collision) {
					if (this.locomotion.translatingZ) {
						this.vpMesh.translateZ(this.locomotion.translatingZ * delta);
					}

					if (this.locomotion.translatingX) {
						this.vpMesh.translateX(this.locomotion.translatingX * delta);
					}
				}
			}

			// Teleportation
			if (this.locomotion.teleportation.isRayCurveActive) {
				this.locomotion.teleportation.updateRayCurve(controller, this._scene.scene);
			}

			if (this.locomotion.teleportation.isTeleportActive) {
				this.vpMesh.position.setX(this.locomotion.teleportation.hitPoint.x);
				this.vpMesh.position.setY(this.locomotion.teleportation.hitPoint.y);
				this.vpMesh.position.setZ(this.locomotion.teleportation.hitPoint.z);
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
		}

		// VP height
		if (!this.vpMesh.position.equals(previousPosition)) {
			this.virtualPersona.setFloorHeight(this._scene);
		}

		this.vpMesh.position.setY(this.virtualPersona.floorHeight);

		previousPosition.copy(this.vpMesh.position);
		if (controller.quaternion) {
			previousControllerQuaternion.copy(controller.quaternion);
		}

		/*
		 * Sets a camera to position controllers properly
		 * It needs to not include the added position by the
		 * fakeCamera and position the y axis with the camera
		 */
		this.vpMesh.updateMatrixWorld(true);
		unalteredCamera.copy(this.vpMesh, false);
		camera.matrixWorld.decompose(cameraPosition, cameraQuaternion, {});
		unalteredCamera.position.y = cameraPosition.y;

		// Immersive mode + Rotation
		if (Utils.isPresenting) {
			this.virtualPersona.vrControls.update();

			this.vpMesh.position.add(this.virtualPersona.fakeCamera.position);
			locomotionRotation.copy(this.virtualPersona.fakeCamera.rotation);
		} else if (this.locomotion) {
			locomotionRotation.copy(this.locomotion.orientation.euler);
		}

		// Handle camera rotation
		if (this.locomotion) {
			this.vpMesh.rotation.y = locomotionRotation.y;
			// Calculate World-To-Local for the camera's rotation
			cameraWorldToLocal.getInverse(camera.parent.matrixWorld);
			poseMatrix.makeRotationFromEuler(locomotionRotation);
			poseMatrix.multiplyMatrices(cameraWorldToLocal, poseMatrix);
			poseMatrix.decompose({}, cameraQuaternion, {});
			locomotionRotation.setFromQuaternion(cameraQuaternion);
			camera.rotation.x = locomotionRotation.x; // Negative sign fixes vertical rotation, so up is up and down is down on pc
			camera.rotation.z = locomotionRotation.z;
		}
		camera.matrixWorld.decompose(cameraPosition, cameraQuaternion, {});

		// MultiVP
		if (this.virtualPersona.multiVP) {
			this.virtualPersona.multiVP.sendData(this.vpMesh);
		}

		// Interactions
		if (this.interactions) {
			const position = controller === camera ? cameraPosition : controller.position;
			const quaternion = controller === camera ? cameraQuaternion : controller.quaternion;
			this.interactions.update(position, quaternion);
		}

		// Controllers
		const controllerIds = Object.keys(this.controllers.currentControllers);
		for (const controllerId of controllerIds) {
			// Gets the controller from the list with this id and updates it
			const controller = this.controllers.currentControllers[controllerId];
			this.vpMesh.updateMatrixWorld(true);
			controller.update && controller.update(
				delta,
				// Uses a camera that hasn't been applied the HMD data
				// So that it works properly to get the exact controller position
				unalteredCamera,
				this.virtualPersona.userHeight
			);
		}
	};
}());

export default Simbol;
export {Utils, Loader, Link};
export {Simbols} from './simbols/simbols';
