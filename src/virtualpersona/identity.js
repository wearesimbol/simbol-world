// 0x04698541ee0770a5774a94364172322d6b3191de8e8c560cb470a30a4bad2ab913c02f1978d0b7a085dcaad648e63b6c7ee95eaa82d6be9dd3a069aac29a399c5a
import uport from '../libs/uport-connect';

const ANONYMOUS_AVATAR_PATH = 'assets/models/AnonymousVP.gltf';

const Identity = {

	/** @property {boolean} signedIn - Whether the human is signed in */
	signedIn: false,

	/** @property {string} avatarPath = Path to the current human's avatar, defaults to the anonymous avatar path */
	avatarPath: ANONYMOUS_AVATAR_PATH,

	/**
	 * Initializes an identity by instantiating uPort and fethcing the current identity
	 *
	 * @return {undefined}
	 */
	init() {
		this.uPort = new uport.Connect('Holonet', {
			clientId: '2on1AwSMW48Asek7N5fT9aGf3voWqMkEAXJ',
			network: 'rinkeby',
			signer: uport.SimpleSigner('12856cfa7d87eca683cbccf3617c82c615b8cac4347db20b1874884c2bc6453d') // eslint-disable-line new-cap
		});

		const identity = this.getIdentity();
		this.signedIn = !!identity;
	},

	/**
	 * Signs the human in by showing a uPort QR code, and then saving the data
	 *
	 * @param {string} information - Pieces of information to be requested to the human
	 *
	 * @return {Promise} promise
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
		}, (error) => Promise.reject(error));
	},

	/**
	 * Signs the human out, removes saved data and resets avatar path
	 *
	 * @return {undefined}
	 */
	signOut() {
		localStorage.removeItem('currentIdentity');
		this.avatarPath = ANONYMOUS_AVATAR_PATH;
		delete this.uPortData;
		this.signedIn = false;
	},

	/**
	 * Fetches the identity trying the following options in this order:
	 * 1. Saved in this instance
	 * 2. Saved in LocalStorage
	 *
	 * @return {object} identity
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
			console.log(error);
		}
	},

	/**
	 * Saves the received credentials to this instance and optionally saves them to LocalStorage
	 *
	 * @param {object} credentials - The human's credentials from uPort
	 * @param {boolean} save - Whether to save the credentials to LocalStorage
	 *
	 * @return {undefined}
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
};

export {Identity};

