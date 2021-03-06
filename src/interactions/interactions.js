import EventEmitter from 'eventemitter3';
import {Selection} from './selection';

/** Class utility for all interactions*/
class Interactions extends EventEmitter {

	/**
	 * Constructs an Interactions instance by initialising all interactions
	 *
	 * @param {object} config - Configuration object
	 * @param {object} config.selection - Selection configuration object
	 */
	constructor(config = {}) {
		super();

		if (typeof config !== 'object') {
			config = {};
		}

		this.selection = new Selection(config.selection);
	}

	/**
	 * Updates the different interaction elements
	 *
	 * @param {THREE.Vector3} position - The position of the main interaction element
	 * @param {THREE.Quaternion} orientation = The orientation of the main interaction element
	 *
	 * @example
	 * // Position and orientation normally comes from a controller
	 * interactions.update(controller.position, controller.quaternion);
	 *
	 * @returns {undefined}
	 */
	update(position, orientation) {
		this.selection.update(position, orientation);
	}

	/**
	 * Gets all the meshes that serve as guides in all interactions
	 *
	 * @example
	 * const interactionMeshes = interactions.getMeshes();
	 * simbol.addToScene(interactionMeshes);
	 *
	 * @returns {array} meshes
	 */
	getMeshes() {
		return [this.selection.reticle];
	}

	/**
	 * Adds Interaction handlers to an emitter
	 *
	 * @param {Object} emitter - Object that emits events that Interactions needs to handle
	 *
	 * @example
	 * // Controllers is a common emitter that Interactions needs to listen events on
	 * interactions.setUpEventListener(controllers);
	 *
	 * @returns {undefined}
	 */
	setUpEventListeners(emitter) {
		emitter.on('triggerpressed', this.selection.select.bind(this.selection));
	}
}

export {Interactions};
