const {stripIndent} = require('common-tags');
const mongoose = require('mongoose');
const docker = require('../engines/docker');
const Contest = require('../models/Contest');
const Language = require('../models/Language');
const Submission = require('../models/Submission');
const User = require('../models/User');

mongoose.Promise = global.Promise;

(async () => {
	await mongoose.connect('mongodb://localhost:27017/esolang-battle');

	await User.updateMany({admin: true}, {$set: {admin: false}});

	for (const id of ['hideo54']) {
		const user = await User.findOne({email: `${id}@twitter.com`});
		if (user) {
			user.admin = true;
			await user.save();
		}
	}

	await Contest.updateOne(
		{id: 'komabasai2021'},
		{
			name: '駒場祭2021 Live CodeGolf Contest',
			id: 'komabasai2021',
			start: new Date('2021-11-23T14:05:00+0900'),
			end: new Date('2021-11-23T15:55:00+0900'),
			description: {
				ja: stripIndent`
				TSG LIVE! 6での東西対決から半年。我が国はTSG派とKMC派の二つに分かれ、混沌を極めていた！
				あまりに壮絶なその争いに終止符を打つべく、政府は各都道府県に代表者を3名ずつ擁立し、多数決によって都道府県ごとに公認サークルを定めることを決定した。
				政府御用達の凄腕プログラマであるあなたの任務は、各都道府県の代表者の投票結果を受け取って、それぞれの公認サークルを発表するプログラムを作ることである。
				やることは自体はとても単純だ。ただし、開発したコードが長すぎると、TSGやKMCのハッカーにより発見、改ざんされる危険性がある。ハッカー達に見つからないために、できる限り短いプログラムを書いてほしい。
				## 入力
				* 47行からなる。
				* 各行はTとKのみからなる3文字の文字列である（Tのみ、Kのみの可能性もある）。
				* 各行（最終行を含む）の末尾には、改行（\`\\n\`）が付与される。
				## 出力
				* 各行について、Tの数がKの数より多ければTと、Kの数がTの数より多ければKと出力せよ。
				* 出力された文字列に含まれる空白文字（改行含む）は無視される。すなわち、各行ごとに結果を出力してもよいし、1行に結果をまとめて出力してもよい。
				* 厳密には、JavaScriptの正規表現で \`/\\s/\` にマッチするすべての文字の違いは無視される。詳細は MDN Web Docs の [文字クラス](https://developer.mozilla.org/ja/docs/Web/JavaScript/Guide/Regular_Expressions/Character_Classes) のページを参照のこと。
				## 制約
				* 特になし
				## 入力例
				\`\`\`
				TKK
				KKT
				TKK
				KKT
				KTT
				KKK
				KTK
				TKT
				KTK
				TTK
				KTK
				TTT
				TTK
				KKT
				TTK
				KTK
				KKK
				TKK
				KKT
				KKT
				KKT
				KTT
				KKK
				TKK
				KTT
				TTK
				TTT
				TTT
				TTK
				TTK
				TKT
				TKT
				KTT
				KKT
				TKK
				KKT
				TTK
				KTT
				TTK
				TKK
				KKT
				KKK
				TKT
				TKT
				KTT
				KKT
				TKK
				\`\`\`
				## 出力例1
				\`\`\`
				K
				K
				K
				K
				T
				K
				K
				T
				K
				T
				K
				T
				T
				K
				T
				K
				K
				K
				K
				K
				K
				T
				K
				K
				T
				T
				T
				T
				T
				T
				T
				T
				T
				K
				K
				K
				T
				T
				T
				K
				K
				K
				T
				T
				T
				K
				K

				\`\`\`
				## 出力例2
				\`\`\`
				KKKKTKKTKTKTTKTKKKKKKTKKTTTTTTTTTKKKTTTKKKTTTKK
				\`\`\`
			`,
				en: '',
			},
		},
		{upsert: true},
	);

	for (const slug of [
		'whitespace',
		'pure-folders',
		'concise-folders',
		'produire',
	]) {
		const languages = await Language.find({slug});
		for (const language of languages) {
			const submissions = await Submission.find({language});
			for (const submission of submissions) {
				console.log('procceing:', submission);

				const disasmInfo = await docker({
					id: slug,
					code: submission.code,
					stdin: '',
					trace: false,
					disasm: true,
				});
				console.log({
					stdout: disasmInfo.stdout.toString(),
					stderr: disasmInfo.stderr.toString(),
				});

				const result = await Submission.update(
					{_id: submission._id},
					{$set: {disasm: disasmInfo.stdout}},
				);
				console.log({result});
			}
		}
	}

	mongoose.connection.close();
})();
