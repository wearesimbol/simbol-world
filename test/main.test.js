'use strict';

import * as THREE from 'three';
import EventEmitter from 'eventemitter3';
import {Utils} from '../src/utils/utils';
import {Scene} from '../src/scene/scene';
import Holonet from '../src/main';
import { Controllers } from '../src/controllers/controllers';
import { Locomotion } from '../src/locomotion/locomotion';
import { Interactions } from '../src/interactions/interactions';
import { VirtualPersona } from '../src/virtualpersona/virtualpersona';
import { Physics } from '../src/physics/physics';

describe('Holonet', () => {

    let holonet;

    beforeEach(() => {
        sinon.stub(Locomotion.prototype, 'setUpEventListeners');
        sinon.stub(Interactions.prototype, 'setUpEventListeners');
        sinon.stub(Holonet.prototype, 'addListeners');
        sinon.stub(Holonet.prototype, 'addAnimateFunctions');
    });

    afterEach(() => {
        Locomotion.prototype.setUpEventListeners.restore();
        Interactions.prototype.setUpEventListeners.restore();

        Holonet.prototype.addListeners.restore && Holonet.prototype.addListeners.restore();
        Holonet.prototype.addAnimateFunctions.restore && Holonet.prototype.addAnimateFunctions.restore();
    });

    beforeEach(() => {
        holonet = new Holonet({
            scene: {
                render: true,
                canvas: document.createElement('canvas')
            }
        });
    });

    it('should be a class', () => {
        assert.isFunction(Holonet);
    });

    it('should have a ser of methods', () => {
        assert.isFunction(Holonet.prototype.init);
        assert.isFunction(Holonet.prototype.addListeners);
        assert.isFunction(Holonet.prototype.addToScene);
        assert.isFunction(Holonet.prototype.removeFromScene);
        assert.isFunction(Holonet.prototype.addAnimateFunctions);
        assert.isFunction(Holonet.prototype.startPresenting);
        assert.isFunction(Holonet.prototype.stopPresenting);
        assert.isFunction(Holonet.prototype.animate);
    });

    describe('#constructor', () => {

        it('should initialise EventEmitter', () => {
            assert.instanceOf(holonet.__proto__, EventEmitter);
        });

        it('should initialise a Scene', () => {
            assert.instanceOf(holonet._scene, Scene);
        });

        it('should initialise a Virtual Persona', () => {
            assert.instanceOf(holonet.virtualPersona, VirtualPersona);
        });

        it('should initialise Controllers', () => {
            assert.instanceOf(holonet.controllers, Controllers);
        });

        it('should initialise Locomotion', () => {
            assert.instanceOf(holonet.locomotion, Locomotion);
            assert.isTrue(Locomotion.prototype.setUpEventListeners.calledOnce);
        });

        it('should initialise Interactions', () => {
            assert.instanceOf(holonet.interactions, Interactions);
            assert.isTrue(Interactions.prototype.setUpEventListeners.calledOnce);
        });

        it('should add common listeners', () => {
            assert.isTrue(holonet.addListeners.calledOnce);
            assert.isTrue(holonet.addListeners.calledWith(holonet.virtualPersona, holonet.controllers, holonet.interactions));
        });

        it('should start main render function loop', () => {

        });
    });

    describe('#init', () => {

        beforeEach((done) => {
            sinon.stub(holonet._scene, 'init').resolves();
            sinon.stub(holonet.virtualPersona, 'init').resolves();
            sinon.stub(holonet, 'addToScene');
            sinon.stub(holonet.interactions, 'getMeshes').returns([1, 2]);
            sinon.stub(holonet.locomotion, 'getMeshes').returns([3, 4]);

            holonet.init().then(done);
        });

        it('should initialise scene', () => {
            assert.isTrue(holonet._scene.init.calledOnce);
        });

        it('should initialise VirtualPersona', () => {
            assert.isTrue(holonet.virtualPersona.init.calledOnce);
        });

        it('should add interactions and locomotion meshes into the scene', () => {
            assert.isTrue(holonet.addToScene.calledOnce);
            assert.deepEqual(holonet.addToScene.firstCall.args, [[1, 2, 3, 4]]);
            assert.isTrue(holonet.interactions.getMeshes.calledOnce);
            assert.isTrue(holonet.locomotion.getMeshes.calledOnce);
        });
    });

    describe('#addListeners', () => {

        let component1;
        let component2;

        beforeEach(() => {
            holonet.addListeners.restore();
            component1 = new EventEmitter();
            sinon.spy(component1, 'on');
            component2 = {
                on: sinon.stub()
            };

            holonet.addListeners(component1, component2);
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
            holonet.on('error', (fwdevent) => {
                assert.equal(fwdevent, event);
                done();
            });
            component1.emit('error', event);
        });
    });

    describe('#addToScene', () => {

        beforeEach(() => {
            sinon.stub(holonet._scene, 'addToScene');

            holonet.addToScene([1, 2]);
        });

        it('should wrap Scene.prototype.addToScene', () => {
            assert.isTrue(holonet._scene.addToScene.calledOnce);
            assert.isTrue(holonet._scene.addToScene.calledWith());
        });
    });

    describe('#removeFromeScene', () => {

        beforeEach(() => {
            holonet._scene.scene = {
                remove: sinon.stub()
            };

            holonet.removeFromScene(1);
        });

        it('should remove mesh from scene', () => {
            assert.isTrue(holonet._scene.scene.remove.calledOnce);
            assert.isTrue(holonet._scene.scene.remove.calledWith(1));
        });
    });

    describe('#addAnimateFunctions', () => {

        beforeEach(() => {
            holonet.addAnimateFunctions.restore();
            sinon.stub(holonet._scene, 'addAnimateFunctions');

            holonet.addAnimateFunctions([1, 2]);
        });

        it('should wrap Scene.prototype.addAnimateFunctions', () => {
            assert.isTrue(holonet._scene.addAnimateFunctions.calledOnce);
            assert.isTrue(holonet._scene.addAnimateFunctions.calledWith(1, 2));
        });
    });

    describe('#startPresenting', () => {

        beforeEach(() => {
            sinon.stub(holonet._scene.vrEffect, 'requestPresent');

            holonet.startPresenting();
        });

        it('should wrap VREffect.prototype.requestPresent', () => {
            assert.isTrue(holonet._scene.vrEffect.requestPresent.calledOnce);
        });

        it('should set Utils.isPresenting', () => {
            assert.isTrue(Utils.isPresenting);
        });
    });

    describe('#stopPresenting', () => {

        beforeEach(() => {
            sinon.stub(holonet._scene.vrEffect, 'exitPresent');

            holonet.stopPresenting();
        });

        it('should wrap VREffect.prototype.exitPresent', () => {
            assert.isTrue(holonet._scene.vrEffect.exitPresent.calledOnce);
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

			holonet.locomotion = {
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
            
            holonet.controllers = {
                currentControllers: {
                    'Test Controller': {
                        update: sinon.stub()
                    },

                    'Test Controller 2': {
                        update: sinon.stub()
                    }
                }
            }

			holonet.virtualPersona.vrControls = {
                update: sinon.stub(),
                getStandingMatrix: sinon.stub()
            };

			holonet.virtualPersona.fakeCamera = {
				quaternion: 2,
				position: {
					applyQuaternion: sinon.stub()
				}
			};
			holonet.virtualPersona.fakeCamera.position.applyQuaternion.returns(new THREE.Quaternion());

			holonet._scene = {
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

			holonet.interactions = {
				update: sinon.stub()
			};

			holonet.virtualPersona.multiVP = {
				sendData: sinon.stub()
			}

			holonet.virtualPersona.mesh = {
				rotation: {
					y: 0
				},
				position: {
					copy: sinon.stub(),
					setY: sinon.stub()
                },
                children: []
			};
			holonet.virtualPersona.mesh.position.copy.returns(holonet.virtualPersona.mesh.position);
			holonet.virtualPersona.headMesh = {
				position: {
					y: 0
				}
			};
			holonet.virtualPersona.floorHeight = 0;

			holonet.virtualPersona.setFloorHeight = sinon.stub();
		});

		afterEach(() => {
			THREE.Vector3.prototype.set.restore();
			THREE.Vector3.prototype.applyQuaternion.restore();
			Physics.checkMeshCollision.restore();
		});

		describe('general', () => {

			beforeEach(() => {
				holonet.animate(1000);
			});

			it('should handle position', () => {
				assert.isTrue(holonet._scene.camera.position.copy.calledOnce);
			});
			
			it('should update the camera\'s position', () => {
				assert.isTrue(holonet._scene.camera.translateZ.calledOnce);
				assert.isTrue(holonet._scene.camera.translateZ.calledWith(0));
	
				assert.isTrue(holonet._scene.camera.translateX.calledOnce);
				assert.isTrue(holonet._scene.camera.translateX.calledWith(0));
			});

			it('should handle collisions', () => {
				assert.isTrue(Physics.checkMeshCollision.calledOnce);
				assert.equal(Physics.checkMeshCollision.firstCall.args[0], holonet.virtualPersona.mesh);
			});

			it('should handle the teleportation ray curve', () => {
				assert.isTrue(holonet.locomotion.teleportation.updateRayCurve.calledOnce);
				assert.isTrue(holonet.locomotion.teleportation.updateRayCurve.calledWith(holonet._scene.camera));
			});

			it('should handle teleportation', () => {
				assert.isTrue(holonet._scene.camera.position.setX.calledOnce);
				assert.isTrue(holonet._scene.camera.position.setY.calledTwice);
				assert.isTrue(holonet._scene.camera.position.setZ.calledOnce);
				assert.isTrue(holonet._scene.camera.position.setX.calledWith(1));
				assert.isTrue(holonet._scene.camera.position.setY.calledWith(1.7));
				assert.isTrue(holonet._scene.camera.position.setZ.calledWith(2));
				assert.isTrue(holonet.locomotion.teleportation.resetTeleport.calledOnce);
			});

			it('should set floor height', () => {
				assert.isTrue(holonet.virtualPersona.setFloorHeight.calledOnce);
			});

			it('should fix the camera\'s height', () => {
				assert.isTrue(holonet._scene.camera.position.setY.calledTwice);
				assert.isTrue(holonet._scene.camera.position.setY.calledWith(1.7));
			});
			
			it('should set the camera\'s rotation', () => {
				assert.isTrue(holonet._scene.camera.rotation.copy.calledOnce);
				assert.isTrue(holonet._scene.camera.rotation.copy.calledWith(holonet.locomotion.orientation.euler));
			});

			it('should set the mesh\'s rotation', () => {
				assert.equal(holonet.virtualPersona.mesh.rotation.y, Math.PI + 1);
			});

			it('should set the mesh\'s position', () => {
				assert.isTrue(holonet.virtualPersona.mesh.position.copy.calledOnce);
				assert.isTrue(holonet.virtualPersona.mesh.position.copy.calledWith(holonet._scene.camera.position));

				assert.isTrue(holonet.virtualPersona.mesh.position.setY.calledOnce);
				assert.isTrue(holonet.virtualPersona.mesh.position.setY.calledWith(0));
			});

			it('should send data via multiVP', () => {
				assert.isTrue(holonet.virtualPersona.multiVP.sendData.calledOnce);
				assert.isTrue(holonet.virtualPersona.multiVP.sendData.calledWith(holonet.virtualPersona.mesh));
			});

			it('should update interactions', () => {
				assert.isTrue(holonet.interactions.update.calledOnce);
				assert.isTrue(holonet.interactions.update.calledWith(holonet._scene.camera.position, holonet._scene.camera.quaternion));
			});

			it('should update controllers', () => {
				assert.isTrue(holonet.controllers.currentControllers['Test Controller'].update.calledOnce);
				assert.isTrue(holonet.controllers.currentControllers['Test Controller 2'].update.calledOnce);
			});
		});

		describe('isPresenting', () => {

			beforeEach(() => {
				Utils.isPresenting = true;

				holonet.animate(1000);
			});
			
			it('should update VRControls', () => {
				assert.isTrue(holonet.virtualPersona.vrControls.update.calledOnce);
			});

			it('should set the camera\'s rotation', () => {
				assert.isTrue(holonet._scene.camera.position.add.calledOnce);
				assert.deepEqual(holonet._scene.camera.position.add.firstCall.args[0], new THREE.Quaternion());
				assert.isTrue(holonet._scene.camera.quaternion.multiply.calledOnce);
				assert.isTrue(holonet._scene.camera.quaternion.multiply.calledWith(2));
			});

			it('should set the mesh\'s rotation', () => {
				assert.equal(holonet.virtualPersona.mesh.rotation.y, Math.PI + 1);
			});
		});
	});
});