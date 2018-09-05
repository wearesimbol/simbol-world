# simbol

Easily create social virtual worlds that anyone can interact with using Virtual Personas, a global identity system where people own their identities.

## Quick Start

Install via [npm](https://npmjs.com)

```js
npm install --save simbol
```

Then import it using ES2015 Modules, CommonJS or with a `<script>` tag:

```js
import Simbol from 'simbol';
const Simbol = require('simbol');
<script src="./node_modules/simbol/build/simbol.script.js"></script>
```

And finally, create a new `Simbol` instance and initialise it:

```js
const config = {
	scene: {
		canvas: document.querySelector('canvas'),
		sceneToLoad: 'path/to/my/scene.gltf'
	}
};
const simbol = new Simbol(config); // If you're loading the ES Module or the CommonJS Module
// or
const simbol = new Simbol.default(config); // If you're loading simbol.script.js

simbol.init();
```

## Configuration object

Simbol accepts several configuration parameters detailed below:

### hand

`string`, default: `'left'`

The main user's hand. It's value can be either `'left'` or `'right'`

### locomotion

`boolean`, default `true`

Whether Simbol should provide a default locomotion system

### scene

`object`

All configuration properties related to setting up the scene

#### render

`boolean`, default: `true`

Whether it needs to take of Three.JS rendering by setting up a renderer and a camera. If this is set to `true`, `config.scene.camera` and `config.scene.renderer` should not be provided

#### animate

`boolean`, default: `true`

Whether Simbol should start and control the render loop

#### sceneToLoad

`THREE.Scene|string`, **required**

Either a THREE.Scene to be added, or a path to the .gltf/.glb file containing the scene

#### canvas

`HTMLCanvasElement`

Canvas element where the scene will be rendered. This should only be provided if `config.scene.render` is `true`

#### renderer

`THREE.Renderer`

If you're rendering on your own, Simbol needs access to your renderer. This should only be provided if `config.scene.render` is `false`

#### camera

`THREE.Camera`

If you're rendering on your own, Simbol needs access to your camera. This should only be provided if `config.scene.render` is `false`

### virtualPersona

`object`

All configuration properties related to setting up the Virtual Persona

#### signIn

`boolean`, default: `true`

Whether Simbol should attempt to sign the person in on #init

### virtualPersona.multiVP

`object|boolean`

All configuration properties related to setting up the MultiVP component. This can be set to `false` if your site takes care of the multiuser experience

#### socketURL

`string`, default: `'ws://127.0.0.1'`

The URL to your WebSocket server

#### socketPort

`string|number`, default: `8091`

The port for your WebSocker server

#### channelName

`string`, default: `'default'`

The desired channel name to use for the WebRTC social experience

#### peer

`object`, default: `{trickle: true, objectMode: true}`

Configuration object for [simple-peer](https://github.com/feross/simple-peer#api)

### Example Configuration Object

```js
{
	hand: 'right',
	locomotion: true,
	virtualPersona: {
		signIn: false,
		multiVP: {
			socketURL: 'wss://yourdomain/ws',
			socketPort: '80',
			channelName: 'coolchannel',
			config: {
				iceServers: [
					{urls:'stun:stun.l.google.com:19302'},
					{urls:'stun:stun1.l.google.com:19302'},
					{
						urls: 'turn:yourdomain:7788',
						username: 'testname',
						credential: 'testpassword'
					}
				]
			}
		}
	},
	scene: {
		render: true,
		animate: true,
		canvas: document.querySelector('canvas'),
		sceneToLoad: 'path/to/cool/scene.gltf',
		renderer: new THREE.Renderer(), // Not necessary as render is true
		camera: new THREE.PerspectiveCamera() // Not necessary as render is true
	}
}
```

## Full API

You can check out the API in our [JSDoc](https://simbol.io/docs)

## Third party libraries

Currently, [simbol](https://simbol.io) is dependent on several third party libraries:

* [simple-peer](https://github.com/feross/simple-peer): Helper for WebRTC
* [Three.js](https://threejs.org): Most used WebGL library
* [Three.VRControls](https://github.com/mrdoob/three.js/blob/dev/examples/js/controls/VRControls.js): VR Controls helper from Three.JS
* [Three.VREffect](https://github.com/mrdoob/three.js/blob/dev/examples/js/effects/VREffect.js): WebVR helper to render to an HMD
* [three-bmfont-text](https://github.com/Jam3/three-bmfont-text): Three.JS helper to render text
* [WebVR Polyfill](https://github.com/googlevr/webvr-polyfill): Polyfill for mobile devices
* [uport-connect](https://github.com/uport-project/uport-connect): Underlying identity system that Virtual Personas is currently based on

## Contributing

Check out the [Contribution guide](https://github.com/wearesimbol/simbol/blob/master/CONTRIBUTING.md)! If you have any questions, join our [community](http://spectrum.chat/simbol)

## License

This program is free software and is distributed under an [MIT License](https://github.com/wearesimbol/simbol/blob/master/LICENSE).
