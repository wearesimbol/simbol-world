'use strict';

import * as THREE from 'three';
import EventEmitter from 'eventemitter3';
import {Controllers} from '../../src/controllers/controllers';
import {PoseController} from '../../src/controllers/posecontroller';

describe('PoseController', () => {

	let poseController;
	let gamepad;
	let mesh;
	let handMesh;

	beforeEach(() => {
		mesh = new THREE.Mesh();
		mesh.parent = new THREE.Object3D();
		handMesh = new THREE.Mesh();
		handMesh.name = 'VirtualPersonaHandLeft';
		mesh.add(handMesh);
		mesh.animations = [];
		sinon.stub(THREE.Quaternion.prototype, 'fromArray');
		sinon.stub(PoseController.prototype, 'renameAnimations');
		sinon.stub(PoseController.prototype, 'setGesture');
		gamepad = {
			id: 'test',
			hand: 'left',
			pose: {
				orientation: 1
			}
		};

		poseController = new PoseController(gamepad, mesh);
	});

	afterEach(() => {
		THREE.Quaternion.prototype.fromArray.restore();
		PoseController.prototype.renameAnimations.restore && PoseController.prototype.renameAnimations.restore();
		PoseController.prototype.setGesture.restore && PoseController.prototype.setGesture.restore();
	});

	it('should be a class', () => {
		assert.isFunction(PoseController);
	});

	it('should have a set of methods', () => {
		assert.isFunction(PoseController.prototype.renameAnimations);
		assert.isFunction(PoseController.prototype.getGestureName);
		assert.isFunction(PoseController.prototype.determineGesture);
		assert.isFunction(PoseController.prototype.setGesture);
		assert.isFunction(PoseController.prototype.update);
	});

	it('should have a set of properties', () => {
		assert.deepEqual(PoseController.prototype.pressedButtons, {});
		assert.deepEqual(PoseController.prototype.touchedButtons, {});
	});

	describe('#constructor', () => {

		it('should extend EventEmitter', () => {
			assert.instanceOf(poseController, EventEmitter);
		});

		it('should set some properties', () => {
			assert.equal(poseController.id, 'test (left)');
			assert.equal(poseController.hand, 'left');
			assert.equal(poseController.gamepadId, 'test');
			assert.instanceOf(poseController.quaternion, THREE.Quaternion);
			assert.instanceOf(poseController.euler, THREE.Euler);
			assert.instanceOf(poseController.position, THREE.Vector3);
		});

		it('should set initial values', () => {
			assert.isTrue(THREE.Quaternion.prototype.fromArray.calledOnce);
			assert.isTrue(THREE.Quaternion.prototype.fromArray.calledWith(1));
			assert.deepEqual(poseController.position.toArray(), [0, -0.015, 0.05]);
		});

		it('should save hand mesh', () => {
			assert.equal(poseController.vpMesh, mesh);
			assert.equal(poseController.handMesh, handMesh);
		});

		it('should handle animations', () => {
			assert.isTrue(poseController.renameAnimations.calledOnce);
			assert.instanceOf(poseController._animationMixer, THREE.AnimationMixer);
			assert.isTrue(poseController.setGesture.calledOnce);
			assert.isTrue(poseController.setGesture.calledWith('Open'));
		})
	});

	describe('#renameAnimations', () => {

		beforeEach(() => {
			poseController.renameAnimations.restore();
			poseController.vpMesh.animations.push({name: 'test-HandLeftOpen'}, {name: 'testingloool_HandLeftThumb'});

			poseController.renameAnimations();
		});

		it('should have renamed animations properly', () => {
			assert.equal(poseController.vpMesh.animations[0].name, 'HandLeftOpen');
			assert.equal(poseController.vpMesh.animations[1].name, 'HandLeftThumb');
		});
	});

	describe('#getGestureName', () => {

		let gesture;

		beforeEach(() => {
			gesture = poseController.getGestureName('Okay');
		});

		it('should add correct prefixes to gesture name', () => {
			assert.equal(gesture, 'HandLeftOkay');
		});
	});

	describe('#determineGesture', () => {

		let gesture;

		beforeEach(() => {
			poseController.pressedButtons = [];
			poseController.touchedButtons = [];
		});

		describe('open', () => {

			beforeEach(() => {
				gesture = poseController.determineGesture();
			});

			it('should determine correct gesture', () => {
				assert.equal(gesture, 'Open');
			});
		});

		describe('fist1', () => {

			beforeEach(() => {
				poseController.pressedButtons['Grip'] = true;
				poseController.touchedButtons['Thumbpad'] = true;
				poseController.touchedButtons['Trigger'] = true;

				gesture = poseController.determineGesture();
			});

			it('should determine correct gesture', () => {
				assert.equal(gesture, 'Fist');
			});
		});

		describe('fist2', () => {

			beforeEach(() => {
				poseController.touchedButtons['Trigger'] = true;

				gesture = poseController.determineGesture();
			});

			it('should determine correct gesture', () => {
				assert.equal(gesture, 'Fist');
			});
		});

		describe('point', () => {

			beforeEach(() => {
				poseController.pressedButtons['Grip'] = true;
				poseController.touchedButtons['Thumbpad'] = true;

				gesture = poseController.determineGesture();
			});

			it('should determine correct gesture', () => {
				assert.equal(gesture, 'Point');
			});
		});

		describe('thumb', () => {

			beforeEach(() => {
				poseController.pressedButtons['Grip'] = true;
				poseController.touchedButtons['Trigger'] = true;

				gesture = poseController.determineGesture();
			});

			it('should determine correct gesture', () => {
				assert.equal(gesture, 'Thumb');
			});
		});

		describe('thumbpoint', () => {

			beforeEach(() => {
				poseController.pressedButtons['Grip'] = true;

				gesture = poseController.determineGesture();
			});

			it('should determine correct gesture', () => {
				assert.equal(gesture, 'ThumbPoint');
			});
		});

		describe('okay', () => {

			beforeEach(() => {
				poseController.touchedButtons['Thumbpad'] = true;
				poseController.touchedButtons['Trigger'] = true;

				gesture = poseController.determineGesture();
			});

			it('should determine correct gesture', () => {
				assert.equal(gesture, 'Okay');
			});
		});
	});

	describe('#setGesture', () => {

		let clipAction;
		let previousAction;

		beforeEach(() => {
			poseController.setGesture.restore();

			sinon.stub(poseController, 'emit');
			sinon.stub(poseController, 'getGestureName');
			sinon.stub(poseController._animationMixer, 'clipAction');
			sinon.stub(poseController._animationMixer, 'stopAllAction');

			clipAction = {
				play: sinon.stub()
			};
			previousAction = {
				play: sinon.stub(),
				crossFadeTo: sinon.stub()
			};
		});

		afterEach(() => {
			poseController.emit.restore();
		});

		describe('invalid gesture', () => {

			let returnValue;

			beforeEach(() => {
				returnValue = poseController.setGesture('gesture');
			});

			it('should return undefined', () => {
				assert.isUndefined(returnValue);
			});
		});

		describe('gesture equals currentGesture', () => {

			let returnValue;

			beforeEach(() => {
				poseController.getGestureName.returns('HandRightOpen');
				poseController.currentGesture = 'HandRightOpen';
				returnValue = poseController.setGesture('Open');
			});

			it('should get gesture name', () => {
				assert.isTrue(poseController.getGestureName.calledOnce);
				assert.isTrue(poseController.getGestureName.calledWith('Open'));
			});

			it('should return undefined', () => {
				assert.isUndefined(returnValue);
			});
		});

		describe('no clipAction', () => {

			let returnValue;

			beforeEach(() => {
				poseController.getGestureName.returns('HandRightOpen');
				poseController._animationMixer.clipAction.returns(undefined);
				returnValue = poseController.setGesture('Open');
			});

			it('should get clipAction', () => {
				assert.isTrue(poseController._animationMixer.clipAction.calledOnce);
				assert.isTrue(poseController._animationMixer.clipAction.calledWith('HandRightOpen'));
			});

			it('should return undefined', () => {
				assert.isUndefined(returnValue);
			});
		});

		describe('no currentGesture', () => {

			let returnValue;

			beforeEach(() => {
				poseController.getGestureName.returns('HandRightOpen');
				poseController._animationMixer.clipAction.returns(clipAction);
				returnValue = poseController.setGesture('Open');
			});

			it('should handle clipAction', () => {
				assert.isTrue(clipAction.clampWhenFinished);
				assert.equal(clipAction.loop, 2201);
				assert.equal(clipAction.repetitions, 0);
				assert.equal(clipAction.weight, 1);
				assert.isTrue(poseController._animationMixer.stopAllAction.calledOnce);
				assert.isTrue(clipAction.play.calledOnce);
			});

			it('should emit gesturechange', () => {
				assert.isTrue(poseController.emit.calledOnce);
				assert.isTrue(poseController.emit.calledWith('gesturechange'));
				assert.deepEqual(poseController.emit.firstCall.args[1], {
					gesture: 'HandRightOpen',
					previousGesture: false
				});
			});

			it('should return undefined', () => {
				assert.isUndefined(returnValue);
			});
		});
		
		describe('no previousAction', () => {

			let returnValue;

			beforeEach(() => {
				poseController.getGestureName.returns('HandRightOpen');
				poseController._animationMixer.clipAction
					.onFirstCall().returns(clipAction)
					.onSecondCall().returns(undefined);
				poseController.currentGesture = 'HandRightOkay';
				returnValue = poseController.setGesture('Open');
			});

			it('should get clipAction', () => {
				assert.isTrue(poseController._animationMixer.clipAction.calledTwice);
				assert.isTrue(poseController._animationMixer.clipAction.secondCall.calledWith('HandRightOkay'));
			});

			it('should return undefined', () => {
				assert.isUndefined(previousAction.weight);
				assert.isUndefined(returnValue);
			});
		});
		
		describe('everything works', () => {

			let returnValue;

			beforeEach(() => {
				poseController.getGestureName.returns('HandRightOpen');
				poseController._animationMixer.clipAction
					.onFirstCall().returns(clipAction)
					.onSecondCall().returns(previousAction);
				poseController.currentGesture = 'HandRightOkay';
				returnValue = poseController.setGesture('Open');
			});

			it('should handle actions', () => {
				assert.equal(previousAction.weight, 0.15);
				assert.isTrue(previousAction.play.calledOnce);
				assert.isTrue(previousAction.crossFadeTo.calledOnce);
				assert.isTrue(clipAction.play.calledOnce);
			});

			it('should emit gesturechange', () => {
				assert.isTrue(poseController.emit.calledOnce);
				assert.isTrue(poseController.emit.calledWith('gesturechange'));
				assert.deepEqual(poseController.emit.firstCall.args[1], {
					gesture: 'HandRightOpen',
					previousGesture: 'HandRightOkay'
				});
			});

			it('should set currentGesture', () => {
				assert.equal(poseController.currentGesture, 'HandRightOpen');
			});

			it('should return undefined', () => {
				assert.isUndefined(returnValue);
			});
		});
	});

	describe('#update', () => {

		beforeEach(() => {
			sinon.stub(Controllers, 'getGamepad');
			sinon.stub(poseController, 'emit');
		});

		afterEach(() => {
			Controllers.getGamepad.restore();
			poseController.emit.restore();
		});

		describe('no gamepad', () => {

			beforeEach(() => {
				poseController.update();
			});

			it('should emit controllerdisconnected', () => {
				assert.isTrue(poseController.emit.calledOnce);
				assert.equal(poseController.emit.firstCall.args[0], 'controllerdisconnected');
				assert.deepEqual(poseController.emit.firstCall.args[1], {
					id: 'test',
					hand: 'left'
				});
			});
		});

		describe('gamepad', () => {

			const gamepad = {
				pose: {
					orientation: 1,
					position: 1
				}
			};
			let camera;
			const userHeight = 0;
			const floorHeight = 0;

			beforeEach(() => {
				sinon.stub(poseController, 'determineGesture').returns(1);
				sinon.stub(poseController._animationMixer, 'update');
				sinon.stub(THREE.Vector3.prototype, 'fromArray');

				camera = new THREE.Object3D();
			});

			afterEach(() => {
				THREE.Vector3.prototype.fromArray.restore();
			});

			describe('pressed / touched', () => {

				beforeEach(() => {
					gamepad.buttons = {
						0: {
							pressed: true,
							touched: true
						}
					};
					
					Controllers.getGamepad.returns(gamepad);
	
					poseController.pressedButtons['Thumbpad'] = false;
					poseController.touchedButtons['Thumbpad'] = false;
	
					poseController.update(0, camera, userHeight, floorHeight);
				});

				it('should handle pressed button', () => {
					assert.isTrue(poseController.emit.calledTwice);
					assert.isTrue(poseController.emit.calledWith('thumbpadpressed'));
					assert.isTrue(poseController.pressedButtons['Thumbpad']);
				});

				it('should handle touched button', () => {
					assert.isTrue(poseController.emit.calledTwice);
					assert.isTrue(poseController.emit.calledWith('thumbpadtouched'));
					assert.isTrue(poseController.touchedButtons['Thumbpad']);
				});
			});

			describe('unpressed / untouched', () => {

				beforeEach(() => {
					gamepad.buttons = {
						0: {
							pressed: false,
							touched: false
						}
					};
					
					Controllers.getGamepad.returns(gamepad);
	
					poseController.pressedButtons['Thumbpad'] = true;
					poseController.touchedButtons['Thumbpad'] = true;
	
					poseController.update(0, camera, userHeight, floorHeight);
				});

				it('should handle unpressed button', () => {
					assert.isTrue(poseController.emit.calledTwice);
					assert.isTrue(poseController.emit.calledWith('thumbpadunpressed'));
					assert.isFalse(poseController.pressedButtons['Thumbpad']);
				});
	
				it('should handle untouched button', () => {
					assert.isTrue(poseController.emit.calledTwice);
					assert.isTrue(poseController.emit.calledWith('thumbpaduntouched'));
					assert.isFalse(poseController.touchedButtons['Thumbpad']);
				});
			});

			describe('general', () => {

				beforeEach(() => {
					gamepad.buttons = {};
					
					Controllers.getGamepad.returns(gamepad);
		
					poseController.update(0, camera, userHeight, floorHeight);
				});

				it('should set gesture', () => {
					assert.isTrue(poseController.determineGesture.calledOnce);
					// Called in constructor
					assert.isTrue(poseController.setGesture.calledTwice);
					assert.isTrue(poseController.setGesture.calledWith(1));
					assert.isTrue(poseController._animationMixer.update.calledOnce);
					assert.isTrue(poseController._animationMixer.update.calledWith(0));
				});

				it('should update properties', () => {
					// First call is in the Constructor
					assert.isTrue(THREE.Quaternion.prototype.fromArray.calledTwice);
					assert.isTrue(THREE.Quaternion.prototype.fromArray.calledWith(1));
					assert.isTrue(THREE.Vector3.prototype.fromArray.calledOnce);
					assert.isTrue(THREE.Vector3.prototype.fromArray.calledWith(1));
				});
	
				// Not sure how to test arm model
			});
		});
	});
});
