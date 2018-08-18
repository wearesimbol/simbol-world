import Peer from 'simple-peer';
import EventEmitter from 'eventemitter3';
import * as THREE from 'three';

const defaultConfig = {
	socketURL: 'ws://127.0.0.1',
	socketPort: 8091,
	channelName: 'default',
	peer: {
		trickle: true,
		objectMode: false,
		config: {}
	}
};

class MultiVP extends EventEmitter {

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
	 * @param {Simbol.VirtualPersona} vp - Simbol Virtual Persona associated with the local human running the site
	 *
	 * @emits MultiVP#error
	 */
	constructor(config = {}, vp) {
		super();

		this.config = Object.assign({}, defaultConfig, config);
		this.vp = vp;
		this.audioListener = new THREE.AudioListener();

		this.getStream()
			.then((stream) => {
				/**
				 * MultiVP addanimatefunctions event that provides
				 * an array of functions to be added to the event loop
				 *
				 * @event MultiVP#addanimatefunctions
				 * @type {object}
				 * @property functions - Array of functions
				 */
				this.emit('addanimatefunctions', {
					functions: [this.animate.bind(this)]
				});
				this.stream = stream;
				this.socket = this.createSocket();
			})
			.catch((error) => {
				/**
				 * MultiVP error event, sometimes forwarding errors
				 * from other functions or objects
				 *
				 * @event MultiVP#error
				 * @type {Error}
				 *
				 */
				this.emit('error', error);
			});
	}

	/**
	 * Wrapper around getUserMedia
	 *
	 * @example
	 * multiVP.getStream()
	 * 	.then((stream) => {
	 * 		// We got a stream
	 * 	})
	 * 	.catch((error) => {
	 * 		console.log(error);
	 * 	});
	 *
	 * @returns {Promise<MediaStream>} stream
	 */
	getStream() {
		return new Promise((resolve, reject) => {
			navigator.mediaDevices.getUserMedia({audio: true}).then((stream) => {
				resolve(stream);
			}, (error) => {
				reject(error);
			});
		});
	}

	/**
	 * Updates all peer meshes with their current position and rotation
	 * Executed on every animation frame
	 *
	 * @example
	 * simbol.addAnimateFunctions(multiVP.animate.bind(multiVP));
	 *
	 * @returns {undefined}
	 */
	animate() {
		for (const peerId of Object.keys(this.meshes)) {
			const peerMesh = this.meshes[peerId];
			for (let i = 0; i < 3; i++) {
				if (typeof peerMesh.position[i] !== 'number') {
					peerMesh.position[i] = 0;
				}
			}
			peerMesh.mesh.position.set(...peerMesh.position);
			if (typeof peerMesh.rotation === 'number') {
				peerMesh.mesh.rotation.y = peerMesh.rotation;
			}
		}
	}

	/**
	 * Creates a new WebSocket with the set configuration and sets event handlers
	 *
	 * @example
	 * const socket = multiVP.createSocket();
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
	 *
	 * @emits MultiVP#error
	 *
	 * @private
	 */
	_socketError(error) {
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
				const remotePeer = this.createPeer(true, message.from, this.stream);
				this.remotePeers[message.from] = remotePeer;
			}
		} else if (message.type === 'signal') {
			// Offer, answer or icecandidate
			if (!this.remotePeers[message.from]) {
				const remotePeer = this.createPeer(false, message.from, this.stream);
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
	 * @param {MediaStream} stream - Stream obtained from getUserMedia for audio
	 *
	 * @example
	 * // stream is obtained from getUserMedia
	 * const peer1 = multiVP.createPeer(false, 1, stream);
	 *
	 * @returns {Peer} peer - Created SimplePeer
	 */
	createPeer(initiator, id, stream) {
		this.config.peer.initiator = initiator;
		this.config.peer.channelName = this.config.channelName;
		this.config.peer.streams = [stream];
		this.config.peer.config.iceServers = this.config.iceServers;

		const peer = new Peer(this.config.peer);

		peer.id = id;
		peer.multiVP = this;

		peer.on('stream', this._peerStream.bind(peer));
		peer.on('signal', this._peerSignal.bind(peer));
		peer.on('error', this._peerError.bind(peer));
		peer.on('connect', this._peerConnect.bind(peer));
		peer.on('data', this._peerData.bind(peer));
		peer.on('close', this._peerClose.bind(peer));

		return peer;
	}

	/**
	 * Stream handler for a Peer instance
	 * It creates an <audio> element to autoplay the incoming stream
	 *
	 * @param {MediaStream} stream - Incoming stream from the Peer instance
	 *
	 * @returns {undefined}
	 */
	_peerStream(stream) {
		this.audioHelper = new THREE.PositionalAudio(this.multiVP.audioListener);
		const sourceNode = this.audioHelper.context.createMediaStreamSource(stream);
		this.audioHelper.setNodeSource(sourceNode);

		// Workaround for Chrome to output audio
		let audioObj = document.createElement('audio');
		audioObj.srcObject = stream;
		audioObj = null;
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
	 *
	 * @emits MultiVP#error
	 *
	 * @private
	 */
	_peerError(error) {
		this.multiVP.emit('error', error);
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
	 * @emits MultiVP#add
	 * @emits MUltiVP#error
	 *
	 * @private
	 */
	_peerData(data) {
		const string = this.multiVP._decodeBuffer(data);
		data = JSON.parse(string);

		if (data.type === 'connected') {
			this.multiVP._loadAvatar(data.avatar, this.id)
				.then((mesh) => {
					// Adds the positional audio object to position it with the mesh
					mesh.add(this.audioHelper);
					/**
					 * MultiVP add event that provides a mesh to be added to the scene
					 *
					 * @event MultiVP#add
					 * @type {object}
					 * @property {THREE.Mesh} mesh - Mesh to add to the scene
					 */
					this.multiVP.emit('add', {
						mesh
					});
				})
				.catch((error) => {
					this.multiVP.emit('error', error);
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
	 *
	 * @emits MultiVP#remove
	 */
	_peerClose() {
		console.log(`peer ${this.id} closing`);
		delete this.multiVP.remotePeers[this.id];
		if (this.multiVP.meshes[this.id]) {
			const mesh = this.multiVP.meshes[this.id].mesh;
			/**
			 * MultiVP remove event that provides a mesh to be removed
			 * from the scene
			 *
			 * @event MultiVP#remove
			 * @type {object}
			 * @property mesh - Mesh to be removed from the scene
			*/
			this.multiVP.emit('remove', {mesh});
			delete this.multiVP.meshes[this.id];
		}
	}

	/**
	 * Sends data from a VirtualPersona to all peers
	 *
	 * @param {THREE.Mesh} vp - VirtualPersona mesh from where to get the data
	 *
	 * @example
	 * multiVP.sendData(simbol.vpMesh);
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
	 * @param {ArrayBuffer|string} data - Data to be shared to other peers
	 *
	 * @example
	 * const data = {};
	 * multiVP.update(JSON.stringify(data));
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
	 *
	 * @private
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
			.catch((error) => Promise.reject(error));
	}
}

export {MultiVP};
