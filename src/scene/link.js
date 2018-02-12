// https://github.com/aframevr/aframe/blob/v0.7.0/src/components/link.js
import * as THREE from 'three';

const Link = {

	defaultRingColor: new THREE.Color(1, 1, 1),
	defaultRingHoverColor: new THREE.Color(2, 2, 2),

	set position(position) {
		if (!this._position) {
			this._position = new THREE.Vector3(...position);
		} else {
			this._position.set(...position);
		}

		if (this.mesh) {
			this.mesh.position.copy(this.position);
		}
	},

	get position() {
		return this._position;
	},

	init(path, position, scene) {
		this.path = path;
		this.position = position;
		this.scene = scene;

		this.mesh = this._constructMesh();
	},

	_constructMesh() {
		const geometry = new THREE.CircleBufferGeometry(1, 64);
		const material = new THREE.MeshBasicMaterial({
			color: 0xfcca46,
			side: THREE.DoubleSide
		});
		const mesh = new THREE.Mesh(geometry, material);
		mesh.position.copy(this.position);
		return mesh;
	},

	render() {
		if (this.scene) {
			this.scene.addToScene(this.mesh, false, false);
		}
	},

	hover() {

	},

	navigate() {
		window.location = this.path;
	}
};

export {Link};
