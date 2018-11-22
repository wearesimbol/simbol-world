import Peer from 'simple-peer';
import EventEmitter from 'eventemitter3';
import * as THREE from 'three';
import {Loader} from '../utils/loader';

const defaultConfig = {
	socketURL: 'wss://ws.simbol.io',
	socketPort: 443,
	channelName: 'default',
	iceServers: [
		{urls: 'stun:global.stun.twilio.com:3478?transport=udp'},
		{urls:'stun:stun.l.google.com:19302'},
		{
			urls: 'turn:albertoelias.me:3478?transport=udp',
			username: 'alberto',
			credential: 'pzqmtestinglol'
		}
	],
	peer: {
		trickle: true,
		objectMode: false,
		config: {}
	}
};

class MultiUser extends EventEmitter {

	/** @property {Object} objects - Map of all networked objects */
	get objects() {
		if (!this._objects) {
			this._objects = {};
		}
		return this._objects;
	}

	set objects(objects) {
		this._objects = objects;
	}

	/** @property {Object} cachedObjects - Cache of objects that couldn't be added */
	get cachedObjects() {
		if (!this._cachedObjects) {
			this._cachedObjects = [];
		}
		return this._cachedObjects;
	}

	set cachedObjects(cachedObjects) {
		this._cachedObjects = cachedObjects;
	}

	/** @property {Object} objectsNeedingAudio - Map of all objects that need an audioHelper added but it hasn't loaded yet */
	get objectsNeedingAudio() {
		if (!this._objectsNeedingAudio) {
			this._objectsNeedingAudio = {};
		}
		return this._objectsNeedingAudio;
	}

	set objectsNeedingAudio(objectsNeedingAudio) {
		this._objectsNeedingAudio = objectsNeedingAudio;
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
	 * Initializes a MultiUser instance
	 *
	 * @param {Object} config - Configuration parameters
	 *
	 * @emits MultiUser#error
	 */
	constructor(config = {}) {
		super();

		this.config = Object.assign({}, defaultConfig, config);
		this.audioListener = new THREE.AudioListener();
		this.socket = this.createSocket();

		this.getStream()
			.then((stream) => {
				this.stream = stream;
				for (const peer of Object.values(this.remotePeers)) {
					peer.addStream(stream);
				}
			})
			.catch((error) => {
				/**
				 * MultiUser error event, sometimes forwarding errors
				 * from other functions or objects
				 *
				 * @event MultiUser#error
				 * @type {Error}
				 *
				 */
				this.emit('error', error);
			});
	}

	/**
	 * Adds a new networked object
	 *
	 * @param {object} data - Data about the object to be added
	 * @param {string} data.type - The object's type ('path', 'name', 'Object3D')
	 * @param {string|THREE.Object3D} data.value - The path, object name or instance of THREE.Object3D to fetch the object
	 * @param {boolean} data.isAvatar - Whether the object corresponds to one of the peer's avatar
	 * @param {number} data.id - The id of the networked object
	 * @param {number} data.lastUpdate - Time in ms when the object data was last changed
	 * @param {number} peerId - Id corresponding to the peer that is sharing the object
	 *
	 * @returns {undefined}
	 *
	 * @emits MultiUser#add
	 * @emits MultiUser#error
	 */
	addObject(data, peerId) {
		if (this.objects[data.id]) {
			return Promise.resolve();
		}

		if (typeof this.id === 'undefined') {
			this.cachedObjects.push(data);
			return Promise.resolve();
		}

		if (typeof peerId === 'undefined') {
			peerId = this.id;
		}

		return this._loadObject(data).then((object) => {
			const now = performance.now();

			if (data.isAvatar && peerId !== this.id) {
				// Adds the positional audio object to position it with the mesh
				if (this.remotePeers[peerId].audioHelper) {
					object.add(this.remotePeers[peerId].audioHelper);
				} else {
					this.objectsNeedingAudio[peerId] = object;
				}
			}

			if (!data.id) {
				data.id = object.uuid;
			}

			if (peerId === this.id) {
				if (data.isAvatar) {
					this.broadcast(JSON.stringify({
						type: 'update',
						object: {
							type: 'path',
							value: this.localAvatar.avatarPath,
							lastUpdate: now,
							id: data.id,
							isAvatar: true,
							owner: this.id
						}
					}));
				} else {
					this.broadcast(JSON.stringify({
						type: 'update',
						object: {
							type: data.type,
							value: data.value,
							lastUpdate: now,
							id: data.id,
							owner: this.id
						}
					}));
				}
			} else {
				/**
				 * MultiUser add event that provides a mesh to be added to the scene
				 *
				 * @event MultiUser#add
				 * @type {object}
				 * @property {THREE.Mesh} mesh - Mesh to add to the scene
				 */
				this.emit('add', {
					mesh: object
				});
			}

			this.objects[data.id] = {
				object3D: object,
				owner: data.owner || '',
				lastUpdate: data.lastUpdate || now,
				position: [],
				rotation: []
			};
		}).catch((error) => {
			this.emit('error', error);
		});
	}

	/**
	 * Removes a networked object
	 *
	 * @param {number} id - The id of the networked object
	 *
	 * @returns {undefined}
	 */
	removeObject(id) {
		delete this.objects[id];
	}

	/**
	 * Wrapper function for different object loading methods
	 *
	 * @param {object} data - Object's data
	 * @param {string} data.type - String that explains how to load the object ('path', 'name', 'Object3D')
	 * @param {string|THREE.Object3D} - Where to load the object from based on the type
	 *
	 * @returns {Promise} promise
	 *
	 * @emits Multiuser#error
	 *
	 * @private
	 */
	_loadObject(data) {
		return new Promise((resolve, reject) => {
			switch (data.type) {
			case 'path':
				this._loadObjectFromPath(data.value).then(resolve, reject);
				break;
			case 'name':
				this._loadObjectFromName(data.value).then(resolve, reject);
				break;
			case 'Object3D':
				resolve(data.value);
				break;
			default:
				reject(new Error('Shared object wrong'));
			}
		});
	}

	/**
	 * Helper function to fetch an object in the scene based on its name
	 *
	 * @param {string} name - Name of the object
	 *
	 * @returns {Promise} promise
	 *
	 * @private
	 */
	_loadObjectFromName(name) {
		return new Promise((resolve, reject) => {
			const object = this.config.scene.getObjectByName(name);
			if (!object) {
				reject(`Simbol.MultiUser: No object found with name ${name} in the scene to be networked`);
			} else {
				resolve(object);
			}
		});
	}

	/**
	 * Helper function to load an object from a path
	 *
	 * @param {string} path - Path from where to load an object
	 *
	 * @returns {Promise} promise - Resolves to a loaded object
	 *
	 * @private
	 */
	_loadObjectFromPath(path) {
		const vpLoader = new Loader(path);
		return vpLoader.load()
			.then((loadedMesh) => Promise.resolve(loadedMesh))
			.catch((error) => Promise.reject(error));
	}

	/**
	 * Makes this peer take ownership of a networked object
	 *
	 * @param {THREE.Object3D} object - Object to take ownership of
	 *
	 * @returns {undefined}
	 */
	grabOwnership(object) {
		for (const objectId of Object.keys(this.objects)) {
			const objectData = this.objects[objectId];
			if (objectData.object3D === object) {
				const now = performance.now();
				if (objectData.owner !== this.id &&
					objectData.lastUpdate < now) {

					objectData.owner = this.id;
					objectData.lastUpdate = now;
					this.broadcast(JSON.stringify({
						type: 'update',
						object: {
							id: objectId,
							lastUpdate: objectData.lastUpdate,
							owner: objectData.owner
						}
					}));
				}
				return;
			}
		}
	}

	/**
	 * Wrapper around getUserMedia
	 *
	 * @example
	 * multiUser.getStream()
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
	 * simbol.addAnimateFunctions(multiUser.animate.bind(multiUser));
	 *
	 * @returns {undefined}
	 */
	animate() {
		for (const object of Object.values(this.objects)) {
			if (object.owner !== this.id) {
				for (let i = 0; i < 3; i++) {
					if (typeof object.position[i] !== 'number') {
						object.position[i] = 0;
					}
					if (typeof object.rotation[i] !== 'number') {
						object.rotation[i] = 0;
					}
				}
				object.object3D.position.set(...object.position);
				object.object3D.rotation.set(...object.rotation);
			} else {
				this.sendData(object.object3D);
			}
		}
	}

	/**
	 * Creates a new WebSocket with the set configuration and sets event handlers
	 *
	 * @example
	 * const socket = multiUser.createSocket();
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
	 * @emits MultiUser#error
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
			this._addCachedObjects();
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
	 * const peer1 = multiUser.createPeer(false, 1, stream);
	 *
	 * @returns {Peer} peer - Created SimplePeer
	 */
	createPeer(initiator, id, stream) {
		this.config.peer.initiator = initiator;
		this.config.peer.channelName = this.config.channelName;
		if (stream) {
			this.config.peer.streams = [stream];
		}
		this.config.peer.config.iceServers = this.config.iceServers;

		const peer = new Peer(this.config.peer);

		peer.id = id;
		peer.multiUser = this;

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
		this.audioHelper = new THREE.PositionalAudio(this.multiUser.audioListener);
		const sourceNode = this.audioHelper.context.createMediaStreamSource(stream);
		this.audioHelper.setNodeSource(sourceNode);

		// Workaround for Chrome to output audio
		let audioObj = document.createElement('audio');
		audioObj.srcObject = stream;
		audioObj = null;

		const objectNeedingAudio = this.multiUser.objectsNeedingAudio[this.id];
		if (objectNeedingAudio) {
			objectNeedingAudio.add(this.audioHelper);
			delete this.multiUser.objectsNeedingAudio[this.id];
		}
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
		this.multiUser.socket.send(JSON.stringify({
			type: 'signal',
			content: JSON.stringify(data),
			from: this.multiUser.id,
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
	 * @emits MultiUser#error
	 *
	 * @private
	 */
	_peerError(error) {
		this.multiUser.emit('error', error);
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
		this.multiUser.broadcast(JSON.stringify({
			type: 'update',
			object: {
				type: 'path',
				id: this.multiUser.localAvatar.uuid,
				isAvatar: true,
				value: this.multiUser.localAvatar.avatarPath
			}
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
		const string = this.multiUser._decodeBuffer(data);
		data = JSON.parse(string);

		if (data.type === 'update') {
			this.multiUser.update(data, this.id);
		} else if (data.type === 'remove') {
			this.multiUser.remove(data, this.id);
		}
	}

	/**
	 * Close handler for a Peer instance
	 *
	 * @returns {undefined}
	 *
	 * @private
	 *
	 * @emits MultiUser#remove
	 */
	_peerClose() {
		console.log(`peer ${this.id} closing`);
		// multiuser-todo
		delete this.multiUser.remotePeers[this.id];
		if (this.multiUser.objects[this.id]) {
			const mesh = this.multiUser.objects[this.id].object;
			/**
			 * MultiUser remove event that provides a mesh to be removed
			 * from the scene
			 *
			 * @event MultiUser#remove
			 * @type {object}
			 * @property mesh - Mesh to be removed from the scene
			*/
			this.multiUser.emit('remove', {mesh});
			delete this.multiUser.objects[this.id];
		}
	}

	/**
	 * Updates the information about a networked object. If it's not being tracked, it's added
	 *
	 * @param {object} data - Data about the information update
	 * @param {object} data.object - Data about the object
	 * @param {number} data.object.id - The object's id
	 * @param {number} data.object.owner - The owner's peerID
	 * @param {number} data.object.lastUpdate - Date in ms when the object was last updated
	 * @param {array} data.position - New object position
	 * @param {array} data.rotation - New object rotation
	 * @param {number} peerId - The peer's id who's sending the information
	 *
	 * @returns {undefined}
	 */
	update(data, peerId) {
		if (!this.objects[data.object.id]) {
			this.addObject(data.object, peerId);
		}

		const object = this.objects[data.object.id];
		if (object) {
			if (!this.remotePeers[peerId].initiator && object.firstUpdate) {
				
			}

			if (data.position) {
				object.position = [...data.position];
			}

			if (data.rotation) {
				object.rotation = [...data.rotation];
			}

			if (data.object.owner && data.object.lastUpdate) {
				object.owner = data.object.owner;
				object.lastUpdate = data.object.lastUpdate;
			}
		}
	}

	/**
	 * 
	 */
	remove(data, peerId) {
		// multiuser-todo
	}

	/**
	 * Sends data from an object to all peers
	 *
	 * @param {THREE.Mesh} object - Mesh from where to get the data
	 *
	 * @example
	 * multiUser.sendData(simbol.vpMesh);
	 *
	 * @returns {undefined}
	 */
	sendData(object) {
		const payload = {
			type: 'update',
			object: {
				id: object.uuid,
				owner: this.id
			},
			position: [object.position.x, object.position.y, object.position.z],
			rotation: [object.rotation.x, object.rotation.y, object.rotation.z]
		};

		const positionBuffer = new ArrayBuffer(16);
		positionBuffer[0] = object.position.x;
		positionBuffer[1] = object.position.y;
		positionBuffer[2] = object.position.z;
		positionBuffer[3] = object.rotation.y;

		this.broadcast(JSON.stringify(payload));
	}

	/**
	 * Sends a piece of data to all peers
	 *
	 * @param {ArrayBuffer|string} data - Data to be shared to other peers
	 *
	 * @example
	 * const data = {};
	 * multiUser.broadcast(JSON.stringify(data));
	 *
	 * @returns {undefined}
	 */
	broadcast(data) {
		for (const peerId of Object.keys(this.remotePeers)) {
			const peer = this.remotePeers[peerId];
			if (peer.connected) {
				peer.send(data);
			}
		}
	}

	/**
	 * Saves the avatar's object and adds it as a networked object
	 *
	 * @param {THREE.Object3D} avatar - The avatar's object
	 *
	 * @returns {undefined}
	 */
	setLocalAvatar(avatar) {
		if (!avatar) {
			return;
		}
		this.localAvatar = avatar;
		this.addObject({
			type: 'Object3D',
			value: this.localAvatar,
			id: avatar.uuid,
			isAvatar: true,
			owner: this.id
		}, this.id);
	}

	/**
	 * Helper function that adds networked objects that were cached until the socket was open
	 *
	 * @returns {undefined}
	 */
	_addCachedObjects() {
		for (const object of this.cachedObjects) {
			this.addObject(object);
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
}

export {MultiUser};
