'use strict';

import EventEmitter from 'eventemitter3';
import * as THREE from 'three';
import { KeyboardController } from '../../src/controllers/keyboardcontroller';

describe('KeyboardController', () => {

    let keyboardController;

    beforeEach(() => {
		sinon.stub(document, 'addEventListener');

        keyboardController = new KeyboardController();
	});
	
	afterEach(() => {
		document.addEventListener.restore();
	});

	it('should be a class', () => {
		assert.isFunction(KeyboardController);
    });
    
    it('should have a set of methods', () => {
		assert.isFunction(KeyboardController.prototype._handleKeyDownEvent);
		assert.isFunction(KeyboardController.prototype._handleKeyUpEvent);
    });
    
    describe('constructor', () => {

		it('should extend EventEmitter', () => {
			assert.instanceOf(keyboardController, EventEmitter);
		});

		it('should add key event listeners', () => {
			assert.isTrue(document.addEventListener.calledTwice);
			assert.isTrue(document.addEventListener.firstCall.calledWith('keydown'));
			assert.isTrue(document.addEventListener.secondCall.calledWith('keyup'));
		});
	});
	
	describe('#_handleKeyDownEvent', () => {

		beforeEach(() => {
			sinon.stub(keyboardController, 'emit');
		});

		it('should move up', () => {
			keyboardController._handleKeyDownEvent({
				keyCode: 87
			});

			keyboardController._handleKeyDownEvent({
				keyCode: 38
			});

			assert.isTrue(keyboardController.emit.calledTwice);
			assert.deepEqual(keyboardController.emit.firstCall.args, ['ztranslationstart', {
				direction: -1
			}]);
			assert.deepEqual(keyboardController.emit.secondCall.args, ['ztranslationstart', {
				direction: -1
			}]);
        });

        it('should move down', () => {
			keyboardController._handleKeyDownEvent({
				keyCode: 83
			});

			keyboardController._handleKeyDownEvent({
				keyCode: 40
			});

			assert.isTrue(keyboardController.emit.calledTwice);
			assert.deepEqual(keyboardController.emit.firstCall.args, ['ztranslationstart', {
				direction: 1
			}]);
			assert.deepEqual(keyboardController.emit.secondCall.args, ['ztranslationstart', {
				direction: 1
			}]);
        });

        it('should move left', () => {
			keyboardController._handleKeyDownEvent({
				keyCode: 65
			});

			keyboardController._handleKeyDownEvent({
				keyCode: 37
			});

			assert.isTrue(keyboardController.emit.calledTwice);
			assert.deepEqual(keyboardController.emit.firstCall.args, ['xtranslationstart', {
				direction: -1
			}]);
			assert.deepEqual(keyboardController.emit.secondCall.args, ['xtranslationstart', {
				direction: -1
			}]);
        });

        it('should move right', () => {
			keyboardController._handleKeyDownEvent({
				keyCode: 68
			});

			keyboardController._handleKeyDownEvent({
				keyCode: 39
			});

			assert.isTrue(keyboardController.emit.calledTwice);
			assert.deepEqual(keyboardController.emit.firstCall.args, ['xtranslationstart', {
				direction: 1
			}]);
			assert.deepEqual(keyboardController.emit.secondCall.args, ['xtranslationstart', {
				direction: 1
			}]);
        });
	});

	describe('#_handleKeyUpEvent', () => {

		beforeEach(() => {
			sinon.stub(keyboardController, 'emit');
		});

		it('should stop moving in the Z axis', () => {
			keyboardController._handleKeyUpEvent({
				keyCode: 87
			});

			keyboardController._handleKeyUpEvent({
				keyCode: 38
			});

			keyboardController._handleKeyUpEvent({
				keyCode: 83
			});

			keyboardController._handleKeyUpEvent({
				keyCode: 40
			});

			assert.equal(keyboardController.emit.callCount, 4);
			assert.isTrue(keyboardController.emit.calledWith('ztranslationend'));
        });

        it('should moving in the X aix', () => {
			keyboardController._handleKeyUpEvent({
				keyCode: 65
			});

			keyboardController._handleKeyUpEvent({
				keyCode: 37
			});

			keyboardController._handleKeyUpEvent({
				keyCode: 68
			});

			keyboardController._handleKeyUpEvent({
				keyCode: 39
			});

			assert.equal(keyboardController.emit.callCount, 4);
			assert.isTrue(keyboardController.emit.calledWith('xtranslationend'));
        });
	});
});