'use strict';

import * as THREE from 'three';
import {Locomotion} from '../../src/locomotion/locomotion';
import {Teleportation} from '../../src/locomotion/_teleportation';
import {VirtualPersona} from '../../src/virtualpersona/virtualpersona';
import {Controllers} from '../../src/controllers/controllers';

describe('Locomotion', () => {

    let locomotion;
	let vp;

	beforeEach(() => {
		vp = {
			scene: {
				canvas: document.createElement('canvas'),
				addToScene: sinon.stub()
			}
		};
		Object.setPrototypeOf(vp, VirtualPersona.prototype);
		vp = Object.create(vp);

		sinon.stub(Locomotion.prototype, 'initKeyboardInput');
		sinon.stub(Locomotion.prototype, 'initMouseInput');
		sinon.stub(Locomotion.prototype, 'initTouchInput');
		sinon.stub(Locomotion.prototype, 'initGamepadInputs');

		locomotion = new Locomotion(vp);
	});

	afterEach(() => {
		Locomotion.prototype.initKeyboardInput.restore && Locomotion.prototype.initKeyboardInput.restore();
		Locomotion.prototype.initMouseInput.restore && Locomotion.prototype.initMouseInput.restore();
		Locomotion.prototype.initTouchInput.restore && Locomotion.prototype.initTouchInput.restore();
		Locomotion.prototype.initGamepadInputs.restore && Locomotion.prototype.initGamepadInputs.restore();
	});

	it('should be a class', () => {
		assert.isFunction(Locomotion);
	});

	it('should have a set of methods', () => {
		assert.isFunction(Locomotion.prototype.translateZ);
		assert.isFunction(Locomotion.prototype.translateX);
		assert.isFunction(Locomotion.prototype.stopTranslateZ);
		assert.isFunction(Locomotion.prototype.stopTranslateX);
		assert.isFunction(Locomotion.prototype.translateTo);
		assert.isFunction(Locomotion.prototype._handleKeyDownEvent);
		assert.isFunction(Locomotion.prototype._handleKeyUpEvent);
		assert.isFunction(Locomotion.prototype.initKeyboardInput);
		assert.isFunction(Locomotion.prototype._moveHandler);
		assert.isFunction(Locomotion.prototype._handlePointerLockChange);
		assert.isFunction(Locomotion.prototype._pointerLock);
		assert.isFunction(Locomotion.prototype._handleTeleportation);
		assert.isFunction(Locomotion.prototype._handleClick);
		assert.isFunction(Locomotion.prototype.initMouseInput);
		assert.isFunction(Locomotion.prototype.initTouchInput);
		assert.isFunction(Locomotion.prototype.initGamepadInputs);
	});

	it('should have a set of properties', () => {
		assert.equal(Locomotion.prototype.velocity, 1.5);
		assert.equal(Locomotion.prototype.angularVelocity, 1);
		assert.deepEqual(Locomotion.prototype.currentRotation, new THREE.Vector2());
		assert.equal(Locomotion.prototype.translatingZ, false);
		assert.equal(Locomotion.prototype.translatingX, false);
		assert.deepEqual(Locomotion.prototype.orientation, {
			quaternion: new THREE.Quaternion(),
			euler: new THREE.Euler()
		});
	});

	describe('#constructor', () => {

		it('should set some properties', () => {
			assert.equal(locomotion._phi, 0);
			assert.equal(locomotion._theta, 0);
			assert.equal(locomotion._canvas, vp.scene.canvas);
			assert.equal(locomotion.scene, vp.scene);
			assert.equal(locomotion.virtualPersona, vp);
		});

        it('should initialise inputs', () => {
            assert.isTrue(locomotion.initKeyboardInput.calledOnce);
			assert.isTrue(locomotion.initMouseInput.calledOnce);
			assert.isTrue(locomotion.initTouchInput.calledOnce);
            assert.isTrue(locomotion.initGamepadInputs.calledOnce);
        });

		it('should initialise Teleportation', () => {
			assert.instanceOf(locomotion.teleportation, Teleportation)
			assert.equal(locomotion.teleportation.scene, vp.scene);
		});

		xdescribe('no VirtualPersona provided', () => {

			let error;

			beforeEach(() => {

                try {
                   new Locomotion(); 
                } catch (e) {
					error = e;
				}
			});

			it('should throw an error', () => {
				assert.equal(error, 'A VirtualPersona is required');
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

	describe('#translateTo', () => {

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
			Locomotion.prototype.initKeyboardInput.restore();
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
			locomotion.teleportation.setRayCurveState = sinon.stub();

			locomotion._handleTeleportation();
		});
		
		it('should activate the ray curve', () => {
			assert.isTrue(locomotion.teleportation.setRayCurveState.calledOnce);
			assert.isTrue(locomotion.teleportation.setRayCurveState.calledWith(true));
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
			Locomotion.prototype.initMouseInput.restore();
			sinon.stub(document, 'addEventListener');
			canvas = vp.scene.canvas;
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
			Locomotion.prototype.initTouchInput.restore();
			locomotion._canvas = vp.scene.canvas;
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
			Locomotion.prototype.initGamepadInputs.restore();
			sinon.stub(window, 'addEventListener');

			locomotion.initGamepadInputs();
		});

		afterEach(() => {
			window.addEventListener.restore();
		});

		it('should set controllers', () => {
			assert.instanceOf(locomotion.controllers, Controllers);
		});

		it('should set event handlers for gamepad', () => {
			assert.isTrue(window.addEventListener.calledTwice);
			assert.isTrue(window.addEventListener.calledWith('gamepadconnected'));
			assert.isTrue(window.addEventListener.calledWith('gamepaddisconnected'));
		});
	});
});
