import EventEmitter from 'eventemitter3';
import uport from '../libs/uport-connect';

const ANONYMOUS_AVATAR_PATH = 'https://holonet.one/assets/models/AnonymousVP.gltf';

class Identity {

	/** @property {boolean} signedIn - Whether the human is signed in */
	get signedIn() {
		if (typeof this._signedIn === 'undefined') {
			this._signedIn = false;
		}
		return this._signedIn;
	}

	set signedIn(signedIn) {
		this._signedIn = signedIn;
	}

	/** @property {string} avatarPath = Path to the current human's avatar, defaults to the anonymous avatar path */
	get avatarPath() {
		if (!this._avatarPath) {
			this._avatarPath = ANONYMOUS_AVATAR_PATH;
		}
		return this._avatarPath;
	}

	set avatarPath(avatarPath) {
		this._avatarPath = avatarPath;
	}

	/**
	 * Initializes an identity by instantiating uPort and fethcing the current identity
	 *
	 * @returns {undefined}
	 */
	constructor() {
		// Initializes EventEmitter
		Object.setPrototypeOf(this.__proto__, new EventEmitter());

		this.uPort = new uport.Connect('Holonet', {
			clientId: '2on1AwSMW48Asek7N5fT9aGf3voWqMkEAXJ',
			network: 'rinkeby',
			signer: uport.SimpleSigner('12856cfa7d87eca683cbccf3617c82c615b8cac4347db20b1874884c2bc6453d') // eslint-disable-line new-cap
		});

		const identity = this.getIdentity();
		this.signedIn = !!identity;
	}

	/**
	 * Signs the human in by showing a uPort QR code, and then saving the data
	 *
	 * @param {string} information - Pieces of information to be requested to the human
	 *
	 * @returns {Promise<string|undefined>} promise - If the user rejects signing in, it will resolve with that error object
	 */
	signIn(...information) {
		return this.uPort.requestCredentials({
			requested: information,
			verified: ['HolonetConfig'],
			notifications: true // We want this if we want to receive credentials
		}).then((credentials) => {
			this.setUPortData(credentials, true);
			this.signedIn = true;
			return Promise.resolve();
		}, (error) => {
			if (error.message === 'Request Cancelled') {
				return Promise.resolve(error)
			}
			return Promise.reject(error)
		});
	}

	/**
	 * Signs the human out, removes saved data and resets avatar path
	 *
	 * @returns {undefined}
	 */
	signOut() {
		localStorage.removeItem('currentIdentity');
		this.avatarPath = ANONYMOUS_AVATAR_PATH;
		delete this.uPortData;
		this.signedIn = false;
	}

	/**
	 * Fetches the identity trying the following options in this order:
	 * 1. Saved in this instance
	 * 2. Saved in LocalStorage
	 *
	 * @returns {object} identity
	 * @emits Identity#error error - Error that may occur when parsing the JSON
	 */
	getIdentity() {
		if (this.uPortData) {
			return this.uPortData;
		}

		const savedIdentity = localStorage.getItem('currentIdentity');

		if (!savedIdentity) {
			return;
		}

		try {
			const identity = JSON.parse(savedIdentity);
			this.setUPortData(identity);
			return identity;
		} catch (error) {
			/**
			 * Identity error that may happen parsing the JSON
			 *
			 * @event Identity#error
			 * @type {Error}
			 * 
			 */
			this.emit('error', error);
		}
	}

	/**
	 * Saves the received credentials to this instance and optionally saves them to LocalStorage
	 *
	 * @param {object} credentials - The human's credentials from uPort
	 * @param {boolean} save - Whether to save the credentials to LocalStorage
	 *
	 * @returns {undefined}
	 */
	setUPortData(credentials, save) {
		this.uPortData = credentials;
		if (credentials.HolonetConfig) {
			const config = JSON.parse(credentials.HolonetConfig);
			this.avatarPath = config.avatar3D ||
								ANONYMOUS_AVATAR_PATH;
		}

		if (save) {
			localStorage.setItem('currentIdentity', JSON.stringify(this.uPortData));
		}
	}
}

export {Identity};

