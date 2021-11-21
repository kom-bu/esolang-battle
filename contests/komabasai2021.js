const assert = require('assert');
const flatten = require('lodash/flatten');
const range = require('lodash/range');
const sample = require('lodash/sample');
const shuffle = require('lodash/shuffle');
const zip = require('lodash/zip');

module.exports.getPrecedingIndices = (cellIndex) => {
	const width = 5;
	const height = 5;
	assert(cellIndex >= 0);
	assert(cellIndex < width * height);

	const x = cellIndex % width;
	const y = Math.floor(cellIndex / width);

	const precedingCells = [];
	if (x - 1 >= 0) {
		precedingCells.push(y * width + (x - 1));
	}
	if (x + 1 < width) {
		precedingCells.push(y * width + (x + 1));
	}
	if (y - 1 >= 0) {
		precedingCells.push((y - 1) * width + x);
	}
	if (y + 1 < height) {
		precedingCells.push((y + 1) * width + x);
	}

	return precedingCells.filter(
		(cell) => ![0, 4, 5, 9, 10, 14, 15, 19, 20, 24].includes(cell),
	);
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
