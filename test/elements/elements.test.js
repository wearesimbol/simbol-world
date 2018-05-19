'use strict';

import {bugfix} from './textelementfix';
import {Elements} from '../../src/elements/elements';
import {TextElement} from '../../src/elements/text';
import {NodeElement} from '../../src/elements/node';

describe('Elements', () => {

	it('should export elements', () => {
		assert.equal(Elements.TextElement, TextElement);
		assert.equal(Elements.NodeElement, NodeElement);
	});
});
