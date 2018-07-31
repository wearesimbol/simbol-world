'use strict';

import * as THREE from 'three';
import EventEmitter from 'eventemitter3';
import Peer from 'simple-peer';
import {VirtualPersona} from '../../src/virtualpersona/virtualpersona';
import {MultiVP} from '../../src/virtualpersona/multivp';

describe('MultiVP', () => {

	let multiVP;
	let config;
	let vp;

	beforeEach((done) => {
		sinon.stub(EventEmitter.prototype, 'emit');
		config = {
			test: false
		};
		sinon.stub(MultiVP.prototype, 'getStream').resolves(1);
		sinon.stub(MultiVP.prototype, 'createSocket').callsFake(() => done());

		multiVP = new MultiVP(config, vp);
	});

	afterEach(() => {
		EventEmitter.prototype.emit.restore();
		MultiVP.prototype.createSocket.restore && MultiVP.prototype.createSocket.restore();
		MultiVP.prototype.getStream.restore && MultiVP.prototype.getStream.restore();
	});

	it('should be a class', () => {
		assert.isFunction(MultiVP);
	});

	it('should have a set of methods', () => {
		assert.isFunction(MultiVP.prototype.getStream);
		assert.isFunction(MultiVP.prototype.animate);
		assert.isFunction(MultiVP.prototype.createSocket);
		assert.isFunction(MultiVP.prototype._socketError);
		assert.isFunction(MultiVP.prototype._socketMessage);
		assert.isFunction(MultiVP.prototype.createPeer);
		assert.isFunction(MultiVP.prototype._peerStream);
		assert.isFunction(MultiVP.prototype._peerSignal);
		assert.isFunction(MultiVP.prototype._peerError);
		assert.isFunction(MultiVP.prototype._peerConnect);
		assert.isFunction(MultiVP.prototype._peerData);
		assert.isFunction(MultiVP.prototype._peerClose);
		assert.isFunction(MultiVP.prototype.sendData);
		assert.isFunction(MultiVP.prototype.update);
		assert.isFunction(MultiVP.prototype._decodeBuffer);
		assert.isFunction(MultiVP.prototype._loadAvatar);
	});

	it('should have a set of properties', () => {
		assert.deepEqual(MultiVP.prototype.meshes, {});
		assert.deepEqual(MultiVP.prototype.remotePeers, {});
	});
	
	describe('#constructor', () => {

		it('should extend EventEmitter', () => {
			assert.instanceOf(multiVP, EventEmitter);
		});

		it('should set properties', () => {
			assert.deepEqual(multiVP.config, {
				socketURL: 'ws://127.0.0.1',
				socketPort: 8091,
				channelName: 'default',
				test: false,
				peer: {
					trickle: true,
					objectMode: false
				}
			});
			assert.equal(multiVP.stream, 1);
			assert.equal(multiVP.vp, vp);
		});

		it('should add animate functions', () => {
			assert.isTrue(EventEmitter.prototype.emit.calledOnce);
			assert.isTrue(EventEmitter.prototype.emit.calledWith('addanimatefunctions'));
			assert.isArray(EventEmitter.prototype.emit.firstCall.args[1].functions);
			assert.isFunction(EventEmitter.prototype.emit.firstCall.args[1].functions[0]);
		});
	});

	describe('#getStream', () => {
		
		let stream;
		let originalGetUserMedia;

		beforeEach((done) => {
			MultiVP.prototype.getStream.restore();
			originalGetUserMedia = navigator.mediaDevices.getUserMedia;
			navigator.mediaDevices.getUserMedia = sinon.stub().resolves(1);

			multiVP.getStream()
				.then((s) => {
					stream = s;
					done();
				});
		});

		afterEach(() => {
			navigator.mediaDevices.getUserMedia = originalGetUserMedia;
		});

		it('should get stream', () => {
			assert.isTrue(navigator.mediaDevices.getUserMedia.calledOnce);
			assert.deepEqual(navigator.mediaDevices.getUserMedia.firstCall.args[0], {audio: true});
			assert.equal(stream, 1);
		});
	});

	describe('#animate', () => {

		beforeEach(() => {
			multiVP.meshes = {
				1: {
					mesh: {
						position: {
							set: sinon.stub()
						},
						rotation: {
							y: 0
						}
					},
					position: [0, 1, 2],
					rotation: 3
				}
			};
	
			multiVP.animate();
		});

		it('should update mesh position and rotation', () => {
			assert.isTrue(multiVP.meshes[1].mesh.position.set.calledOnce);
			assert.isTrue(multiVP.meshes[1].mesh.position.set.calledWith(0, 1, 2));
			assert.equal(multiVP.meshes[1].mesh.rotation.y, 3);
		})
	});
	
	describe('#createSocket', () => {

		let currentWebSocket;
		let socket;

		beforeEach(() => {
			MultiVP.prototype.createSocket.restore();

			currentWebSocket = window.WebSocket;
			const websocket = function(url) {
				this.url = url;
			};
			websocket.prototype.addEventListener = sinon.stub();
			window.WebSocket = websocket;
	
			multiVP.config = {
				socketURL: 'ws://test',
				socketPort: '9090'
			};

			socket = multiVP.createSocket();
		});
		
		afterEach(() => {
			window.WebSocket = currentWebSocket;
		})

		it('should return a socket', () => {
			assert.instanceOf(socket, WebSocket);
			assert.equal(socket.url, 'ws://test:9090');
		});

		it('should set event handlers', () => {
			assert.isTrue(WebSocket.prototype.addEventListener.calledTwice);
			assert.isTrue(WebSocket.prototype.addEventListener.firstCall.calledWith('error'));
			assert.isTrue(WebSocket.prototype.addEventListener.secondCall.calledWith('message'));
		});
	});
		
	describe('#_socketError', () => {
		
		beforeEach(() => {
			multiVP._socketError('error');
		});

		it('should emit socker errors', () => {
			assert.isTrue(EventEmitter.prototype.emit.calledTwice);
			assert.isTrue(EventEmitter.prototype.emit.secondCall.calledWith('error', 'error'));
		});
	});
	
	describe('#_socketMessage', () => {

		let event;

		beforeEach(() => {
			event = {
				data: {from: 0}
			};
		});

		describe('open message type', () => {
			
			beforeEach(() => {
				event.data.type = 'open';
				event.data = JSON.stringify(event.data);

				multiVP._socketMessage(event);
			});

			it('should handle message', () => {
				assert.equal(multiVP.id, 0);
			});
		});
		
		describe('connected message type', () => {
			
			let peer;
		
			beforeEach(() => {
				event.data.type = 'connected';
				event.data = JSON.stringify(event.data);

				peer = {};
				sinon.stub(multiVP, 'createPeer');
				multiVP.createPeer.returns(peer);
				multiVP.remotePeers = {};
				
				multiVP._socketMessage(event);
			});
			
			it('should handle message', () => {
				assert.isTrue(multiVP.createPeer.calledOnce);
				assert.isTrue(multiVP.createPeer.calledWith(true, 0, 1));
				assert.equal(multiVP.remotePeers[0], peer);
			});
		});
				
		describe('signal message type', () => {
			
			let peer;

			beforeEach(() => {
				event.data.type = 'signal';
				event.data.content = `{"test":true}`;
				event.data = JSON.stringify(event.data);

				peer = {
					signal: sinon.stub()
				};
				multiVP.remotePeers[0] = peer;
				
				multiVP._socketMessage(event);
			});
			
			it('should handle message', () => {
				assert.isTrue(peer.signal.calledOnce);
				assert.deepEqual(peer.signal.firstCall.args[0], JSON.parse('{"test":true}'));
			});
		});
		
		describe('disconnected message type', () => {
			
			beforeEach(() => {
				event.data.type = 'disconnected';
				event.data = JSON.stringify(event.data);

				multiVP.remotePeers[0] = true;
				
				multiVP._socketMessage(event);
			});
			
			it('should handle message', () => {
				assert.isUndefined(multiVP.remotePeers[0]);
			});
		});
	});

	describe('#createPeer', () => {

		let peer;
		const stream = new MediaStream();

		beforeEach(() => {
			multiVP.config = {
				channelName: 'test',
				peer: {}
			};
			sinon.stub(Peer, 'constructor');
			sinon.stub(Peer.prototype, 'on');

			peer = multiVP.createPeer(true, 1, stream);
		});

		afterEach(() => {
			Peer.constructor.restore();
			Peer.prototype.on.restore();
		});

		it('should return a peer instance', () => {
			assert.instanceOf(peer, Peer);
			assert.isTrue(peer.initiator);
			assert.equal(peer.channelName, 'test');
			assert.deepEqual(peer.streams[0], stream);
		});

		it('should set some properties', () => {
			assert.equal(peer.id, 1);
			assert.equal(peer.multiVP, multiVP);
		});

		it('should set some event handlers', () => {
			// Simple-Peer already calls on twice
			assert.equal(peer.on.callCount, 8);
			assert.isTrue(peer.on.getCall(2).calledWith('stream'));
			assert.isTrue(peer.on.getCall(3).calledWith('signal'));
			assert.isTrue(peer.on.getCall(4).calledWith('error'));
			assert.isTrue(peer.on.getCall(5).calledWith('connect'));
			assert.isTrue(peer.on.getCall(6).calledWith('data'));
			assert.isTrue(peer.on.getCall(7).calledWith('close'));
		});
	});

	describe('#_peerStream', () => {
		
		let stream;

		beforeEach(() => {
			sinon.stub(document.body, 'appendChild');
			sinon.stub(HTMLMediaElement.prototype, 'play');
			stream = new MediaStream();

			multiVP._peerStream(stream);
		});

		afterEach(() => {
			document.body.appendChild.restore();
			HTMLMediaElement.prototype.play.restore();
		});

		it('should create audio element', () => {
			assert.instanceOf(multiVP.audioEl, HTMLAudioElement);
			assert.isTrue(multiVP.audioEl.autoplay);
			assert.equal(multiVP.audioEl.srcObject, stream);
		});

		it('should add audio element', () => {
			assert.isTrue(document.body.appendChild.calledOnce);
			assert.isTrue(document.body.appendChild.calledWith(multiVP.audioEl));
			assert.isTrue(HTMLMediaElement.prototype.play.calledOnce);
		});
	});

	describe('#_peerSignal', () => {

		beforeEach(() => {
			const data = {"test": true};
			multiVP.socket = {
				send: sinon.stub()
			};

			multiVP.id = 1;
			multiVP.multiVP = multiVP;

			multiVP._peerSignal(data);
		});

		it('should send a signal message', () => {
			assert.isTrue(multiVP.socket.send.calledOnce);
			assert.isTrue(multiVP.socket.send.calledWith(
				JSON.stringify({
					type: 'signal',
					content: '{"test":true}',
					from: 1,
					to: 1
				})
			));
		});
	});

	describe('#_peerError', () => {
		
		beforeEach(() => {
			multiVP.multiVP = multiVP;
			multiVP._peerError('error');
		});

		it('should emit peer errors', () => {
			assert.isTrue(EventEmitter.prototype.emit.calledTwice);
			assert.isTrue(EventEmitter.prototype.emit.secondCall.calledWith('error', 'error'));
		});
	});

	describe('#_peerConnect', () => {

		beforeEach(() => {
			multiVP.send = sinon.stub();
			multiVP.vp = {
				identity: {
					avatarPath: 'test'
				}
			};
			multiVP.multiVP = multiVP;

			multiVP._peerConnect();
		});

		it('should set connected', () => {
			assert.isTrue(multiVP.connected);
		});

		it('should send the information of is avatar', () => {
			assert.isTrue(multiVP.send.calledOnce);
			assert.isTrue(multiVP.send.calledWith(JSON.stringify({
				type: 'connected',
				avatar: 'test'
			})));
		});
	});

	describe('#_peerData', () => {

		let data;

		beforeEach(() => {
			sinon.stub(multiVP, '_decodeBuffer');

			data = {
				avatar: 'test',
				position: [1, 2],
				rotation: 0
			};
			multiVP.id = 0;
		
			multiVP.multiVP = multiVP;
		});

		describe('common', () => {

			beforeEach(() => {
				multiVP._decodeBuffer.returns(JSON.stringify(data));

				multiVP._peerData(1);
			});

			it('should decode buffer', () => {
				assert.isTrue(multiVP._decodeBuffer.calledOnce);
				assert.isTrue(multiVP._decodeBuffer.calledWith(1));
			});
		});

		describe('connected', () => {

			let mesh;

			beforeEach(() => {
				data.type = 'connected';
				multiVP._decodeBuffer.returns(JSON.stringify(data));
				mesh = {};
				sinon.stub(multiVP, '_loadAvatar').resolves(mesh);

				multiVP._peerData(data);
			});

			it('should load avatar', () => {
				assert.isTrue(multiVP._loadAvatar.calledOnce);
				assert.isTrue(multiVP._loadAvatar.calledWith('test', 0));
				assert.isTrue(true);
			});
		});
		describe('mesh data', () => {

			let mesh;

			beforeEach(() => {
				multiVP._decodeBuffer.returns(JSON.stringify(data));

				mesh = {};
				multiVP.meshes[0] = mesh;

				multiVP._peerData(data);
			});

			it('should set position and rotation', () => {
				assert.deepEqual(mesh.position, [1, 2]);
				assert.equal(mesh.rotation, 0);
			});
		});
	});

	describe('#_peerClose', () => {

		beforeEach(() => {
			sinon.stub(document.body, 'removeChild');

			multiVP.id = 1;
			multiVP.remotePeers[1] = true;
			multiVP.meshes = {
				1: {
					mesh: 1
				}
			};
			multiVP.multiVP = multiVP;
			multiVP.audioEl = 1;

			multiVP._peerClose();
		});

		afterEach(() => {
			document.body.removeChild.restore();
		});

		it('should delete peer', () => {
			assert.isUndefined(multiVP.remotePeers[1]);
		});

		it('should delete audio element', () => {
			assert.isTrue(document.body.removeChild.calledOnce);
			assert.isTrue(document.body.removeChild.calledWith(1));
		});

		it('should delete mesh', () => {
			assert.isUndefined(multiVP.meshes[1]);

			assert.isTrue(EventEmitter.prototype.emit.calledTwice);
			assert.isTrue(EventEmitter.prototype.emit.secondCall.calledWith('remove'));
			assert.deepEqual(EventEmitter.prototype.emit.secondCall.args[1], {mesh: 1});
		});
	});

	describe('#sendData', () => {

		beforeEach(() => {
			sinon.stub(multiVP, 'update');
			const vp = {
				position: {
					x: 0,
					y: 1,
					z: 2
				},
				rotation: {
					y: 3
				}
			};

			multiVP.sendData(vp);
		});

		it('should update peers with vp data', () => {
			assert.isTrue(multiVP.update.calledOnce);
			assert.isTrue(multiVP.update.calledWith(JSON.stringify({
				position: [0, 1, 2],
				rotation: 3
			})));
		});
	});

	describe('#update', () => {

		beforeEach(() => {
			multiVP.remotePeers = {
				0: {
					connected: true,
					send: sinon.stub()
				}
			};

			multiVP.update('test');
		});

		it('should send data to all peers', () => {
			assert.isTrue(multiVP.remotePeers[0].send.calledOnce);
			assert.isTrue(multiVP.remotePeers[0].send.calledWith('test'));
		});
	});

	describe('#_decodeBuffer', () => {

		let data;
		let returnedString;

		beforeEach(() => {
			data = 'test';
		});

		describe('not buffer', () => {

			beforeEach(() => {
				returnedString = multiVP._decodeBuffer(data);
			});

			it('should return string', () => {
				assert.equal(returnedString, 'test');
			});
		});

		describe('using TextDecoder', () => {

			beforeEach(() => {
				const encoder = new TextEncoder();
				data = encoder.encode(data);
				returnedString = multiVP._decodeBuffer(data);
			});

			it('should return string', () => {
				assert.equal(returnedString, 'test');
			});
		});

		describe('older browsers', () => {

			let textDecoder;

			beforeEach(() => {
				textDecoder = window.TextDecoder;
				delete window.TextDecoder;
				const encoder = new TextEncoder();
				data = encoder.encode(data);
				returnedString = multiVP._decodeBuffer(data);
			});

			afterEach(() => {
				window.TextDecoder = textDecoder;
			});

			it('should return string', () => {
				assert.equal(returnedString, 'test');
			});
		});
	});

	describe('#_loadAvatar', () => {

		describe('resolves', () => {

			let mesh;

			beforeEach((done) => {
				mesh = {};
	
				multiVP.vp = {
					loadMesh: sinon.stub().resolves(mesh)
				};
	
				multiVP._loadAvatar('test', 0).then(() => { done(); });
			});
	
			it('should load the avatar', () => {
				assert.isTrue(multiVP.vp.loadMesh.calledOnce);
				assert.isTrue(multiVP.vp.loadMesh.calledWith('test'));
			});
	
			it('should set the name', () => {
				assert.equal(mesh.name, 0);
			});
	
			it('should save the mesh', () => {
				assert.equal(multiVP.meshes[0].mesh, mesh);
				assert.deepEqual(multiVP.meshes[0].position, []);
				assert.equal(multiVP.meshes[0].rotation, 0);
			});
		});
	});

	describe('rejects', () => {

		let caughtError;

		beforeEach((done) => {
			multiVP.vp = {
				loadMesh: sinon.stub().rejects('error')
			};

			multiVP._loadAvatar().catch((error) => {
				caughtError = error;
				done();
			});
		});

		it('should reject errors', () => {
			assert.equal(caughtError, 'error');
		});
	});
});
