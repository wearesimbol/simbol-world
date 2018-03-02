'use strict';

import EventEmitter from 'eventemitter3';
import * as THREE from 'three';
import { PointerController } from '../../src/controllers/pointercontroller';
import { Utils } from '../../src/utils/utils';

describe('PointerController', () => {

    let pointerController;
    let canvas = document.createElement('canvas');

    beforeEach(() => {
		sinon.stub(canvas, 'addEventListener');
		sinon.stub(document, 'addEventListener');

        pointerController = new PointerController(canvas);
	});
	
	afterEach(() => {
		canvas.addEventListener.restore();
		document.addEventListener.restore();
	});

	it('should be a class', () => {
		assert.isFunction(PointerController);
    });
    
    it('should have a set of methods', () => {
		assert.isFunction(PointerController.prototype._handleTouchStart);
		assert.isFunction(PointerController.prototype._moveHandler);
		assert.isFunction(PointerController.prototype._handleClick);
		assert.isFunction(PointerController.prototype._handlePointerLockChange);
		assert.isFunction(PointerController.prototype._pointerLock);
	});

	it('should have a set of properties', () => {
        assert.instanceOf(PointerController.prototype.rotation, THREE.Vector2);
	});
    
    describe('constructor', () => {

		it('should set some properties', () => {
			assert.equal(pointerController._phi, 0);
			assert.equal(pointerController._theta, 0);
			assert.equal(pointerController._canvas, canvas);
		});

		it('should set up pointer events', () => {
			assert.equal(canvas.addEventListener.callCount, 4);
			assert.isTrue(canvas.addEventListener.getCall(0).calledWith('click'));
			assert.isTrue(canvas.addEventListener.getCall(1).calledWith('touchstart'));
			assert.isTrue(canvas.addEventListener.getCall(2).calledWith('touchend'));
			assert.isTrue(canvas.addEventListener.getCall(3).calledWith('touchmove', pointerController._moveHandler));
			assert.isTrue(document.addEventListener.calledOnce);
			assert.isTrue(document.addEventListener.calledWith('pointerlockchange'));
		});

		it('should initialize EventEmitter', () => {
			assert.instanceOf(pointerController.__proto__, EventEmitter);
		});
    });

    describe('#_handleTouchStart', () => {

		let event;

		beforeEach(() => {
			sinon.stub(pointerController, 'emit');

			event = {
				touches: [{
						pageX: 1,
						pageY: 2
				}],
				timeStamp: 1000
			};

			pointerController.rotation = {
				set: sinon.stub()
			};
		});

		describe('many touches', () => {

			beforeEach(() => {
				event.touches.push(1);

				pointerController._handleTouchStart(event);
			});

			afterEach(() => {
				event.touches.pop();
			});

			it('should return if there are more than 1 touches', () => {
				assert.isFalse(pointerController.rotation.set.calledOnce);
			});
		});

		describe('one touch', () => {

			describe('double touch', () => {

				beforeEach(() => {
					pointerController._lastTouch = 900;

					pointerController._handleTouchStart(event);
				});

				it('should set rotation', () => {
					assert.isTrue(pointerController.rotation.set.calledOnce);
					assert.isTrue(pointerController.rotation.set.calledWith(1, 2));
				});

				it('should emit ztranslationstart', () => {
					assert.isTrue(pointerController.emit.calledOnce);
					assert.equal(pointerController.emit.firstCall.args[0], 'ztranslationstart');
					assert.deepEqual(pointerController.emit.firstCall.args[1], {direction: -1});
				});
			});

			describe('Cardboard presenting', () => {

				beforeEach(() => {
					Utils.isPresenting = true;

					pointerController._handleTouchStart(event);
				});

				afterEach(() => {
					Utils.isPresenting = false;
				});

				it('should emit ztranslationstart', () => {
					assert.isTrue(pointerController.emit.calledOnce);
					assert.equal(pointerController.emit.firstCall.args[0], 'ztranslationstart');
					assert.deepEqual(pointerController.emit.firstCall.args[1], {direction: -1});
				});
			});

			describe('single touch', () => {

				beforeEach(() => {
					pointerController._lastTouch = 1500;

					pointerController._handleTouchStart(event);
				});

				it('should save lastTouch', () => {
					assert.equal(pointerController._lastTouch, 1000);
				});
			});
		});
	});

	describe('#_moveHandler', () => {

		beforeEach(() => {
			sinon.stub(pointerController, 'emit');

			const event = {
				movementX: 2,
				movementY: 3
			};
			// Some bug in the tests keeps the rotation property
			// from instance to instance of pointerController
			pointerController.rotation = new THREE.Vector2();

			pointerController._moveHandler(event);
		});

		it('should set rotation to the new rotation', () => {
			assert.equal(pointerController.rotation.x, -2);
			assert.equal(pointerController.rotation.y, -3);
		});

		it('should emit orientation event', () => {
			assert.isTrue(pointerController.emit.calledOnce);
			assert.equal(pointerController.emit.firstCall.args[0], 'orientation');
			assert.deepEqual(pointerController.emit.firstCall.args[1], {
				rotation: new THREE.Vector2(-2, -3)
			});
		});
    });
    
    describe('#_handleClick', () => {
		describe('handle pointer lock', () => {

			let event;

			beforeEach(() => {
				event = {};
				sinon.stub(pointerController, '_pointerLock');

				pointerController._handleClick(event);
			});

			afterEach(() => {
				pointerController._pointerLock.restore();
			});

			it('should lock the pointer', () => {
				assert.isTrue(pointerController._pointerLock.calledOnce);
				assert.isTrue(pointerController._pointerLock.calledWith(event));
			});
		});

		// Can't test as document.pointerLockElement is readonly
		xdescribe('pointer is locked', () => {

			beforeEach(() => {
				sinon.stub(pointerController, 'emit');

				document.pointerLockElement = true;

				pointerController._handleClick();
			});

			it('should emit trigger', () => {
				assert.isTrue(pointerController.emit.calledOnce);
				assert.isTrue(pointerController.emit.calledWith('trigger'));
			});
		});
	});

	describe('_handlePointerLockChange', () => {

		describe('pointer locked', () => {

			beforeEach(() => {
				pointerController._canvas = document.pointerLockElement;

				pointerController._handlePointerLockChange();
			});

			it('should add mousemove handler', () => {
				// Also called in constructor
				assert.isTrue(document.addEventListener.calledTwice);
				assert.isTrue(document.addEventListener.secondCall.calledWith('mousemove', pointerController._moveHandler));
			});
		});

		describe('pointer not locked', () => {

			beforeEach(() => {
				sinon.stub(document, 'removeEventListener');

				pointerController._handlePointerLockChange();
			});

			afterEach(() => {
				document.removeEventListener.restore();
			});

			it('should remove mousemove handler', () => {
				assert.isTrue(document.removeEventListener.calledOnce);
				assert.isTrue(document.removeEventListener.calledWith('mousemove', pointerController._moveHandler));
			});
		});
	});

	describe('#_pointerLock', () => {
		
		let canvas;

		beforeEach(() => {
			event = {
				clientX: 1,
				clientY: 2
			};
			canvas = {
				requestPointerLock: sinon.stub()
			};

			pointerController._canvas = canvas;
			pointerController.rotation = {
				set: sinon.stub()
			};

			pointerController._pointerLock(event);
		});

		it('should lock the pointer', () => {
			assert.isTrue(canvas.requestPointerLock.calledOnce);
			assert.isTrue(pointerController.rotation.set.calledOnce);
			assert.isTrue(pointerController.rotation.set.calledWith(1, 2));
		});
	});
});