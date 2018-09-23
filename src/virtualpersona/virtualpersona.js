import * as THREE from 'three';
import EventEmitter from 'eventemitter3';
import {VRControls} from '../libs/VRControls';
import {Loader} from '../utils/loader';
import {Physics} from '../physics/physics';
import {Identity} from './identity';
import {MultiVP} from './multivp';

const VERTICAL_VECTOR = new THREE.Vector3(0, -1, 0);
const defaultConfig = {
	signIn: true
};

/** Class for a VirtualPersona */
class VirtualPersona extends EventEmitter {

	/** @property {number} floorHeight - Current height of the floor where the user is */
	get floorHeight() {
		if (typeof this._floorHeight === 'undefined') {
			this._floorHeight = 0;
		}
		return this._floorHeight;
	}

	set floorHeight(floorHeight) {
		this._floorHeight = floorHeight;
	}

	/** @property {number} userHeight - The user's height */
	get userHeight() {
		if (typeof this._userHeight === 'undefined') {
			this._userHeight = 1.7;
		}
		return this._userHeight;
	}

	set userHeight(userHeight) {
		this._userHeight = userHeight;
	}

	/** @property {number} climbableHeight - The height up to which objects are climbable */
	get climbableHeight() {
		if (typeof this._climbableHeight === 'undefined') {
			this._climbableHeight = 0.4;
		}
		return this._climbableHeight;
	}

	set climbableHeight(climbableHeight) {
		this._climbableHeight = climbableHeight;
	}

	/**
	 * Constructs a VP instance and sets its properties
	 *
	 * @param {object} config - Configuration parameters for different elements
	 * @param {boolean} config.signIn - Whether Simbol should attempt to sign the person in on #init
	 * @param {object|boolean} config.multiVP - MultiVP options. Can be set to false if you configure your own multiuser experience
	 *
	 * @returns {undefined}
	 *
	 * @emits VirtualPersona#error
	 * @emits VirtualPersona#add
	 * @emits VirtualPersona#remove
	 * @emits VirtualPersona#addanimatefunctions
	*/
	constructor(config = { signIn: true }) {
		super();

		config = Object.assign({}, defaultConfig, config);
		this.config = config;
		this._feetPosition = new THREE.Vector3();

		// Passes in a fake camera to VRControls that will capture the locomotion of the HMD
		const fakeCamera = new THREE.Object3D();
		fakeCamera.rotation.order = 'YXZ';
		this.vrControls = new VRControls(fakeCamera, (event) => {
			/**
			 * VirtualPersona error event, sometimes forwarding from other subcomponents.
			 *
			 * @event VirtualPersona#error
			 * @type {Error}
			 */
			this.emit('error', event);
		});
		this.vrControls.userHeight = 0;
		this.fakeCamera = fakeCamera;

		this._floorRayCaster = new THREE.Raycaster();
		// TODO: Avoid the user from floating. Probably not necessary?
		this._floorRayCaster.far = this.userHeight + 10;

		this.identity = new Identity();
		this.identity.on('error', (event) => {
			this.emit('error', event);
		});

		if (config.multiVP !== false && config.multiVP.instantiate !== false) {
			this.startSocial();
		}
	}

	/**
	 * Instantiates multiVP
	 *
	 * @example
	 * virtualPersona.startSocial();
	 *
	 * @returns {undefined}
	 */
	startSocial() {
		this.multiVP = new MultiVP(this.config.multiVP, this);
		this.multiVP.on('add', (event) => {
			/**
			 * VirtualPersona add event that provides a mesh
			 * to be added to the scene. Sometimes forwarded
			 * by other subcomponents
			 *
			 * @event VirtualPersona#add
			 * @type {object}
			 * @property mesh - Mesh to add to the scene
			 */
			this.emit('add', event);
		});
		this.multiVP.on('remove', (event) => {
			/**
			 * VirtualPersona remove event that provides a mesh
			 * to be removed to the scene. Sometimes forwarded
			 * by other subcomponents
			 *
			 * @event VirtualPersona#remove
			 * @type {object}
			 * @property mesh - Mesh to be removed from the scene
			 */
			this.emit('remove', event);
		});
		this.multiVP.on('addanimatefunctions', (event) => {
			/**
			 * VirtualPersona addanimatefunctions event that provides a function
			 * to be added to the animation loop. Sometimes forwarded
			 * by other subcomponents
			 *
			 * @event VirtualPersona#addanimatefunctions
			 * @type {object}
			 * @property functions - Array of functions
			 */
			this.emit('addanimatefunctions', event);
		});
		this.multiVP.on('error', (event) => {
			this.emit('error', event);
		});
	}

	/**
	 * Initialises the VP instance by adding it to the scene
	 *
	 * @example
	 * virtualPersona.init()
	 * 	.then((error) => {
	 * 		if (!error) {
	 * 			// Mesh has been loaded, and either there is no automatic sign in,
	 * 			// or the person was signed in successfully
	 * 		} else {
	 * 			// The person rejected the sign in attempt
	 * 		}
	 * 	})
	 * 	.catch((error) => {
	 * 		console.log(error);
	 * 	});
	 *
	 * @returns {Promise} promise - Promise that resolves when the mesh loads
	*/
	init() {
		return this.loadMesh(this.identity.avatarPath, true)
			.then(() => {
				if (this.config.signIn && !this.identity.signedIn) {
					return this.signIn();
				} else {
					return Promise.resolve();
				}
			})
			.catch((error) => Promise.reject(error));
	}

	/**
	 * Loads a Virtual Persona mesh
	 *
	 * @param {string} path - Path to the mesh that will be loaded
	 * @param {boolean} render - Whether to also render the loaded mesh as this identity's mesh
	 *
	 * @example
	 * virtualPersona.loadMesh('path/to/mesh', true)
	 * 	.then((mesh) => {
	 * 		// loaded and rendered mesh
	 * 	})
	 * 	.catch((error) => {
	 * 		console.log(error);
	 * 	});
	 *
	 * @returns {Promise<THREE.Mesh>} mesh
	*/
	loadMesh(path, render) {
		const vpLoader = new Loader(path);
		return vpLoader.load()
			.then((mesh) => {
				mesh = this._setUpMesh(mesh);

				if (render) {
					this.render(mesh);
				}

				return Promise.resolve(mesh);
			})
			.catch((error) => Promise.reject(error));
	}

	/**
	 * Sets up the loaded mesh properly
	 *
	 * @param {THREE.Mesh} mesh - Loaded VP mesh
	 *
	 * @returns {THREE.Mesh} mesh
	 *
	 * @private
	 */
	_setUpMesh(mesh) {
		mesh.name = 'SimbolVirtualPersona';
		mesh.scale.set(1, 1, 1);
		mesh.position.set(0, 0, 0);
		if (mesh.children.length) {
			for (const child of mesh.children) {
				if (child.isMesh) {
					child.geometry.computeFaceNormals();
					child.material.skinning = true;
					child.castShadow = true;
					child.receiveShadow = true;
				}
			}
		}

		return mesh;
	}

	/**
	 * Properly renders the loaded mesh
	 *
	 * @param {THREE.Mesh} mesh - Loaded VP mesh
	 *
	 * @example
	 * // mesh is a loaded mesh
	 * virtualPersona.render(mesh);
	 *
	 * @returns {undefined}
	 *
	 * @emits VirtualPersona#remove
	 * @emits VirtualPersona#add
	 */
	render(mesh) {
		if (this.mesh) {
			this.emit('remove', {
				mesh: this.mesh
			});
		}

		this.mesh = mesh;
		this.headMesh = this.mesh.getObjectByName('VirtualPersonaHead');
		this.headMesh.layers.set(3);
		this.bodyMesh = this.mesh.getObjectByName('VirtualPersonaBody');
		this.eyeBone = this.mesh.getObjectByName('VirtualPersonaEyeBone');
		this.headBone = this.mesh.getObjectByName('VirtualPersonaHeadBone');
		const boundingBox = new THREE.Box3().setFromObject(this.mesh);
		this._meshHeight = boundingBox.max.y - boundingBox.min.y;

		this.emit('add', {
			mesh: this.mesh,
			type: 'VirtualPersona'
		});
	}

	/**
	 * Signs in and loads mesh afterwards
	 *
	 * @example
	 * virtualPersona.signIn()
	 * 	.then((mesh) => {
	 * 		// Signed in loaded mesh
	 * 	})
	 * 	.catch((error) => {
	 * 		console.log(error);
	 * 	});
	 *
	 * @returns {Promise} promise
	 */
	signIn() {
		return this.identity.signIn()
			.then((error) => {
				if (error) {
					return Promise.resolve(error);
				} else {
					return this.loadMesh(this.identity.avatarPath, true);
				}
			})
			.catch((error) => Promise.reject(error));
	}

	/**
	 * Signs out and loads anonymous mesh afterwards
	 *
	 * @example
	 * virtualPersona.signOut()
	 * 	.then((mesh) => {
	 * 		// Anonymous loaded mesh
	 * 	})
	 * 	.catch((error) => {
	 * 		console.log(error);
	 * 	});
	 *
	 * @returns {Promise} promise
	 */
	signOut() {
		this.identity.signOut();
		return this.loadMesh(this.identity.avatarPath, true)
			.catch((error) => Promise.reject(error));
	}

	/**
	 * Adjusts the floor height depending on the position of the Virtual Persona mesh,
	 * checking where it collisions with the scene
	 *
	 * @example
	 * // Three.JS scene
	 * virtualPersona.setFloorHeight(scene);
	 *
	 * @param {Simbol.Scene} scene - Provide scene to adjust the floor height with respect to it
	 *
	 * @returns {undefined}
	 */
	setFloorHeight(scene) {
		this._feetPosition.copy(scene.camera.position);
		// Make it so you only climb objects that are 0.4m above the ground
		this._feetPosition.setY(this._feetPosition.y - this.userHeight + this.climbableHeight);
		// TODO: Remove temporary hack to make stairs work
		this._feetPosition.add(scene.camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(0.4));

		this._floorRayCaster.set(this._feetPosition, VERTICAL_VECTOR);
		const collisionMesh = scene.scene;
		const intersection = Physics.checkRayCollision(this._floorRayCaster, collisionMesh);
		if (intersection) {
			this.floorHeight = intersection.point.y;
		}
	}
}

export {VirtualPersona};
