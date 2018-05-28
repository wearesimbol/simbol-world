'use strict';

import * as THREE from 'three';
import EventEmitter from 'eventemitter3';
import {Utils} from '../src/utils/utils';
import {Scene} from '../src/scene/scene';
import Simbol from '../src/main';
import { Controllers } from '../src/controllers/controllers';
import { Locomotion } from '../src/locomotion/locomotion';
import { Interactions } from '../src/interactions/interactions';
import { VirtualPersona } from '../src/virtualpersona/virtualpersona';
import { Physics } from '../src/physics/physics';

describe('Simbol', () => {

    let simbol;

    beforeEach(() => {
        sinon.stub(Locomotion.prototype, 'setUpEventListeners');
        sinon.stub(Interactions.prototype, 'setUpEventListeners');
        sinon.stub(Simbol.prototype, 'addListeners');
    });

    afterEach(() => {
        Locomotion.prototype.setUpEventListeners.restore();
        Interactions.prototype.setUpEventListeners.restore();

        Simbol.prototype.addListeners.restore && Simbol.prototype.addListeners.restore();
    });

    beforeEach(() => {
        simbol = new Simbol({
            scene: {
                render: true,
                canvas: document.createElement('canvas')
            }
        });
    });

    it('should be a class', () => {
        assert.isFunction(Simbol);
    });

    it('should have a ser of methods', () => {
        assert.isFunction(Simbol.prototype.init);
        assert.isFunction(Simbol.prototype.addListeners);
        assert.isFunction(Simbol.prototype.addToScene);
        assert.isFunction(Simbol.prototype.removeFromScene);
        assert.isFunction(Simbol.prototype.addAnimateFunctions);
        assert.isFunction(Simbol.prototype.startPresenting);
        assert.isFunction(Simbol.prototype.stopPresenting);
        assert.isFunction(Simbol.prototype.animate);
    });

    describe('#constructor', () => {

        it('should extend EventEmitter', () => {
            assert.instanceOf(simbol, EventEmitter);
        });

        it('should initialise a Scene', () => {
            assert.instanceOf(simbol._scene, Scene);
        });

        it('should initialise a Virtual Persona', () => {
            assert.instanceOf(simbol.virtualPersona, VirtualPersona);
        });

        it('should initialise Controllers', () => {
            assert.instanceOf(simbol.controllers, Controllers);
        });

        it('should initialise Locomotion', () => {
            assert.instanceOf(simbol.locomotion, Locomotion);
            assert.isTrue(Locomotion.prototype.setUpEventListeners.calledOnce);
        });

        it('should initialise Interactions', () => {
            assert.instanceOf(simbol.interactions, Interactions);
            assert.isTrue(Interactions.prototype.setUpEventListeners.calledOnce);
        });

        it('should add common listeners', () => {
            assert.isTrue(simbol.addListeners.calledOnce);
            assert.isTrue(simbol.addListeners.calledWith(simbol.virtualPersona, simbol.controllers, simbol.interactions));
        });
    });

    describe('#init', () => {

        beforeEach((done) => {
            sinon.stub(simbol, 'addAnimateFunctions');
            sinon.stub(simbol._scene, 'init').resolves();
            sinon.stub(simbol.virtualPersona, 'init').resolves();
            sinon.stub(simbol, 'addToScene');
            sinon.stub(simbol.interactions, 'getMeshes').returns([1, 2]);
            sinon.stub(simbol.locomotion, 'getMeshes').returns([3, 4]);

            simbol.init().then(done);
        });

        it('should initialise scene', () => {
            assert.isTrue(simbol._scene.init.calledOnce);
        });

        it('should initialise VirtualPersona', () => {
            assert.isTrue(simbol.virtualPersona.init.calledOnce);
        });

        it('should add interactions and locomotion meshes into the scene', () => {
            assert.isTrue(simbol.addToScene.calledOnce);
            assert.deepEqual(simbol.addToScene.firstCall.args, [[1, 2, 3, 4]]);
            assert.isTrue(simbol.interactions.getMeshes.calledOnce);
            assert.isTrue(simbol.locomotion.getMeshes.calledOnce);
        });

        it('should add animate function', () => {
            assert.isTrue(simbol.addAnimateFunctions.calledOnce);
            assert.isArray(simbol.addAnimateFunctions.firstCall.args[0]);
            assert.isFunction(simbol.addAnimateFunctions.firstCall.args[0][0]);
        });
    });

    describe('#addListeners', () => {

        let component1;
        let component2;

        beforeEach(() => {
            simbol.addListeners.restore();
            component1 = new EventEmitter();
            sinon.spy(component1, 'on');
            component2 = {
                on: sinon.stub()
            };

            simbol.addListeners(component1, component2);
        });

        it('should add all listeners to all components', () => {
            assert.equal(component1.on.callCount, 4);
            assert.equal(component1.on.firstCall.args[0], 'add');
            assert.equal(component1.on.secondCall.args[0], 'remove');
            assert.equal(component1.on.thirdCall.args[0], 'addanimatefunctions');
            assert.equal(component1.on.getCall(3).args[0], 'error');
            assert.equal(component2.on.callCount, 4);
            assert.equal(component2.on.firstCall.args[0], 'add');
            assert.equal(component2.on.secondCall.args[0], 'remove');
            assert.equal(component2.on.thirdCall.args[0], 'addanimatefunctions');
            assert.equal(component2.on.getCall(3).args[0], 'error');
        });

        it('should forward error', (done) => {
            const event = {};
            simbol.on('error', (fwdevent) => {
                assert.equal(fwdevent, event);
                done();
            });
            component1.emit('error', event);
        });
    });

    describe('#addToScene', () => {

        beforeEach(() => {
            sinon.stub(simbol._scene, 'addToScene');

            simbol.addToScene([1, 2]);
        });

        it('should wrap Scene.prototype.addToScene', () => {
            assert.isTrue(simbol._scene.addToScene.calledOnce);
            assert.isTrue(simbol._scene.addToScene.calledWith());
        });
    });

    describe('#removeFromeScene', () => {

        beforeEach(() => {
            simbol._scene.scene = {
                remove: sinon.stub()
            };

            simbol.removeFromScene(1);
        });

        it('should remove mesh from scene', () => {
            assert.isTrue(simbol._scene.scene.remove.calledOnce);
            assert.isTrue(simbol._scene.scene.remove.calledWith(1));
        });
    });

    describe('#addAnimateFunctions', () => {

        beforeEach(() => {
            sinon.stub(simbol._scene, 'addAnimateFunctions');

            simbol.addAnimateFunctions([1, 2]);
        });

        it('should wrap Scene.prototype.addAnimateFunctions', () => {
            assert.isTrue(simbol._scene.addAnimateFunctions.calledOnce);
            assert.isTrue(simbol._scene.addAnimateFunctions.calledWith(1, 2));
        });
    });

    describe('#startPresenting', () => {

        beforeEach(() => {
            sinon.stub(simbol._scene.vrEffect, 'requestPresent');

            simbol.startPresenting();
        });

        it('should wrap VREffect.prototype.requestPresent', () => {
            assert.isTrue(simbol._scene.vrEffect.requestPresent.calledOnce);
        });

        it('should set Utils.isPresenting', () => {
            assert.isTrue(Utils.isPresenting);
        });
    });

    describe('#stopPresenting', () => {

        beforeEach(() => {
            sinon.stub(simbol._scene.vrEffect, 'exitPresent');

            simbol.stopPresenting();
        });

        it('should wrap VREffect.prototype.exitPresent', () => {
            assert.isTrue(simbol._scene.vrEffect.exitPresent.calledOnce);
        });

        it('should set Utils.isPresenting', () => {
            assert.isFalse(Utils.isPresenting);
        });
    });

    describe('#animate', () => {

		beforeEach(() => {
			sinon.stub(THREE.Vector3.prototype, 'set');
			sinon.stub(THREE.Vector3.prototype, 'applyQuaternion');
			sinon.stub(Physics, 'checkMeshCollision').returns(false);
			// sinon.stub(Physics, 'checkRayCollision').returns(true);

			simbol.locomotion = {
				phi: 1,
				theta: 1,
				translatingZ: 1,
				translatingX: 1,
				orientation: {
					quaternion: 1,
					euler: {
						y: 1
					}
				},
				teleportation: {
					isRayCurveActive: true,
					isTeleportActive: true,
					hitPoint: {
						x: 1,
						y: 0,
						z: 2
                    },
                    activateTeleport: sinon.stub(),
					updateRayCurve: sinon.stub(),
					resetTeleport: sinon.stub()
				}
            };
            
            simbol.controllers = {
                currentControllers: {
                    'Test Controller': {
                        update: sinon.stub()
                    },

                    'Test Controller 2': {
                        update: sinon.stub()
                    }
                }
            }

			simbol.virtualPersona.vrControls = {
                update: sinon.stub(),
                getStandingMatrix: sinon.stub()
            };

			simbol.virtualPersona.fakeCamera = {
				quaternion: 2,
				position: {
					applyQuaternion: sinon.stub()
				}
			};
			simbol.virtualPersona.fakeCamera.position.applyQuaternion.returns(new THREE.Quaternion());

			simbol._scene = {
				camera: {
					rotation: {
						set: sinon.stub(),
						y: 1,
						copy: sinon.stub()
					},
					position: {
						setX: sinon.stub(),
						setY: sinon.stub(),
						setZ: sinon.stub(),
						copy: sinon.stub(),
						equals: sinon.stub().returns(false),
						add: sinon.stub(),
						y: 0
					},
					quaternion: {
						copy: sinon.stub(),
						multiply: sinon.stub()
					},
					translateZ: sinon.stub(),
					translateX: sinon.stub()
				},
				vrEffect: {
					isPresenting: false
                },
                collidableMeshes: 1,
                scene: {
                    children: []
                }
			};

			simbol.interactions = {
				update: sinon.stub()
			};

			simbol.virtualPersona.multiVP = {
				sendData: sinon.stub()
			}

			simbol.virtualPersona.mesh = {
				rotation: {
					y: 0
				},
				position: {
					copy: sinon.stub(),
					setY: sinon.stub()
                },
                children: []
			};
			simbol.virtualPersona.mesh.position.copy.returns(simbol.virtualPersona.mesh.position);
			simbol.virtualPersona.headMesh = {
				position: {
					y: 0
				}
			};
			simbol.virtualPersona.floorHeight = 0;

			simbol.virtualPersona.setFloorHeight = sinon.stub();
		});

		afterEach(() => {
			THREE.Vector3.prototype.set.restore();
			THREE.Vector3.prototype.applyQuaternion.restore();
			Physics.checkMeshCollision.restore();
		});

		describe('general', () => {

			beforeEach(() => {
				simbol.animate(1000);
			});

			it('should handle position', () => {
				assert.isTrue(simbol._scene.camera.position.copy.calledOnce);
			});
			
			it('should update the camera\'s position', () => {
				assert.isTrue(simbol._scene.camera.translateZ.calledOnce);
				assert.isTrue(simbol._scene.camera.translateZ.calledWith(0));
	
				assert.isTrue(simbol._scene.camera.translateX.calledOnce);
				assert.isTrue(simbol._scene.camera.translateX.calledWith(0));
			});

			it('should handle collisions', () => {
				assert.isTrue(Physics.checkMeshCollision.calledOnce);
				assert.equal(Physics.checkMeshCollision.firstCall.args[0], simbol.virtualPersona.mesh);
			});

			it('should handle the teleportation ray curve', () => {
				assert.isTrue(simbol.locomotion.teleportation.updateRayCurve.calledOnce);
				assert.isTrue(simbol.locomotion.teleportation.updateRayCurve.calledWith(simbol._scene.camera));
			});

			it('should handle teleportation', () => {
				assert.isTrue(simbol._scene.camera.position.setX.calledOnce);
				assert.isTrue(simbol._scene.camera.position.setY.calledTwice);
				assert.isTrue(simbol._scene.camera.position.setZ.calledOnce);
				assert.isTrue(simbol._scene.camera.position.setX.calledWith(1));
				assert.isTrue(simbol._scene.camera.position.setY.calledWith(1.7));
				assert.isTrue(simbol._scene.camera.position.setZ.calledWith(2));
				assert.isTrue(simbol.locomotion.teleportation.resetTeleport.calledOnce);
			});

			it('should set floor height', () => {
				assert.isTrue(simbol.virtualPersona.setFloorHeight.calledOnce);
			});

			it('should fix the camera\'s height', () => {
				assert.isTrue(simbol._scene.camera.position.setY.calledTwice);
				assert.isTrue(simbol._scene.camera.position.setY.calledWith(1.7));
			});
			
			it('should set the camera\'s rotation', () => {
				assert.isTrue(simbol._scene.camera.rotation.copy.calledOnce);
				assert.isTrue(simbol._scene.camera.rotation.copy.calledWith(simbol.locomotion.orientation.euler));
			});

			it('should set the mesh\'s rotation', () => {
				assert.equal(simbol.virtualPersona.mesh.rotation.y, Math.PI + 1);
			});

			it('should set the mesh\'s position', () => {
				assert.isTrue(simbol.virtualPersona.mesh.position.copy.calledOnce);
				assert.isTrue(simbol.virtualPersona.mesh.position.copy.calledWith(simbol._scene.camera.position));

				assert.isTrue(simbol.virtualPersona.mesh.position.setY.calledOnce);
				assert.isTrue(simbol.virtualPersona.mesh.position.setY.calledWith(0));
			});

			it('should send data via multiVP', () => {
				assert.isTrue(simbol.virtualPersona.multiVP.sendData.calledOnce);
				assert.isTrue(simbol.virtualPersona.multiVP.sendData.calledWith(simbol.virtualPersona.mesh));
			});

			it('should update interactions', () => {
				assert.isTrue(simbol.interactions.update.calledOnce);
				assert.isTrue(simbol.interactions.update.calledWith(simbol._scene.camera.position, simbol._scene.camera.quaternion));
			});

			it('should update controllers', () => {
				assert.isTrue(simbol.controllers.currentControllers['Test Controller'].update.calledOnce);
				assert.isTrue(simbol.controllers.currentControllers['Test Controller 2'].update.calledOnce);
			});
		});

		describe('isPresenting', () => {

			beforeEach(() => {
				Utils.isPresenting = true;

				simbol.animate(1000);
			});
			
			it('should update VRControls', () => {
				assert.isTrue(simbol.virtualPersona.vrControls.update.calledOnce);
			});

			it('should set the camera\'s rotation', () => {
				assert.isTrue(simbol._scene.camera.position.add.calledOnce);
				assert.deepEqual(simbol._scene.camera.position.add.firstCall.args[0], new THREE.Quaternion());
				assert.isTrue(simbol._scene.camera.quaternion.multiply.calledOnce);
				assert.isTrue(simbol._scene.camera.quaternion.multiply.calledWith(2));
			});

			it('should set the mesh\'s rotation', () => {
				assert.equal(simbol.virtualPersona.mesh.rotation.y, Math.PI + 1);
			});
		});
	});
});