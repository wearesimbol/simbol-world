import EventEmitter from 'eventemitter3';

/** Class for keyboard inputs */
class KeyboardController extends EventEmitter {

	/** Listens to keyboard presses and emits accordingly */
	constructor() {
		super();

		document.addEventListener('keydown', this._handleKeyDownEvent.bind(this));
		document.addEventListener('keyup', this._handleKeyUpEvent.bind(this));
	}

	/**
	 * Handles direction keys to move the VirtualPersona
	 *
	 * @param {Event} event - Event object
	 *
	 * @return {undefined}
	 *
	 * @emits KeyboardController#ztranslationstart
	 * @emits KeyboardController#xtranslationstart
	 *
	 * @private
	 */
	_handleKeyDownEvent(event) {
		switch (event.keyCode) {
		// Up or w
		case 87:
		case 38:
			/**
			 * KeyboardController ztranslationstart event,
			 * fired when translation on the Z axis starts
			 *
			 * @event KeyboardController#ztranslationstart
			 * @type {object}
			 * @property direction - Positive or negative depending on the direction
			 */
			this.emit('ztranslationstart', {
				direction: -1
			});
			break;
		// Down or s
		case 83:
		case 40:
			this.emit('ztranslationstart', {
				direction: 1
			});
			break;
		// Left or a
		case 65:
		case 37:
			/**
			 * KeyboardController ztranslationstart event,
			 * fired when translation on the x axis starts
			 *
			 * @event KeyboardController#xtranslationstart
			 * @type {object}
			 * @property direction - Positive or negative depending on the direction
			 */
			this.emit('xtranslationstart', {
				direction: -1
			});
			break;
		// Right or d
		case 68:
		case 39:
			this.emit('xtranslationstart', {
				direction: 1
			});
			break;
		}
	}

	/**
	 * Handles direction keys to move the VirtualPersona
	 *
	 * @param {Event} event - Event object
	 *
	 * @return {undefined}
	 *
	 * @emits KeyboardController#ztranslationend
	 * @emits KeyboardController#xtranslationend
	 *
	 * @private
	 */
	_handleKeyUpEvent(event) {
		switch (event.keyCode) {
		// Up or w, down or s
		case 87:
		case 38:
		case 83:
		case 40:
			/**
			 * KeyboardController ztranslationend event,
			 * fired when translation on the z axis ends
			 *
			 * @event KeyboardController#ztranslationend
			 */
			this.emit('ztranslationend');
			break;
		// Left or a, right or d
		case 65:
		case 37:
		case 68:
		case 39:
			/**
			 * KeyboardController xtranslationend event,
			 * fired when translation on the x axis ends
			 *
			 * @event KeyboardController#xtranslationend
			 */
			this.emit('xtranslationend');
			break;
		}
	}
}

export {KeyboardController};
