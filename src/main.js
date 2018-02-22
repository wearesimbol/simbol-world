import * as THREE from 'three';
Object.assign(window.THREE = {}, THREE);
import * as webvrPolyfill from 'webvr-polyfill'; // eslint-disable-line no-unused-vars

import * as Utils from './utils/utils';
import {Controllers} from './controllers/controllers';
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
		this._scene = new Scene(config.scene);
		this.virtualPersona = new VirtualPersona(this._scene, config.virtualPersona);
	}

	addToScene(meshes) {
		this._scene.addToScene(...meshes);
	}
}

export default Holonet;
export {Utils};
export {Controllers};
