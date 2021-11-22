const assert = require('assert');
const flatten = require('lodash/flatten');
const range = require('lodash/range');
const sample = require('lodash/sample');
const shuffle = require('lodash/shuffle');
const zip = require('lodash/zip');

module.exports.getPrecedingIndices = (cellIndex) => {
	const width = 4;
	const height = 4;
	assert(cellIndex >= 0);
	assert(cellIndex < width * height);

	const x = cellIndex % width;
	const y = Math.floor(cellIndex / width);

	const precedingCells = [];
	precedingCells.push(y * width + (x + 3) % width);
	precedingCells.push(y * width + (x + 1) % width);
	precedingCells.push(((y + 3) % height) * width + x);
	precedingCells.push(((y + 1) % height) * width + x);

	return precedingCells;
};

const tsg = 'T';
const kmc = 'K';
const lineLen = 3;
const lineNum = 47

const generateVote = () => sample([tsg, kmc]);
const generateLine = () => [...Array(lineLen)].map(generateVote).join('');
module.exports.generateInput = () => [...Array(lineNum)].map(generateLine).join('\n') + '\n';

module.exports.isValidAnswer = (input, output) => {

	const correctOutput = input.trim().split('\n').map(line => {
		const tsgNum = (line.match(new RegExp(tsg, 'g')) || []).length;
		const kmcNum = (line.match(new RegExp(kmc, 'g')) || []).length;
		assert(tsgNum !== kmcNum);
		return tsgNum > kmcNum ? tsg : kmc;
	}).join('');
	
	const trimmedOutput = output.toString().replace(/\s/g, '');

	console.log('info:', {input, correctOutput, output, trimmedOutput});

	return trimmedOutput === correctOutput;
};
