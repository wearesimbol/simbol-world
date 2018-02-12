import * as THREE from 'three';

/**
 * Utils
 * @namespace
 */
const Utils = {

	/** @property {number} eps - Floating point precision for quaternion rotation comparison */
	eps: 0.00005,

	/**
	 *  Debounces function so it is only called after n milliseconds without it not being called
	 *
	 * @param {Function} func - Function to be debounced
	 * @param {number} delay - Timeout delay
	 *
	 * @returns {Function} debouncedFunc - Debounced function
	 */
	debounce(func, delay) {
		const debouncedFunc = function(...args) {
			const later = () => {
				debouncedFunc.id = null;
				func.apply(this, args);
			};
			clearTimeout(debouncedFunc.id);
			debouncedFunc.id = setTimeout(later, delay);
		};
		return debouncedFunc;
	},

	/**
	 * Compare both quaternions, and if the difference is big enough, activateTeleport
	 *
	 * @param {THREE.Quaternion} quaternion1 - First quaternion to compare
	 * @param {THREE.Quaternion} quaternion2 - Second quaternion to compare
	 *
	 * @returns {boolean} difference - Whether the difference is big enough
	 */
	areQuaternionsEqual(quaternion1, quaternion2) {
		if (!THREE.Quaternion.prototype.isPrototypeOf(quaternion1) || !THREE.Quaternion.prototype.isPrototypeOf(quaternion2)) {
			return false;
		}
		const difference = Math.abs(1 - quaternion1.dot(quaternion2));
		return difference < this.eps;
	},

	isMobile() {

	},

	isIOS() {

	}
};

export {Utils};
export {Loader} from './loader';
