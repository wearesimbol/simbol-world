# simbol

Create social virtual worlds that anyone can interact with using Virtual Personas, a self-sovereign identity.

## Quick Start

Install via [npm](https://npmjs.com) or [yarn](https://yarnpkg.com)

```
npm install --save simbol
yarn add simbol
```

And then import it using ES2015 Modules, CommonJS or with a `<script>` tag:

```
import * as simbol from 'simbol';
const simbol = require('simbol');
<script src="./node_modules/simbol/build/simbol.script.js"></script>
```

## Entities

The library provides a set of entities to help create your virtual world, the two most important ones being **Scene** and **VirtualPersona**

Here's the list:

### Scene

Imports a GLTF Scene and renders it to an HMD

### VirtualPersona

Imports a GLTF avatar model that could be your single identity to transverse the WebVR metaverse. Also provides movement and animation mechanics

### Physics

Possible small physics library

## API

You can check out the API in our [JSDoc](https://simbol.io/docs)

## Third party libraries

Currently, [simbol](https://simbol.io) is dependent on several third party libraries:

* [Three.js](https://threejs.org): Most used WebGL library
* [Three.VRControls](https://github.com/mrdoob/three.js/blob/dev/examples/js/controls/VRControls.js): VR Controls helper from Three.JS
* [Three.VREffect](https://github.com/mrdoob/three.js/blob/dev/examples/js/effects/VREffect.js): WebVR helper to render to an HMD
* [WebVR Polyfill](https://github.com/googlevr/webvr-polyfill): Polyfill for mobile devices
* [uport-connect](https://github.com/uport-project/uport-connect): Underlying identity system that Virtual Personas is currently based on
