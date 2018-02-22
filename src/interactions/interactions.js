import EventEmitter from 'eventemitter3';
import {Selection} from './selection';

/** Class utility for all interactions*/
class Interactions {

	/**
	 * Constructs an Interactions instance by initialising all interactions
	 */
	constructor() {
		// Initializes EventEmitter
		Object.setPrototypeOf(this.__proto__, new EventEmitter());

		this.selection = new Selection();
	}

	/**
	 * Updates the different interaction elements
	 *
	 * @param {THREE.Vector3} position - The position of the main interaction element
	 * @param {THREE.Quaternion} orientation = The orientation of the main interaction element
	 *
	 * @returns {undefined}
	 */
	update(position, orientation) {
		this.selection.update(position, orientation);
	}

	/**
	 * Gets all the meshes that serve as guides in all interactions
	 *
	 * @returns {array} meshes
	 */
	getMeshes() {
		return [this.selection.reticle];
	}
}

export {Interactions};
