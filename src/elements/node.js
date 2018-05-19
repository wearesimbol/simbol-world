import * as THREE from 'three';
import EventEmitter from 'eventemitter3';

class NodeElement extends EventEmitter {

	/** @property {array} children - List of child nodes */
	get children() {
		if (typeof this._children === 'undefined') {
			this._children = [];
		}
		return this._children;
	}

	set children(children) {
		this._children = children;
	}

	/** @property {NodeElement} parent - Parent node */
	get parent() {
		return this._parent;
	}

	set parent(parent) {
		this._parent = parent;
	}

	/** @property {THREE.Mesh} mesh - Group mesh */
	get mesh() {
		if (typeof this._mesh === 'undefined') {
			this._mesh = new THREE.Group();
		}
		return this._mesh;
	}

	set mesh(mesh) {
		if (this.parent) {
			this.parent.mesh.remove(this._mesh);
			this.parent.mesh.add(mesh);
		}

		this._mesh = mesh;
	}

	/**
	 * Creates a NodeElement instance that acts as a grouping element
	 *
	 * @returns {NodeElement} this
	 */
	constructor() {
		super();
	}

	/**
	 * Adds a child node, and if it has a mesh, adds it to the Group mesh
	 * It also sets itself as the parent of the child node
	 *
	 * @param {NodeElement} node - Child node
	 *
	 * @returns {undefined}
	 */
	add(node) {
		if (!(node instanceof NodeElement)) {
			return;
		}
		this.children.push(node);
		node.parent = this;
		if (node.mesh) {
			this.mesh.add(node.mesh);
		}
	}

	/**
	 * Removes a child node, and if it has a mesh, removes it from the Group mesh
	 *
	 * @param {NodeElement} node - Child node
	 *
	 * @returns {undefined}
	 */
	remove(node) {
		const index = this.children.indexOf(node);
		if (index !== -1) {
			this.children.splice(index, 1);
			this.mesh.remove(node.mesh);
			node.parent = undefined;
		}
	}
}

export {NodeElement};
