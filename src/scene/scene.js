import * as THREE from 'three';
// TODO: Remove this hack to make THREE a global before three-bmfont-text is executed
if (THREE) {
	const t = Object.assign({}, THREE);
	window.THREE = t;
}
import {VREffect} from '../libs/VREffect';
import {Loader} from '../utils/loader';

/** Class for the scene that will */
class Scene {

	/** @property {array} animateFunctions - Array of functions that will be called every frame */
	get animateFunctions() {
		if (!this._animateFunctions) {
			this._animateFunctions = [];
		}
		return this._animateFunctions;
	}

	set animateFunctions(animateFunctions) {
		this._animateFunctions = animateFunctions;
	}

	/** @property {array} collidableMeshes - Array of all meshes that are collidable */
	get collidableMeshes() {
		if (!this._collidableMeshes) {
			this._collidableMeshes = [];
		}
		return this._collidableMeshes;
	}

	set collidableMeshes(collidableMeshes) {
		this._collidableMeshes = collidableMeshes;
	}

	/**
	 * Initialises and renders a provided scene.
	 * You can either uses Simbol to create a three.js Renderer and camera and load the scene
	 * or provide it with a previously created renderer and camera to work with
	 *
	 * @param {object} config - Configuration object
	 * @param {boolean} config.render - Whether it needs to take of Three.JS rendering by setting up a renderer and a camera
	 * @param {boolean} config.animate - Whether Simbol should start and control the render loop
	 * @param {string|THREE.Scene} config.sceneToLoad - Either a THREE.Scene to be added, or a path to the .gltf file containing the scene
	 * @param {HTMLCanvasElement} config.canvas - Canvas element where the scene will be rendered
	 * @param {THREE.Renderer} config.renderer - If you're rendering on your own, Simbol needs access to your renderer
	 * @param {THREE.Camera} config.camera - If you're rendering on your own, Simbol needs access to your camera
	 */
	constructor(config = {render: true, animate: true}) {
		this.config = config;
		if (config.render) {
			const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 10000);
			const renderer = new THREE.WebGLRenderer({
				canvas: config.canvas,
				antialias: true
			});
			// Last parameter adds pixel units to canvas element
			renderer.setSize(window.innerWidth, window.innerHeight, true);
			renderer.setPixelRatio(window.devicePixelRatio);
			renderer.shadowMap.enabled = true;

			this.camera = camera;
			this.renderer = renderer;

			window.addEventListener('resize', this.onResize.bind(this), false);
		} else {
			this.camera = config.camera;
			this.renderer = config.renderer;
		}

		this.canvas = this.renderer.domElement;
		this.vrEffect = new VREffect(this.renderer, console.warn);

		const sceneLoader = new Loader(config.sceneToLoad);
		this._sceneLoader = sceneLoader;

		window.addEventListener('vrdisplayactivate', () => {
			this.vrEffect.requestPresent();
		}, false);

		this._render = this._render.bind(this);
	}

	/**
	 * Initialises this instance by loading the scene and starting the animation loop
	 *
	 * @example
	 * scene.init()
	 * 	.then(() => {
	 * 		// Scene has finished loading and has started the animation loop
	 * 	})
	 * 	.catch((error) => {
	 * 		console.log(error);
	 * 	});
	 *
	 * @returns {Promise} promise - Promise that the scene has been loaded
	 */
	init() {
		return this._sceneLoader.load()
			.then((loadedScene) => {
				loadedScene.name = 'SimbolMainScene';

				this._setupMeshes(loadedScene);
				this.scene = loadedScene;
				if (this._meshesToAdd) {
					for (const mesh of this._meshesToAdd) {
						this.scene.add(mesh);
					}
				}

				if (this.config.animate) {
					this.animate();
				}

				return Promise.resolve();
			}, (error) => Promise.reject(error));
	}

	/**
	 * Helper function that adds a list of meshes to the scene
	 *
	 * @param {array|Three.Object3D} meshes - List of meshes to be added to the scene
	 * @param {boolean} collidable - Whether this mesh should be checked in a collision test
	 * @param {boolean} shadow - Whether this mesh should cast and receive shadows
	 *
	 * @example
	 * scene.addToScene([mesh1, mesh2], false, false);
	 *
	 * @returns {undefined}
	*/
	addToScene(meshes, collidable = true, shadow = true) {
		if (!(meshes instanceof Array)) {
			meshes = [meshes];
		}

		for (const mesh of meshes) {
			if (mesh.isObject3D && !mesh.isLight) {
				this._setupMeshes(mesh, collidable, shadow);
			}

			if (!this.scene) {
				if (this._meshesToAdd) {
					this._meshesToAdd.push(mesh);
				} else {
					this._meshesToAdd = [mesh];
				}
			} else {
				this.scene.add(mesh);
			}
		}
	}

	/**
	 * Computes normals for all children of a group
	 *
	 * @param {THREE.Object3D} mesh - A Group of meshes to normalize
	 * @param {boolean} collidable - Whether this mesh should be checked in a collision test
	 * @param {boolean} shadow - Whether this mesh should cast and receive shadows
	 *
	 * @returns {undefined}
	 *
	 * @private
	 */
	_setupMeshes(mesh, collidable = true, shadow = true) {
		if (mesh.children.length) {
			for (const child of mesh.children) {
				this._setupMeshes(child, collidable, shadow);
			}
		} else if (mesh.isObject3D) {
			mesh.geometry && mesh.geometry.computeFaceNormals();
			if (shadow) {
				mesh.castShadow = true;
				mesh.receiveShadow = true;
			}
			if (collidable) {
				this.collidableMeshes.push(mesh);
			}
		}
	}

	/**
	 * Resize event handler that sets the correct camera size and its projection matrix
	 * Also sets the size of the renderer
	 *
	 * @example
	 * window.addEventListener('resize', scene.onResize.bind(scene), false);
	 *
	 * @returns {undefined}
	 */
	onResize() {
		const windowWidth = window.innerWidth;
		const windowHeight = window.innerHeight;

		this.camera.aspect = windowWidth / windowHeight;
		this.camera.updateProjectionMatrix();

		// Last parameter adds pixel units to canvas element
		this.vrEffect.setSize(windowWidth, windowHeight, true);
	}

	/**
	 * Sets the requestAnimationFrame on the VRDisplay that updates the scene each frame
	 *
	 * @param {DOMHighResTimeStamp} timestamp - Timestamp supplied by requestAnimationFrame
	 *
	 * @returns {undefined}
	 *
	 * @private
	*/
	_render(timestamp) {
		for (const func of this.animateFunctions) {
			func(timestamp);
		}

		this.vrEffect.render(this.scene, this.camera);

		this._animationFrameID = this.vrEffect.requestAnimationFrame(this._render);
	}

	/**
	 * Starts the animation loop and saves the requestAnimationFrame ID
	 *
	 * @example
	 * scene.animate();
	 *
	 * @returns {undefined}
	 */
	animate() {
		this._animationFrameID = this.vrEffect.requestAnimationFrame(this._render);
	}

	/**
	 * Cancels the animation loop. Useful when the canvas is not visible for performance reasons
	 *
	 * @example
	 * scene.cancelAnimate();
	 *
	 * @returns {undefined}
	 */
	cancelAnimate() {
		this.vrEffect.cancelAnimationFrame(this._animationFrameID);
	}

	/**
	 * Adds functions to animateFunctions so they will be executed in each animation frame
	 *
	 * @param {array} functions - List of functions that will be executed every frame
	 *
	 * @example
	 * // You can provide different functions that will be executed during each animation frame
	 * scene.addAnimateFunctions(() => {}, () => {});
	 *
	 * @returns {undefined}
	*/
	addAnimateFunctions(functions) {
		// In case functions is not an array
		const functionsToAdd = !Array.isArray(functions) ? [functions] : functions;
		this.animateFunctions.push(...functionsToAdd);
	}
}

export {Scene};
