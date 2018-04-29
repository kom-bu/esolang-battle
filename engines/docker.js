/* eslint-env browser */
const Docker = require('dockerode');
const assert = require('assert');
const concatStream = require('concat-stream');
const Promise = require('bluebird');
const path = require('path');
const tmp = require('tmp');
const shellescape = require('shell-escape');
const fs = Promise.promisifyAll(require('fs'));

const docker = new Docker();

module.exports = async ({id, code, stdin}) => {
	assert(typeof id === 'string');
	assert(Buffer.isBuffer(code));
	assert(typeof stdin === 'string');
	assert(code.length < 10000);
	assert(stdin.length < 10000);

	const {tmpPath, cleanup} = await new Promise((resolve, reject) => {
		tmp.dir({unsafeCleanup: true}, (error, dTmpPath, dCleanup) => {
			if (error) {
				reject(error);
			} else {
				resolve({tmpPath: dTmpPath, cleanup: dCleanup});
			}
		});
	});

	const stdinPath = path.join(tmpPath, 'INPUT');

	let filename = 'CODE';
	if (id === 'rdmd') {
		filename = 'CODE.d';
	} else if (id === 'c-gcc') {
		filename = 'CODE.c';
	} else if (id === 'concise-folders' || id === 'pure-folders') {
		filename = 'CODE.tar';
	}

	const codePath = path.join(tmpPath, filename);

	await Promise.all([
		fs.writeFileAsync(stdinPath, stdin),
		fs.writeFileAsync(codePath, code),
	]);

	let container = null;

	try {
		// eslint-disable-next-line init-declarations
		let stderrWriter, stdoutWriter;

		const stdoutPromise = new Promise((resolve) => {
			stdoutWriter = concatStream((stdout) => {
				resolve(stdout);
			});
		});

		const stderrPromise = new Promise((resolve) => {
			stderrWriter = concatStream((stderr) => {
				resolve(stderr);
			});
		});

		const dockerVolumePath = (() => {
			if (path.sep === '\\') {
				return tmpPath.replace('C:\\', '/c/').replace(/\\/g, '/');
			}

			return tmpPath;
		})();

		const containerPromise = (async () => {
			container = await docker.createContainer({
				Hostname: '',
				User: '',
				AttachStdin: false,
				AttachStdout: true,
				AttachStderr: true,
				Tty: false,
				OpenStdin: false,
				StdinOnce: false,
				Env: null,
				Cmd: [
					'sh',
					'-c',
					`${shellescape(['script', `/volume/${filename}`])} < /volume/INPUT`,
				],
				Image: `esolang/${id}`,
				Volumes: {
					'/volume': {},
				},
				VolumesFrom: [],
				HostConfig: {
					Binds: [`${dockerVolumePath}:/volume:ro`],
				},
			});

			const stream = await container.attach({
				stream: true,
				stdout: true,
				stderr: true,
			});

			container.modem.demuxStream(stream, stdoutWriter, stderrWriter);
			stream.on('end', () => {
				stdoutWriter.end();
				stderrWriter.end();
			});

			await container.start();
			await container.wait();
			await container.remove();
		})();

		const runner = Promise.all([
			stdoutPromise,
			stderrPromise,
			containerPromise,
		]);

		const executionStart = Date.now();
		const [stdout, stderr] = await runner.timeout(15000);
		const executionEnd = Date.now();

		cleanup();

		return {
			stdout: Buffer.isBuffer(stdout) ? stdout : Buffer.alloc(0),
			stderr: Buffer.isBuffer(stderr) ? stderr : Buffer.alloc(0),
			duration: executionEnd - executionStart,
		};
	} catch (error) {
		if (container) {
			await container.kill().catch();
			await container.remove().catch();
		}
		throw error;
	}
};
