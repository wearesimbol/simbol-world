import * as THREE from 'three';

class Link {

	/** @property {THREE.Color} defaultRingColor - Color value for the ring */
	get defaultRingColor() {
		if (!this._defaultRingColor) {
			this._defaultRingColor = new THREE.Color(1, 1, 1);
		}
		return this._defaultRingColor;
	}

	set defaultRingColor(defaultRingColor) {
		this._defaultRingColor = defaultRingColor;
	}

	/** @property {THREE.Color} defaultRingHoverColor - Color value when the link is hovered */
	get defaultRingHoverColor() {
		if (!this._defaultRingHoverColor) {
			this._defaultRingHoverColor = new THREE.Color(2, 2, 2);
		}
		return this._defaultRingHoverColor;
	}

	set defaultRingHoverColor(defaultRingHoverColor) {
		this._defaultRingHoverColor = defaultRingHoverColor;
	}

	/** @property {THREE.Vector3} position - Position value of where the link object will be */
	get position() {
		return this._position;
	}

	set position(position) {
		if (!this._position) {
			this._position = new THREE.Vector3(...position);
		} else {
			this._position.set(...position);
		}

		if (this.mesh) {
			this.mesh.position.copy(this.position);
		}
	}

	/**
	 * Builds a Link instance with its mesh at the se
	 *
	 * @param {string} path - Where the link will point to
	 * @param {array} position - 3 element array indicating the x, y and z position of the link in the scene
	 */
	constructor(path, position) {
		this.path = path;
		this.position = position;

		this.mesh = this._constructMesh();
	}

	/**
	 * Builds the link mesh
	 *
	 * @returns {THREE.Mesh} mesh
	 *
	 * @private
	 */
	_constructMesh() {
		const geometry = new THREE.CircleBufferGeometry(1, 64);
		const material = new THREE.MeshBasicMaterial({
			color: 0xfcca46,
			side: THREE.DoubleSide
		});
		const mesh = new THREE.Mesh(geometry, material);
		mesh.position.copy(this.position);
		return mesh;
	}

	/**
	 * Adds the link mesh to the scene
	 *
	 * @param {Simbol.Scene} scene - Simbol scene instance to be used to add the link object to it
	 *
	 * @example
	 * // scene is your Three.JS scene
	 * link.render(scene);
	 *
	 * @returns {undefined}
	*/
	render(scene) {
		if (scene) {
			scene.addToScene(this.mesh, false, false);
		}
	}

	hover() {

	}

	/**
	 * Performs the action of redirecting to the link's path
	 *
	 * @example
	 * link.navigate();
	 *
	 * @returns {undefined}
	*/
	navigate() {
		window.location = this.path;
	}
}

export {Link};
