'use strict';

import EventEmitter from 'eventemitter3';
import {Identity} from '../../src/virtualpersona/identity';

describe('Identity', () => {

	let identity;

	beforeEach(() => {
		sinon.stub(Identity.prototype, 'getIdentity').returns(true);
		identity = new Identity();
	});

	afterEach(() => {
		Identity.prototype.getIdentity.restore && Identity.prototype.getIdentity.restore();
	});

	it('should be a class', () => {
		assert.isFunction(Identity);
	});

	it('should have a set of methods', () => {
		assert.isFunction(Identity.prototype.signIn);
		assert.isFunction(Identity.prototype.signOut);
		assert.isFunction(Identity.prototype.getIdentity);
		assert.isFunction(Identity.prototype.getIdentityFromSource);
		assert.isFunction(Identity.prototype.setUPortData);
	});

	it('should have a set of properties', () => {
		assert.equal(Identity.prototype.signedIn, false);
		assert.equal(Identity.prototype.avatarPath, 'https://simbol.io/assets/models/AnonymousVP.glb');
	});

	describe('#constructor', () => {

		it('should extend EventEmitter', () => {
			assert.instanceOf(identity, EventEmitter);
		});

		it('should configure uPort', () => {
			assert.equal(identity.uPort.clientId, '2on1AwSMW48Asek7N5fT9aGf3voWqMkEAXJ');
			assert.equal(identity.uPort.appName, 'Simbol');
			assert.equal(identity.uPort.network.id, '0x4')
		});

		it('should set signedIn', () => {
			assert.isTrue(identity.getIdentity.calledOnce);
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
					verified: ['SimbolConfig'],
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
			assert.equal(identity.avatarPath, 'https://simbol.io/assets/models/AnonymousVP.glb');
			assert.isUndefined(identity.uPortData);
			assert.isFalse(identity.signedIn);
		});
	});

	describe('#getIdentity', () => {

		const data = {};
		let returnedData;

		beforeEach(() => {
			Identity.prototype.getIdentity.restore();
			sinon.stub(identity, 'getIdentityFromSource').returns(JSON.stringify(data));
		});

		describe('instance data', () => {
			
			beforeEach(() => {
				identity.uPortData = data;

				returnedData = identity.getIdentity();
			});

			it('should return instance data', () => {
				assert.equal(returnedData, data);
			})
		});

		describe('source data', () => {
			
			beforeEach(() => {
				sinon.stub(identity, 'setUPortData');

				returnedData = identity.getIdentity();
			});

			it('should return source data', () => {
				assert.deepEqual(returnedData, data);
			});

			it('should save instance data', () => {
				assert.isTrue(identity.setUPortData.calledOnce);
				assert.isTrue(identity.setUPortData.calledWith(returnedData, true));
			});
		});

		describe('error', () => {

			let caughtError;

			beforeEach((done) => {
				identity.on('error', (error) => {
					caughtError = error;
					done();
				});
				identity.getIdentityFromSource.returns('{a:a}');
				sinon.spy(identity, 'emit');

				identity.getIdentity();
			});

			it('should emit error', () => {
				assert.isTrue(identity.emit.calledOnce);
				assert.isTrue(identity.emit.calledWith('error', caughtError));
				assert.instanceOf(caughtError, Error);
			});
		});
	});

	describe('#getIdentityFromSource', () => {

		let returnedData;

		// Can't test URL params
		xdescribe('url param', () => {

		});

		describe('localstorage data', () => {
			
			beforeEach(() => {
				sinon.stub(localStorage, 'getItem').returns('{}');

				returnedData = identity.getIdentityFromSource();
			});

			afterEach(() => {
				localStorage.getItem.restore();
			});

			it('should return localStorageData', () => {
				assert.equal(returnedData, '{}');
			});
		});
	});

	describe('#setUPortData', () => {

		let creds;
		
		beforeEach(() => {
			sinon.stub(localStorage, 'setItem');
			creds = {
				address: 0,
				did: 0,
				publicEncKey: 1,
				pushToken: 2,
				SimbolConfig: true
			};

			identity.setUPortData(creds, true);
		});

		afterEach(() => {
			localStorage.setItem.restore();
		});

		it('should save identity data', () => {
			assert.isTrue(localStorage.setItem.calledOnce);
			assert.isTrue(localStorage.setItem.calledWith('currentIdentity', '{"address":0,"did":0,"publicEncKey":1,"pushToken":2,"SimbolConfig":true}'));
			assert.equal(identity.avatarPath, Identity.prototype.avatarPath);
			assert.deepEqual(identity.uPortData, creds);
			assert.equal(identity.uPort.pushToken, 2);
			assert.equal(identity.uPort.publicEncKey, 1);
		});
	});
});