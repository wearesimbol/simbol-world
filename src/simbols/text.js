import * as THREE from 'three';
import loadBmfont from 'load-bmfont';
import createTextGeometry from 'three-bmfont-text';
import createMSDFShader from '../libs/createMSDFShader';
import {NodeSimbol} from './node';

class TextSimbol extends NodeSimbol {

	/** @property {bmfont} font - Saved font once it's loaded the first time */
	static get font() {
		return this._font;
	}

	static set font(font) {
		this._font = font;
	}

	/** @property {THREE.Texture} texture - Saved texture once it's loaded the first time */
	static get texture() {
		return this._texture;
	}

	static set texture(texture) {
		this._texture = texture;
	}

	/** @property {THREE.Mesh} mesh - Text mesh */
	get mesh() {
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
	 * Creates a TextSimbol instance for a string of text
	 *
	 * @param {object} config - Configuration object
	 * @param {string} config.text - String of text
	 * @param {boolean} config.bold - Whether to use the bold or regular font
	 * @param {array} config.position - Array that represents the desired position for the mesh
	 *
	 * @returns {TextSimbol} this
	 */
	constructor(config = {}) {
		super();

		this.constructMesh(config.text, config.bold, config.position)
			.then((mesh) => {
				this.mesh = mesh;
			})
			.catch((error) => {
				this.emit('error', error);
			});
	}

	/**
	 * Consturcts a 3D MSDF based text geometry from a string
	 *
	 * @param {string} text - String to be converted to a 3D geometry. (Default: '')
	 * @param {boolean} bold - Whether it should use the bold font. (Default: false)
	 * @param {array} position - Where the mesh should be positioned. (Default: [0, 0, 0])
	 *
	 * @return {Promise<THREE.Mesh>} promise - Resolves with the Text mesh
	 */
	constructMesh(text = '', bold = false, position = [0, 0, 0]) {
		return new Promise((resolve, reject) => {
			const fontPath = `https://simbol.io/assets/fonts/Roboto-${bold ? 'Bold' : 'Regular'}`;
			let font;
			let texture;
			this._loadFont(fontPath)
				.then((loadedFont) => {
					font = loadedFont;
					return this._loadTexture(fontPath);
				})
				.then((loadedTexture) => {
					texture = loadedTexture;

					const geometry = createTextGeometry({
						width: 500,
						align: 'left',
						font: font,
						text: text
					});

					const shaderConfig = Object.assign(
						createMSDFShader({
							msdf: texture,
							bgColor: new THREE.Vector4(1, 1, 1, 0),
							// #4B606D in rgba is 75, 96, 109, then divided by 255
							fgColor: new THREE.Vector4(0.295, 0.376, 0.427, 1)
						}),
						{
							transparent: true,
							side: THREE.DoubleSide
						}
					);

					const material = new THREE.RawShaderMaterial(shaderConfig);

					const mesh = new THREE.Mesh(geometry, material);
					const scale = bold ? 0.015 : 0.006;
					mesh.scale.set(scale, -scale, scale);
					mesh.position.set(...position);

					resolve(mesh);
				})
				.catch((error) => {
					reject(error);
				});
		});
	}

	/**
	 * Helper function to load and cache the font
	 *
	 * @param {string} path - Path to the font
	 *
	 * @returns {Promise<BMFont>} promise
	 */
	_loadFont(path) {
		return new Promise((resolve, reject) => {
			if (TextSimbol.font) {
				resolve(TextSimbol.font);
			} else {
				loadBmfont(`${path}.json`, (error, font) => {
					if (error) {
						reject(error);
					}

					TextSimbol.font = font;
					resolve(font);
				});
			}
		});
	}

	/**
	 * Helper function to load and cache the font texture
	 *
	 * @param {string} path - Path to the texture
	 *
	 * @returns {Promise<THREE.Texture>} promise
	 */
	_loadTexture(path) {
		return new Promise((resolve, reject) => {
			if (TextSimbol.texture) {
				resolve(TextSimbol.texture);
			} else {
				const textureLoader = new THREE.TextureLoader();
				textureLoader.load(`${path}.png`, (texture) => {
					TextSimbol.texture = texture;
					resolve(texture);
				}, undefined, (error) => {
					reject(error);
				});
			}
		});
	}
}

export {TextSimbol};
