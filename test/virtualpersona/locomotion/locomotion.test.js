'use strict';

import * as THREE from 'three';
import {Locomotion} from '../../../src/virtualpersona/locomotion/locomotion';
import {Teleportation} from '../../../src/virtualpersona/locomotion/_teleportation';
import {VirtualPersona} from '../../../src/virtualpersona/virtualpersona';
import {Controllers} from '../../../src/virtualpersona/controllers/controllers';

describe('Locomotion', () => {

    let locomotion;
	let vp;

	before(() => {
		sinon.stub(VirtualPersona);
		vp = Object.create(VirtualPersona);
		vp.scene = {
			renderer: {
				domElement: document.createElement('canvas')
			}
		};
	});

	after(() => {
		for (let property in VirtualPersona) {
			if (typeof VirtualPersona[property] === 'function') {
				VirtualPersona[property].restore();
			}
		}
	});

	beforeEach(() => {
		locomotion = Object.create(Locomotion);
	});

	it('should be an object', () => {
		assert.isObject(Locomotion);
	});

	it('should have a set of methods', () => {
		assert.isFunction(Locomotion.init);
		assert.isFunction(Locomotion.translateZ);
		assert.isFunction(Locomotion.translateX);
		assert.isFunction(Locomotion.stopTranslateZ);
		assert.isFunction(Locomotion.stopTranslateX);
		assert.isFunction(Locomotion.translateTo);
		assert.isFunction(Locomotion._handleKeyDownEvent);
		assert.isFunction(Locomotion._handleKeyUpEvent);
		assert.isFunction(Locomotion.initKeyboardInput);
		assert.isFunction(Locomotion._moveHandler);
		assert.isFunction(Locomotion._handlePointerLockChange);
		assert.isFunction(Locomotion._pointerLock);
		assert.isFunction(Locomotion._handleTeleportation);
		assert.isFunction(Locomotion._handleClick);
		assert.isFunction(Locomotion.initMouseInput);
	});

	it('should have a set of properties', () => {
		assert.equal(Locomotion.velocity, 1.5);
		assert.equal(Locomotion.angularVelocity, 1);
		assert.equal(Locomotion._phi, 0);
		assert.equal(Locomotion._theta, 0);
		assert.deepEqual(Locomotion.currentRotation, new THREE.Vector2());
		assert.equal(Locomotion.translatingZ, false);
		assert.equal(Locomotion.translatingX, false);
		assert.deepEqual(Locomotion.orientation, {
			quaternion: new THREE.Quaternion(),
			euler: new THREE.Euler()
		});
	});

	describe('#init', () => {

		beforeEach(() => {
			sinon.stub(Teleportation, 'init');

			locomotion.initKeyboardInput = sinon.stub();
			locomotion.initMouseInput = sinon.stub();
			locomotion.initTouchInput = sinon.stub();
            locomotion.initGamepadInputs = sinon.stub();

			locomotion.init(vp);
		});

		afterEach(() => {
			Teleportation.init.restore();
		});

		it('should save the canvas', () => {
			assert.equal(locomotion._canvas, vp.scene.renderer.domElement);
		});

        it('should initialise inputs', () => {
            assert.isTrue(locomotion.initKeyboardInput.calledOnce);
			assert.isTrue(locomotion.initMouseInput.calledOnce);
			assert.isTrue(locomotion.initTouchInput.calledOnce);
            assert.isTrue(locomotion.initGamepadInputs.calledOnce);
        });

		it('should initialise Teleportation', () => {
			assert.isTrue(Teleportation.isPrototypeOf(locomotion.teleportation))
			assert.isTrue(locomotion.teleportation.init.calledOnce);
			assert.isTrue(Teleportation.init.calledWith(vp.scene));
		});

		describe('no VirtualPersona provided', () => {

			beforeEach(() => {
                sinon.spy(locomotion, 'init');

                try {
                   locomotion.init(); 
                } catch (e) {}
			});

			afterEach(() => {
				locomotion.init.restore();
			})

			it('should throw an error', () => {
				assert.isTrue(locomotion.init.threw('A VirtualPersona is required'));
			});
		});
	});
	
	describe('#translateZ', () => {

		beforeEach(() => {
			locomotion.translateZ(2);
		});

		it('should set translatingZ', () => {
			assert.equal(locomotion.translatingZ, 2);
		});
	});

	describe('#translateX', () => {

		beforeEach(() => {
			locomotion.translateX(2);
		});

		it('should set translatingX', () => {
			assert.equal(locomotion.translatingX, 2);
		});
	});

	describe('#stopTranslateZ', () => {

		beforeEach(() => {
			locomotion.stopTranslateZ();
		});

		it('should set translatingZ to false', () => {
			assert.isFalse(locomotion.translatingZ);
		});
	});

	describe('#stopTranslateX', () => {

		beforeEach(() => {
			locomotion.stopTranslateX();
		});

		it('should set translatingX to false', () => {
			assert.isFalse(locomotion.translatingX);
		});
	});

	describe('#_handleKeyDownEvent', () => {

		beforeEach(() => {
			locomotion.translateZ = sinon.spy();
			locomotion.translateX = sinon.spy();
		});

		it('should move up', () => {
			locomotion._handleKeyDownEvent({
				keyCode: 87
			});

			locomotion._handleKeyDownEvent({
				keyCode: 38
			});

			assert.isTrue(locomotion.translateZ.calledTwice);
			assert.isTrue(locomotion.translateZ.calledWith(-1.5));
        });

        it('should move down', () => {
			locomotion._handleKeyDownEvent({
				keyCode: 83
			});

			locomotion._handleKeyDownEvent({
				keyCode: 40
			});

			assert.isTrue(locomotion.translateZ.calledTwice);
			assert.isTrue(locomotion.translateZ.calledWith(1.5));
        });

        it('should move left', () => {
			locomotion._handleKeyDownEvent({
				keyCode: 65
			});

			locomotion._handleKeyDownEvent({
				keyCode: 37
			});

			assert.isTrue(locomotion.translateX.calledTwice);
			assert.isTrue(locomotion.translateX.calledWith(-1.5));
        });

        it('should move right', () => {
			locomotion._handleKeyDownEvent({
				keyCode: 68
			});

			locomotion._handleKeyDownEvent({
				keyCode: 39
			});

			assert.isTrue(locomotion.translateX.calledTwice);
			assert.isTrue(locomotion.translateX.calledWith(1.5));
        });
	});

	describe('#_handleKeyUpEvent', () => {

		beforeEach(() => {
			locomotion.stopTranslateZ = sinon.spy();
			locomotion.stopTranslateX = sinon.spy();
		});

		it('should stop moving in the Z axis', () => {
			locomotion._handleKeyUpEvent({
				keyCode: 87
			});

			locomotion._handleKeyUpEvent({
				keyCode: 38
			});

			locomotion._handleKeyUpEvent({
				keyCode: 83
			});

			locomotion._handleKeyUpEvent({
				keyCode: 40
			});

			assert.equal(locomotion.stopTranslateZ.callCount, 4);
        });

        it('should move left', () => {
			locomotion._handleKeyUpEvent({
				keyCode: 65
			});

			locomotion._handleKeyUpEvent({
				keyCode: 37
			});

			locomotion._handleKeyUpEvent({
				keyCode: 68
			});

			locomotion._handleKeyUpEvent({
				keyCode: 39
			});

			assert.equal(locomotion.stopTranslateX.callCount, 4);
        });
	});

	describe('#initKeyboardInput', () => {

        beforeEach(() => {
			sinon.spy(document, 'addEventListener');

			locomotion.initKeyboardInput();
		});

        afterEach(() => {
            document.addEventListener.restore();
        });

		it('should listen to keydown event', () => {
			assert.isTrue(document.addEventListener.calledTwice);
			assert.isTrue(document.addEventListener.calledWith('keydown'));
			assert.isTrue(document.addEventListener.calledWith('keyup'));
		});
	});

	describe('#_moveHandler', () => {

		beforeEach(() => {
			locomotion.teleportation = {
				hitPoint: true,
				activateTeleport: sinon.stub()
			}
			const event = {
				movementX: 2,
				movementY: 3
			};

			locomotion._moveHandler(event);
		});

		it('should set currentRotation to the new rotation', () => {
			const rotation = new THREE.Vector2();
			rotation.set(-2, -3, 0);
			assert.equal(locomotion.currentRotation.x, rotation.x);
			assert.equal(locomotion.currentRotation.y, rotation.y);
			assert.equal(locomotion.currentRotation.z, rotation.z);
		});

		it('should calculate phi', () => {
			assert.equal(locomotion._phi, -0.031415926535897934);
		});

		it('should calculate theta', () => {
			assert.equal(locomotion._theta, -0.015707963267948967);
		});

		it('should set orientation values', () => {
			assert.deepEqual(locomotion.orientation.euler.toArray(), [-0.031415926535897934, -0.015707963267948967, 0, 'YXZ']);
			assert.deepEqual(locomotion.orientation.quaternion.toArray(), [-0.015706832861160744, -0.00785293197244941, -0.00012336371339457934, 0.999845793931395]);
		});

		it('should activate teleportation if there is a hitpoint', () => {
			assert.isTrue(locomotion.teleportation.activateTeleport.calledOnce);
		});
	});

	describe('_handlePointerLockChange', () => {

		describe('pointer locked', () => {

			beforeEach(() => {
				sinon.stub(document, 'addEventListener');
				locomotion._canvas = document.pointerLockElement;

				locomotion._handlePointerLockChange();
			});

			afterEach(() => {
				document.addEventListener.restore();
			});

			it('should add mousemove handler', () => {
				assert.isTrue(document.addEventListener.calledOnce);
				assert.isTrue(document.addEventListener.calledWith('mousemove', locomotion._moveHandler));
			});
		});

		describe('pointer not locked', () => {

			beforeEach(() => {
				sinon.stub(document, 'removeEventListener');
				locomotion.teleportation = {
					resetTeleport: sinon.stub()
				};

				locomotion._handlePointerLockChange();
			});

			afterEach(() => {
				document.removeEventListener.restore();
			});

			it('should remove mousemove handler', () => {
				assert.isTrue(locomotion.teleportation.resetTeleport.calledOnce);
				assert.isTrue(document.removeEventListener.calledOnce);
				assert.isTrue(document.removeEventListener.calledWith('mousemove', locomotion._moveHandler));
			})
		});
	});

	describe('#_pointerLock', () => {
		
		let canvas;

		beforeEach(() => {
			canvas = {
				requestPointerLock: sinon.stub()
			};

			locomotion._canvas = canvas;
		});

		describe('pointer not locked', () => {

			let event;

			beforeEach(() => {
				event = {
					clientX: 1,
					clientY: 2
				};
				locomotion.currentRotation = {
					set: sinon.stub()
				};
				locomotion._pointerLock(event);
			});

			it('should lock the pointer', () => {
				assert.isTrue(canvas.requestPointerLock.calledOnce);
				assert.isTrue(locomotion.currentRotation.set.calledOnce);
				assert.isTrue(locomotion.currentRotation.set.calledWith(1, 2));
			});
		});
	});

	describe('#_handleTeleportation', () => {

		beforeEach(() => {
			sinon.stub(Teleportation, 'setRayCurveState');
			locomotion.teleportation = Object.create(Teleportation);

			locomotion._handleTeleportation();
		});

		afterEach(() => {
			Teleportation.setRayCurveState.restore();
		});
		
		it('should activate the ray curve', () => {
			assert.isTrue(Teleportation.setRayCurveState.calledOnce);
			assert.isTrue(Teleportation.setRayCurveState.calledWith(true));
		});
	});

	describe('#_handleClick', () => {
		describe('handle pointer lock', () => {

			let event;

			beforeEach(() => {
				event = {};
				sinon.stub(locomotion, '_pointerLock');

				locomotion._handleClick(event);
			});

			afterEach(() => {
				locomotion._pointerLock.restore();
			});

			it('should lock the pointer', () => {
				assert.isTrue(locomotion._pointerLock.calledOnce);
				assert.isTrue(locomotion._pointerLock.calledWith(event));
			});
		});

		// Can't test as document.pointerLockElement is readonly
		xdescribe('handle teleportation', () => {

			beforeEach(() => {
				document.pointerLockElement = true;
				locomotion.teleportation = {
					isRayCurveActive: false,
					resetTeleport: sinon.stub()
				};
				sinon.stub(locomotion, '_handleTeleportation');

				locomotion._handleClick();
			});

			afterEach(() => {
				locomotion._handleTeleportation.restore();
			});

			describe('rayCurve active', () => {

				beforeEach(() => {
					locomotion.teleportation.isRayCurveActive = true;

					locomotion._handleClick();
				});

				it('should reset teleportation', () => {
					assert.isFalse(locomotion.teleportation.resetTeleport.calledOnce);
				});
			});

			describe('rayCurve inactive', () => {

				beforeEach(() => {
					locomotion._handleClick();
				});

				it('should handle teleportation', () => {
					assert.isFalse(locomotion._handleTeleportation.calledOnce);
				});
			});
		});
	});

	describe('#initMouseInput', () => {

		let canvas;

		beforeEach(() => {
			sinon.stub(document, 'addEventListener');
			canvas = vp.scene.renderer.domElement;
			sinon.stub(canvas, 'addEventListener');

			locomotion._canvas = canvas;
			
			locomotion.initMouseInput();
		});

		afterEach(() => {
			document.addEventListener.restore();
			canvas.addEventListener.restore();
		});

		it('should add a handler to the pointerlockchange event', () => {
			assert.isTrue(document.addEventListener.calledOnce);
			assert.isTrue(document.addEventListener.calledWith('pointerlockchange'));
		});

		it('should add a handler to the click event on the canvas', () => {
			assert.isTrue(canvas.addEventListener.calledOnce);
			assert.isTrue(canvas.addEventListener.calledWith('click'));
		});
	});

	xdescribe('#translateTo', () => {

		let newPosition;

		beforeEach(() => {
			newPosition = [1, 1, 1];

			vp.scene.camera = {
				position: {
					set: sinon.stub()
				}
			};
			locomotion.virtualPersona = vp;

			locomotion.translateTo(newPosition);
		});

		it('should set position of the first person camera', () => {
			assert.isTrue(vp.scene.camera.position.set.calledOnce);
			assert.isTrue(vp.scene.camera.position.set.calledWith(...newPosition));
		});
	});

	describe('#_handleTouchStart', () => {

		let event;

		beforeEach(() => {
			event = {
				touches: [{
						pageX: 1,
						pageY: 2
				}],
				timeStamp: 1000
			};

			locomotion.scene = {
				vrEffect: {
					isPresenting: false
				}
			};

			locomotion.virtualPersona = {
				interactions: {
					selection: {
						isHovering: false
					}
				}
			};

			sinon.stub(locomotion, 'translateZ');
			locomotion.currentRotation = {
				set: sinon.stub()
			};
		});

		afterEach(() => {
			locomotion.translateZ.restore();
		});

		describe('many touches', () => {

			beforeEach(() => {
				event.touches.push(1);

				locomotion._handleTouchStart(event);
			});

			afterEach(() => {
				event.touches.pop();
			});

			it('should return if there are more than 1 touches', () => {
				assert.isFalse(locomotion.currentRotation.set.calledOnce);
			});
		});

		describe('one touch', () => {

			describe('double touch', () => {

				beforeEach(() => {
					locomotion._lastTouch = 900;

					locomotion._handleTouchStart(event);
				});

				it('should set currentRotation', () => {
					assert.isTrue(locomotion.currentRotation.set.calledOnce);
					assert.isTrue(locomotion.currentRotation.set.calledWith(1, 2));
				});

				it('should translateZ', () => {
					assert.isTrue(locomotion.translateZ.calledOnce);
					assert.isTrue(locomotion.translateZ.calledWith(-1.5));
				});
			});

			describe('Cardboard presenting', () => {

				beforeEach(() => {
					locomotion.scene.vrEffect.isPresenting = true;

					locomotion._handleTouchStart(event);
				});

				it('should translateZ', () => {
					assert.isTrue(locomotion.translateZ.calledOnce);
					assert.isTrue(locomotion.translateZ.calledWith(-1.5));
				});
			});

			describe('single touch', () => {

				beforeEach(() => {
					locomotion._lastTouch = 1500;

					locomotion._handleTouchStart(event);
				});

				it('should save lastTouch', () => {
					assert.equal(locomotion._lastTouch, 1000);
				});
			});
		});
	});

	describe('#initTouchInput', () => {

		beforeEach(() => {
			locomotion._canvas = vp.scene.renderer.domElement;
			sinon.stub(locomotion._canvas, 'addEventListener');

			locomotion.initTouchInput();
		});

		afterEach(() => {
			locomotion._canvas.addEventListener.restore();
		});

		it('should set touch listeners', () => {
			assert.isTrue(locomotion._canvas.addEventListener.calledThrice);
			assert.isTrue(locomotion._canvas.addEventListener.firstCall.calledWith('touchstart'));
			assert.isTrue(locomotion._canvas.addEventListener.secondCall.calledWith('touchend'));
			assert.isTrue(locomotion._canvas.addEventListener.thirdCall.calledWith('touchmove', locomotion._moveHandler));
		});
	});

	describe('#_handleGamepadConnected', () => {

		let event;

		beforeEach(() => {
			event = {};
			locomotion.controllers = {
				updateControllers: sinon.stub()
			};

			locomotion._handleGamepadConnected(event);
		});

		it('should update controllers', () => {
			assert.isTrue(locomotion.controllers.updateControllers.calledOnce);
			assert.isTrue(locomotion.controllers.updateControllers.calledWith(event, true));
		});
	});

	describe('#_handleGamepadDisconnected', () => {

		let event;

		beforeEach(() => {
			event = {};
			locomotion.controllers = {
				updateControllers: sinon.stub()
			};

			locomotion._handleGamepadDisconnected(event);
		});

		it('should update controllers', () => {
			assert.isTrue(locomotion.controllers.updateControllers.calledOnce);
			assert.isTrue(locomotion.controllers.updateControllers.calledWith(event, false));
		});
	});

	describe('#initGamepadInputs', () => {

		beforeEach(() => {
			sinon.stub(Controllers, 'init');
			sinon.stub(window, 'addEventListener');

			locomotion.initGamepadInputs();
		});

		afterEach(() => {
			Controllers.init.restore();
			window.addEventListener.restore();
		});

		it('should set controllers', () => {
			assert.isTrue(Controllers.isPrototypeOf(locomotion.controllers));
			assert.isTrue(Controllers.init.calledOnce);
			assert.isTrue(Controllers.init.calledWith(locomotion));
		});

		it('should set event handlers for gamepad', () => {
			assert.isTrue(window.addEventListener.calledTwice);
			assert.isTrue(window.addEventListener.calledWith('gamepadconnected'));
			assert.isTrue(window.addEventListener.calledWith('gamepaddisconnected'));
		});
	});
});
