import Peer from 'simple-peer';
import EventEmitter from 'eventemitter3';

const defaultConfig = {
	socketURL: 'ws://127.0.0.1',
	socketPort: 8091,
	channelName: 'default',
	peer: {
		trickle: true,
		objectMode: false
	}
};

class MultiVP {

	/** @property {Object} meshes - Map of all meshes to their ids */
	get meshes() {
		if (!this._meshes) {
			this._meshes = {};
		}
		return this._meshes;
	}

	set meshes(meshes) {
		this._meshes = meshes;
	}

	/** @property {Object} remotePeer - Map of all peers to their ids */
	get remotePeers() {
		if (!this._remotePeers) {
			this._remotePeers = {};
		}
		return this._remotePeers;
	}

	set remotePeers(remotePeers) {
		this._remotePeers = remotePeers;
	}

	/**
	 * Initializes a MultiVP instance
	 *
	 * @param {Object} config - Configuration parameters
	 * @param {Holonet.VirtualPersona} vp - Holonet Virtual Persona associated with the local human running the site
	 *
	 * @returns {undefined}
	 */
	constructor(config, vp) {
		// Initializes EventEmitter
		Object.setPrototypeOf(this.__proto__, new EventEmitter());

		this.config = Object.assign({}, defaultConfig, config);
		this.vp = vp;
		this.socket = this.createSocket();
		this.emit('addanimatefunctions', {
			functions: [this.animate.bind(this)]
		});
	}

	/**
	 * Updates all peer meshes with their current position and rotation
	 * Executed on every animation frame
	 *
	 * @returns {undefined}
	 */
	animate() {
		for (const peerId of Object.keys(this.meshes)) {
			const peerMesh = this.meshes[peerId];
			peerMesh.mesh.position.set(...peerMesh.position);
			peerMesh.mesh.rotation.y = peerMesh.rotation;
		}
	}

	/**
	 * Creates a new WebSocket with the set configuration
	 *
	 * @returns {WebSocket} socket - Created WebSocket
	 */
	createSocket() {
		const socket = new WebSocket(`${this.config.socketURL}:${this.config.socketPort}`);

		socket.addEventListener('error', this._socketError.bind(this));
		socket.addEventListener('message', this._socketMessage.bind(this));

		return socket;
	}

	/**
	 * Error handler for a WebSocket
	 *
	 * @param {Object} error - Error event Object
	 *
	 * @returns {undefined}
	 * @emits MultiVP#error 
	 *
	 * @private
	 */
	_socketError(error) {
		/**
		 * MultiVP error event for a socket error
		 *
		 * @event MultiVP#error
		 * @type {Error}
		 * 
		 */
		this.emit('error', error);
	}

	/**
	 * Message handler for a WebSocket
	 *
	 * @param {Object} event - Event object for a socket message
	 *
	 * @returns {undefined}
	 *
	 * @private
	 */
	_socketMessage(event) {
		const message = JSON.parse(event.data);
		console.log('socket message', message);
		if (message.type === 'open') {
			this.id = message.from;
		} else if (message.type === 'connected') {
			if (!this.remotePeers[message.from]) {
				const remotePeer = this.createPeer(true, message.from);
				this.remotePeers[message.from] = remotePeer;
			}
		} else if (message.type === 'signal') {
			// Offer, answer or icecandidate
			if (!this.remotePeers[message.from]) {
				const remotePeer = this.createPeer(false, message.from);
				this.remotePeers[message.from] = remotePeer;
			}
			const peer = this.remotePeers[message.from];
			peer.signal(JSON.parse(message.content));
		} else if (message.type === 'disconnected') {
			delete this.remotePeers[message.from];
		}
	}

	/**
	 * Creates a new SimplePeer with the default configuration
	 *
	 * @param {boolean} initiator - Whether this peer is the initiator of the communication
	 * @param {number} id - This peer's id, sent by the signalling server
	 *
	 * @returns {Peer} peer - Created SimplePeer
	 */
	createPeer(initiator, id) {
		this.config.peer.initiator = initiator;
		this.config.peer.channelName = this.config.channelName;
		const peer = new Peer(this.config.peer);

		peer.id = id;
		peer.multiVP = this;

		peer.on('signal', this._peerSignal.bind(peer));
		peer.on('error', this._peerError.bind(peer));
		peer.on('connect', this._peerConnect.bind(peer));
		peer.on('data', this._peerData.bind(peer));
		peer.on('close', this._peerClose.bind(peer));

		return peer;
	}

	/**
	 * Signal handler for a Peer instance
	 *
	 * @param {Object} data - Event object for a signal handler
	 *
	 * @returns {undefined}
	 *
	 * @private
	 */
	_peerSignal(data) {
		this.multiVP.socket.send(JSON.stringify({
			type: 'signal',
			content: JSON.stringify(data),
			from: this.multiVP.id,
			to: this.id
		}));
	}

	/**
	 * Error handler for a Peer instance
	 *
	 * @param {Object} error - Event object for an error handler
	 *
	 * @returns {undefined}
	 * @emits MultiVP#error 
	 *
	 * @private
	 */
	_peerError(error) {
		/**
		 * MultiVP error event for a SimplePeer error. It emits an Error object
		 *
		 * @event MultiVP#error
		 * @type {Error}
		 * @property {string} code - SimplePeer error code
		 * 
		 */
		this.emit('error', error);
	}

	/**
	 * Connect handler for a Peer instance
	 *
	 * @returns {undefined}
	 *
	 * @private
	 */
	_peerConnect() {
		console.log('peer connect');
		this.connected = true;
		this.send(JSON.stringify({
			type: 'connected',
			avatar: this.multiVP.vp.identity.avatarPath
		}));
	}

	/**
	 * Data handler for a Peer instance
	 *
	 * @param {Object} data - Event object for a data handler
	 *
	 * @returns {undefined}
	 *
	 * @private
	 */
	_peerData(data) {
		const string = this.multiVP._decodeBuffer(data);
		data = JSON.parse(string);

		if (data.type === 'connected') {
			this.multiVP._loadAvatar(data.avatar, this.id)
				.then((mesh) => {
					this.emit('add', {
						mesh
					});
				})
				.catch((error) => {
					this.emit('error', error);
				});
		} else {
			const mesh = this.multiVP.meshes[this.id];
			if (mesh) {
				mesh.position = [...data.position];
				mesh.rotation = data.rotation;
			}
		}
	}

	/**
	 * Close handler for a Peer instance
	 *
	 * @returns {undefined}
	 *
	 * @private
	 */
	_peerClose() {
		console.log(`peer ${this.id} closing`);
		delete this.multiVP.remotePeers[this.id];
		if (this.multiVP.meshes[this.id]) {
			this.multiVP.emit('remove', {
				mesh: this.multiVP.meshes[this.id].mesh
			});
			delete this.multiVP.meshes[this.id];
		}
	}

	/**
	 * Sends data from a VirtualPersona to all peers
	 *
	 * @param {THREE.Mesh} vp - VirtualPersona from where to get the data
	 *
	 * @returns {undefined}
	 */
	sendData(vp) {
		const payload = {
			position: [vp.position.x, vp.position.y, vp.position.z],
			rotation: vp.rotation.y
		};

		const positionBuffer = new ArrayBuffer(16);
		positionBuffer[0] = vp.position.x;
		positionBuffer[1] = vp.position.y;
		positionBuffer[2] = vp.position.z;
		positionBuffer[3] = vp.rotation.y;

		this.update(JSON.stringify(payload));
	}

	/**
	 * Sends a piece of data to all peers
	 *
	 * @param {ArrayBuffer} data - Data to be shared to other peers
	 *
	 * @returns {undefined}
	 */
	update(data) {
		for (const peerId of Object.keys(this.remotePeers)) {
			const peer = this.remotePeers[peerId];
			if (peer.connected) {
				peer.send(data);
			}
		}
	}

	/**
	 * Helper function to convert an ArrayBuffer to a String
	 *
	 * @param {ArrayBuffer|TypedArray} buffer - ArrayBuffer to be converted
	 *
	 * @returns {string} string
	*/
	_decodeBuffer(buffer) {
		buffer = buffer.buffer || buffer;
		if (!(buffer instanceof ArrayBuffer)) {
			return buffer;
		}

		let string;

		if ('TextDecoder' in window) {
			if (!this.decoder) {
				this.decoder = new TextDecoder('utf-8');
			}

			const dataView = new DataView(buffer);
			string = this.decoder.decode(dataView);
		} else {
			string = String.fromCharCode.apply(null, new Uint8Array(buffer));
		}

		return string;
	}

	/**
	 * Helper function to load an avatar from a path
	 *
	 * @param {string} path - Path from where to load an avatar
	 * @param {string} id - This avatar's id
	 *
	 * @returns {Promise} promise - Resolves to a loaded avatar
	 *
	 * @private
	 */
	_loadAvatar(path, id) {
		return this.vp.loadMesh(path)
			.then((loadedMesh) => {
				loadedMesh.name = id;
				this.meshes[id] = {
					mesh: loadedMesh,
					position: [],
					rotation: 0
				};
				return Promise.resolve(loadedMesh);
			})
			.catch((error) => {
				return Promise.reject(error);
			});
	}
}

export {MultiVP};
