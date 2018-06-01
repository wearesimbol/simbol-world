'use strict';

import {bugfix} from './textsimbolfix';
import {Simbols} from '../../src/simbols/simbols';
import {TextSimbol} from '../../src/simbols/text';
import {NodeSimbol} from '../../src/simbols/node';

describe('Simbols', () => {

	it('should export simbols', () => {
		assert.equal(Simbols.TextSimbol, TextSimbol);
		assert.equal(Simbols.NodeSimbol, NodeSimbol);
	});
});
