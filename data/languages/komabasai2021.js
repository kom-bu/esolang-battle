const assert = require('assert');
const flatten = require('lodash/flatten');
const langsData = require('../langs.json');

const languages = [
	['jq', 'rust', '', 'crystal'],
	['brainfuck-esotope', 'aheui', 'c-gcc', ''],
	['', 'python3', 'produire', 'ocaml'],
	['golang', '', 'csharp', 'bash-busybox'],
];

module.exports = flatten(languages).map((language, index) => {
	if (index === 7 || index === 8) {
		return {
			type: 'base',
			team: 1, // blue
		};
	}

	if (index === 2 || index === 13) {
		return {
			type: 'base',
			team: 0, // red
		};
	}

	const langDatum = langsData.find((lang) => lang.slug === language);
	assert(language === '' || langDatum !== undefined, language);

	return {
		type: 'language',
		slug: language,
		name: langDatum ? langDatum.name : '',
		link: langDatum ? langDatum.link : '',
	};
});
