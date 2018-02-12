import * as THREE from 'three';
import {VREffect} from '../libs/VREffect';
import {Loader} from '../utils/loader';
import {Link} from './link';

/**
 * Scene
 * @namespace
 */
const Scene = {

	/** @property {array} animateFunctions - Array of functions that will be called every frame */
	animateFunctions: [],

	/** @property {array} collidableMeshes - Array of all meshes that are collidable */
	collidableMeshes: [],

	/**
	 * @property {number} animationFrameID - ID returned when calling requestAnimationFrame
	 *
	 * @private
	 */
	_animationFrameID: 0,

	/**
	 * Initialises and renders a scene provided
	 *
	 * @param {HTMLCanvasElement} canvas - Canvas element where the scene will be rendered
	 * @param {string|THREE.Scene} sceneToLoad - Either a THREE.Scene to be added, or a path to the .gltf or .json file containing the scene
	 *
	 * @return {undefined}
	 */
	init(canvas, sceneToLoad) {
		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 10000);
		const renderer = new THREE.WebGLRenderer({
			canvas,
			antialias: true
		});
		renderer.setPixelRatio(window.devicePixelRatio);
		// Last parameter adds pixel units to canvas element
		renderer.setSize(window.innerWidth, window.innerHeight, true);
		renderer.shadowMap.enabled = true;

		this.renderer = renderer;
		this.scene = scene;
		this.camera = camera;
		this.vrEffect = new VREffect(this.renderer, console.warn);

		const sceneLoader = Object.create(Loader);
		sceneLoader.init(sceneToLoad);
		sceneLoader.load()
			.then((loadedScene) => {
				loadedScene.name = 'HolonetMainScene';
				loadedScene.scale.set(1, 1, 1);
				loadedScene.position.set(0, 0, 0);
				this._setupMeshes(loadedScene);
				scene.add(loadedScene);
			}, console.warn);

		window.addEventListener('resize', this.onResize.bind(this), false);
		window.addEventListener('vrdisplayactivate', () => {
			this.vrEffect.requestPresent();
		}, false);

		this._render = this._render.bind(this);
		this.animate();
	},

	/**
	 * Helper function that adds a list of meshes to the scene
	 *
	 * @param {array|Three.Object3D} meshes - List of meshes to be added to the scene
	 * @param {boolean} collidable - Whether this mesh should be checked in a collision test
	 * @param {boolean} shadow - Whether this mesh should cast and receive shadows
	 *
	 * @return {undefined}
	*/
	addToScene(meshes, collidable = true, shadow = true) {
		if (!(meshes instanceof Array)) {
			meshes = [meshes];
		}
		for (const mesh of meshes) {
			if (mesh.isObject3D && !mesh.isLight) {
				this._setupMeshes(mesh, collidable, shadow);
			}
			this.scene.add(mesh);
		}
	},

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
	},

	/**
	 * Resize event handler that sets the correct camera size and its projection matrix
	 * Also sets the size of the renderer
	 *
	 * @return {undefined}
	 */
	onResize() {
		const windowWidth = window.innerWidth;
		const windowHeight = window.innerHeight;

		this.camera.aspect = windowWidth / windowHeight;
		this.camera.updateProjectionMatrix();

		// Last parameter adds pixel units to canvas element
		this.vrEffect.setSize(windowWidth, windowHeight, true);
	},

	/**
	 * Sets the requestAnimationFrame on the VRDisplay that updates the scene each frame
	 *
	 * @param {DOMHighResTimeStamp} timestamp - Timestamp supplied by requestAnimationFrame
	 *
	 * @return {undefined}
	*/
	_render(timestamp) {
		for (const func of this.animateFunctions) {
			func(timestamp);
		}

		this.vrEffect.render(this.scene, this.camera);

		this._animationFrameID = this.vrEffect.requestAnimationFrame(this._render);
	},

	/**
	 * Starts the animation frame and saves the rAF ID
	 *
	 * @returns {undefined}
	 */
	animate() {
		this._animationFrameID = this.vrEffect.requestAnimationFrame(this._render);
	},

	/**
	 * Cancels the animation. Useful when the canvas is not visible for performance reasons
	 *
	 * @return {undefined}
	 */
	cancelAnimate() {
		this.vrEffect.cancelAnimationFrame(this._animationFrameID);
	},

	/**
	 * Adds functions to animateFunctions so they will be executed in #render
	 *
	 * @param {array} functions - List of functions that will be executed every frame
	 *
	 * @return {undefined}
	*/
	addAnimateFunctions(functions) {
		// In case functions is not an array
		const functionsToAdd = !Array.isArray(functions) ? [functions] : functions;
		this.animateFunctions.push(...functionsToAdd);
	}
};

Scene.Link = Link;

export {Scene};
