import * as THREE from 'three';
import {GLTFLoader} from '../libs/GLTFLoader';

/**
 * Loader
 * @namespace
 */
const Loader = {

	/**
	 * Initialises the Loader
	 *
	 * @param {string|THREE.Mesh} meshToLoad - Either a THREE.Mesh to be added, or a path to the .gltf or .json file containing the mesh
	 *
	 * @returns {undefined};
	 */
	init(meshToLoad) {
		this.meshToLoad = meshToLoad;
		if (typeof meshToLoad === 'string') {
			if (meshToLoad.includes('gltf') || meshToLoad.includes('glb')) {
				this.type = 'GLTF';
			} else if (meshToLoad.includes('json')) {
				this.type = 'OBJ';
			}
		} else if (meshToLoad instanceof THREE.Object3D) {
			this.type = 'Object3D';
		}
	},

	/**
	 * Loads a GLTF model
	 *
	 * @return {Promise} promise - Resolves to a THREE.scene
	 *
	 * @private
	 */
	_loadGLTF() {
		return new Promise((resolve, reject) => {
			const gltfWorldLoader = new GLTFLoader();
			gltfWorldLoader.setCrossOrigin('');
			gltfWorldLoader.load(this.meshToLoad, (data) => {
				resolve(data.scene);
			}, undefined, reject);
		});
	},

	/**
	 * Loads a JSON model
	 *
	 * @return {Promise} promise - Resolves to a Three.Object3D
	 *
	 * @private
	 */
	_loadObj() {
		return new Promise((resolve, reject) => {
			const objWorldLoader = new THREE.ObjectLoader();
			objWorldLoader.setCrossOrigin('');
			objWorldLoader.load(this.meshToLoad, resolve, undefined, reject);
		});
	},

	/**
	 * Loads a model depending on its type
	 *
	 * @return {Promise} promise - Resolves to the loaded mesh
	 */
	load() {
		return new Promise((resolve, reject) => {
			switch(this.type) {
			case 'GLTF':
				this._loadGLTF().then(resolve, reject);
				break;
			case 'OBJ':
				this._loadObj().then(resolve, reject);
				break;
			case 'Object3D':
				resolve(this.meshToLoad);
				break;
			default:
				reject('Invalid mesh provided');
			}
		});
	}

};

export {Loader};
