'use strict';

import {Identity} from '../../src/virtualpersona/identity';
import uPort from '../../src/libs/uport-connect';

describe('Identity', () => {

	let identity;

	beforeEach(() => {
		identity = Object.create(Identity);
	});

	it('should be an object', () => {
		assert.isObject(Identity);
	});

	it('should have a set of methods', () => {
		assert.isFunction(Identity.init);
		assert.isFunction(Identity.signIn);
		assert.isFunction(Identity.signOut);
		assert.isFunction(Identity.getIdentity);
		assert.isFunction(Identity.setUPortData);
	});

	it('should have a set of properties', () => {
		assert.equal(Identity.signedIn, false);
		assert.equal(Identity.avatarPath, 'assets/models/AnonymousVP.gltf');
	});

	describe('#init', () => {

		beforeEach(() => {
			sinon.stub(identity, 'getIdentity').returns(true);

			identity.init();
		});

		it('should configure uPort', () => {
			assert.equal(identity.uPort.clientId, '2on1AwSMW48Asek7N5fT9aGf3voWqMkEAXJ');
			assert.equal(identity.uPort.appName, 'Holonet');
			assert.equal(identity.uPort.network.id, '0x4')
		});

		it('should set signedIn', () => {
			assert.isTrue(identity.signedIn);
		});
	});

	describe('#signIn', () => {

		beforeEach(() => {
			identity.uPort = {
				requestCredentials: sinon.stub()
			};
		});

		describe('resolves', () => {

			let promise;

			beforeEach((done) => {
				identity.uPort.requestCredentials.returns(Promise.resolve('test'));
				sinon.stub(identity, 'setUPortData');

				promise = identity.signIn('information', 'moreinfo').then(done);
			});

			it('should return a promise', () => {
				assert.instanceOf(promise, Promise);
			});

			it('should request credentials', () => {
				assert.isTrue(identity.uPort.requestCredentials.calledOnce);
				assert.deepEqual(identity.uPort.requestCredentials.firstCall.args[0], {
					requested: ['information', 'moreinfo'],
					verified: ['HolonetConfig'],
					notifications: true
				});
			});

			it('should save credentials', () => {
				assert.isTrue(identity.setUPortData.calledOnce);
				assert.isTrue(identity.setUPortData.calledWith('test', true));
				assert.isTrue(identity.signedIn);
			});
		});

		describe('rejects', () => {

			let error;

			beforeEach((done) => {
				identity.uPort.requestCredentials.returns(Promise.reject('error'));

				identity.signIn().catch((e) => {
					error = e;
					done();
				});
			});

			it('should reject with error message', () => {
				assert.equal(error, 'error');
			});
		});
	});

	describe('#signOut', () => {

		beforeEach(() => {
			sinon.stub(localStorage, 'removeItem');
			identity.uPortData = true;

			identity.signOut();
		});

		afterEach(() => {
			localStorage.removeItem.restore();
		});

		it('should reset the instance and remove identity data', () => {
			assert.isTrue(localStorage.removeItem.calledOnce);
			assert.isTrue(localStorage.removeItem.calledWith('currentIdentity'));
			assert.equal(identity.avatarPath, 'assets/models/AnonymousVP.gltf');
			assert.isUndefined(identity.uPortData);
			assert.isFalse(identity.signedIn);
		});
	});

	describe('#getIdentity', () => {

		const data = {};
		let returnedData;

		describe('instance data', () => {
			
			beforeEach(() => {
				identity.uPortData = data;

				returnedData = identity.getIdentity();
			});

			it('should return instance data', () => {
				assert.equal(returnedData, data);
			})
		});

		describe('localStorage data', () => {
			
			beforeEach(() => {
				sinon.stub(localStorage, 'getItem').returns('{}');
				sinon.stub(identity, 'setUPortData');

				returnedData = identity.getIdentity();
			});

			afterEach(() => {
				localStorage.getItem.restore();
			});

			it('should return localStorageData', () => {
				assert.deepEqual(returnedData, data);
			});

			it('should save instance data', () => {
				assert.isTrue(identity.setUPortData.calledOnce);
				assert.isTrue(identity.setUPortData.calledWith(returnedData));
			});
		});
	});

	describe('#setUPortData', () => {

		let creds;
		
		beforeEach(() => {
			sinon.stub(localStorage, 'setItem');
			creds = {HolonetConfig: true};

			identity.setUPortData(creds, true);
		});

		afterEach(() => {
			localStorage.setItem.restore();
		});

		it('should save identity data', () => {
			assert.isTrue(localStorage.setItem.calledOnce);
			assert.isTrue(localStorage.setItem.calledWith('currentIdentity', '{"HolonetConfig":true}'));
			assert.equal(identity.avatarPath, Identity.avatarPath);
			assert.equal(identity.uPortData, creds);
		});
	});
});