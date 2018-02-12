import EventEmitter from 'eventemitter3';
import {Selection} from './selection';

/**
 * Interactions
 * @namespace
 */
const Interactions = {

	/**
	 * Initializes all interactions
	 *
	 * @return {undefined}
	 */
	init() {
		// Initializes EventEmitter
		Object.setPrototypeOf(this.__proto__, new EventEmitter());

		this.selection = Object.create(Selection);
		this.selection.init();
	},

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
	},

	/**
	 * Gets all the meshes that serve as guides in all interactions
	 *
	 * @return {array} meshes
	 */
	getMeshes() {
		return [this.selection.reticle];
	}
};

export {Interactions};
