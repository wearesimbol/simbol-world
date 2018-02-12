import * as THREE from 'three';
Object.assign(window.THREE = {}, THREE);
import * as webvrPolyfill from 'webvr-polyfill'; // eslint-disable-line no-unused-vars

import * as Utils from './utils/utils';

if (!navigator.getVRDisplays) {
	InitializeWebVRPolyfill(); // eslint-disable-line
}

/**
 * Holonet
 * @namespace
 */
const Holonet = {

};

export default Holonet;
export {VirtualPersona} from './virtualpersona/virtualpersona';
export {Scene} from './scene/scene';
export {Utils};
