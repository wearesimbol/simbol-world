import * as THREE from 'three';
import {VRControls} from '../libs/VRControls';
import {Locomotion} from './locomotion/locomotion';
import {Scene} from '../scene/scene';
import {Loader} from '../utils/loader';
import {Physics} from '../physics/physics';
import {Interactions} from './interactions/interactions';
import {Identity} from './identity';
import {MultiVP} from './multivp';

const VERTICAL_VECTOR = new THREE.Vector3(0, -1, 0);

/**
 * VirtualPersona
 * @namespace
 */
const VirtualPersona = {

	/** @property {number} floorHeight - Current height of the floor where the user is */
	floorHeight: 0,

	/** @property {number} userHeight - The user's height */
	userHeight: 1.7,

	/** @property {number} climbableHeight - The height up to which objects are climbable */
	climbableHeight: 0.4,

	/**
	 * @property {THREE.Vector3} _feetPosition - The current feet position
	 *
	 * @private
	 */
	_feetPosition: new THREE.Vector3(),

	/**
	 * Initialises a VP by rendering supplied mesh into the scene, and initialising inputs
	 *
	 * @param {Scene} scene - Scene that the VP will appear in
	 * @param {object} config - Configuration parameters for different elements
	 *
	 * @return {Promise} promise - Promise that resolves when the mesh loads
	*/
	init(scene, config = {}) {
		if (!scene || !Scene.isPrototypeOf(scene)) {
			return Promise.reject('A Holonet.Scene is required to set up a VirtualPersona');
		}

		// Passes in a fake camera to VRControls that will capture the locomotion of the HMD
		const fakeCamera = new THREE.Object3D();
		fakeCamera.rotation.order = 'YXZ';
		this.vrControls = new VRControls(fakeCamera, console.log);
		this.vrControls.userHeight = 0;
		this.fakeCamera = fakeCamera;

		this._floorRayCaster = new THREE.Raycaster();
		// TODO: Avoid the user from floating. Probably not necessary?
		this._floorRayCaster.far = this.userHeight + 10;

		this.scene = scene;
		this.locomotion = Object.create(Locomotion);
		this.interactions = Object.create(Interactions);
		this.interactions.init();

		this.identity = Object.create(Identity);
		this.identity.init();

		this.multiVP = Object.create(MultiVP);
		this.multiVP.init(config.multiVP || {}, this);

		return this.loadMesh(this.identity.avatarPath, true)
			.then(() => this._setUpVP());
	},

	/**
	 * Loads a Virtual Persona mesh
	 *
	 * @param {string} path - Path to the mesh that will be loaded
	 * @param {boolean} render - Whether to also render the loaded mesh as this identity's mesh
	 *
	 * @return {Promise<THREE.Mesh>} mesh
	*/
	loadMesh(path, render) {
		const vpLoader = Object.create(Loader);
		vpLoader.init(path);
		return vpLoader.load()
			.then((mesh) => {
				mesh = this._setUpMesh(mesh);

				if (render) {
					this.render(mesh);
				}

				return Promise.resolve(mesh);
			})
			.catch((error) => {
				throw error;
			});
	},

	/**
	 * Sets up the loaded mesh properly
	 *
	 * @param {THREE.Mesh} mesh - Loaded VP mesh
	 *
	 * @return {THREE.Mesh} mesh
	 */
	_setUpMesh(mesh) {
		mesh.name = 'HolonetVirtualPersona';
		mesh.scale.set(1, 1, 1);
		mesh.position.set(0, 0, 0);
		if (mesh.children.length) {
			for (const child of mesh.children) {
				if (child.isMesh) {
					child.geometry.computeFaceNormals();
					child.castShadow = true;
					child.receiveShadow = true;
				}
			}
		}

		return mesh;
	},

	/**
	 * Sets up how the VP will interact with the scene
	 *
	 * @return {undefined}
	 */
	_setUpVP() {
		this.locomotion.init(this);
		this.scene.addToScene([...this.interactions.getMeshes()], false, false);
		this.scene.addAnimateFunctions(this.animate.bind(this));
		return Promise.resolve();
	},

	/**
	 * Properly renders the loaded mesh
	 *
	 * @param {THREE.Mesh} mesh - Loaded VP mesh
	 *
	 * @return {undefined}
	 */
	render(mesh) {
		if (this.mesh) {
			this.scene.scene.remove(this.mesh);
		}

		this.mesh = mesh;
		this.headMesh = this.mesh.getObjectByName('VirtualPersonaHead');
		this.bodyMesh = this.mesh.getObjectByName('VirtualPersonaBody');
		const boundingBox = new THREE.Box3().setFromObject(this.mesh);
		this._meshHeight = boundingBox.max.y - boundingBox.min.y;

		this.scene.addToScene(this.mesh, false);
	},

	/**
	 * Signs in and loads mesh afterwards
	 *
	 * @return {Promise} promise
	 */
	signIn() {
		return this.identity.signIn()
			.then(() => this.loadMesh(this.identity.avatarPath, true))
			.catch(console.log);
	},

	/**
	 * Signs out and loads mesh afterwards
	 *
	 * @return {Promise} promise
	 */
	signOut() {
		this.identity.signOut();
		return this.loadMesh(this.identity.avatarPath, true);
	},

	/**
	 * Adjusts the floor height depending on the position
	 *
	 * @return {undefined}
	 *
	 * @private
	 */
	_setFloorHeight() {
		this._feetPosition.copy(this.scene.camera.position);
		// Make it so you only climb objects that are 0.4m above the ground
		this._feetPosition.setY(this._feetPosition.y - this.userHeight + this.climbableHeight);

		this._floorRayCaster.set(this._feetPosition, VERTICAL_VECTOR);
		const collisionMesh = this.scene.scene;
		const intersection = Physics.checkRayCollision(this._floorRayCaster, collisionMesh);
		if (intersection) {
			this.floorHeight = intersection.point.y;
		}
	},

	/**
	 * Positions VirtualPersona correctly on each frame
	 *
	 * @param {number} time - Current time (ms) to make smooth animations
	 *
	 * @return {undefined}
	*/
	animate: (function() {
		const previousCameraPosition = new THREE.Vector3();
		const translationDirection = new THREE.Vector3();
		let previousTime = 0;
		let delta = 0;

		return function(time) {
			// Convert from milliseconds to seconds
			time = time / 1000;
			delta = time - previousTime;
			previousTime = time;

			// Gets the correct controller
			const camera = this.scene.camera;
			const controller = this.locomotion.controllers.mainHandController || camera;

			// Handle position
			camera.position.copy(previousCameraPosition);

			if (this.locomotion.translatingZ || this.locomotion.translatingX) {
				translationDirection.set(Math.sign(this.locomotion.translatingX || 0), 0, Math.sign(this.locomotion.translatingZ || 0));
				translationDirection.applyQuaternion(camera.quaternion);
				const collision = Physics.checkMeshCollision(this.mesh, this.scene.collidableMeshes, this.climbableHeight, translationDirection);
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
				this.locomotion.teleportation.updateRayCurve(controller);
			}

			if (this.locomotion.teleportation.isTeleportActive) {
				camera.position.setX(this.locomotion.teleportation.hitPoint.x);
				camera.position.setY(this.locomotion.teleportation.hitPoint.y + this.userHeight);
				camera.position.setZ(this.locomotion.teleportation.hitPoint.z);
				this.locomotion.teleportation.resetTeleport();
			}

			if (!camera.position.equals(previousCameraPosition)) {
				this._setFloorHeight();
			}

			camera.position.setY(this.floorHeight + this.userHeight);
			previousCameraPosition.copy(camera.position);	

			if (this.scene.vrEffect.isPresenting) {
				this.vrControls.update();

				camera.rotation.order = 'YXZ';
				camera.position.add(this.fakeCamera.position);
				camera.quaternion.copy(this.fakeCamera.quaternion);

				this.mesh.rotation.y = camera.rotation.y + Math.PI;
			} else {
				camera.rotation.order = 'XYZ';
				this.mesh.rotation.y = this.locomotion.orientation.euler.y + Math.PI;
				// Handle rotation
				camera.rotation.copy(this.locomotion.orientation.euler);
			}

			// Adjust vertical position
			this.mesh.position.copy(camera.position);
			if (this.headMesh) {
				const meshYPosition = camera.position.y - this.headMesh.position.y;
				this.mesh.position.setY(meshYPosition);
			} else {
				this.mesh.position.setY(this.floorHeight);
			}

			// MultiVP
			this.multiVP.sendData(this.mesh);

			// Interactions
			this.interactions.update(controller.position, controller.quaternion);

			// Controllers
			const controllerIds = Object.keys(this.locomotion.controllers.currentControllers);
			for (const controllerId of controllerIds) {
				// Gets the controller from the list with this id and updates it
				const controller = this.locomotion.controllers.currentControllers[controllerId];
				controller.update();
			}
		};
	}())
};

export {VirtualPersona};
