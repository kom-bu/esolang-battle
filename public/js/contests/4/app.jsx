const React = require('react');
const {Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Input} = require('reactstrap');
const Map = require('./map.js');
const api = require('./api.js');

class App extends React.Component {
	constructor(props, context) {
		super(props, context);

		this.state = {
			code: '',
			files: [],
			faces: [],
			languages: [],
			selectedLanguage: null,
			isPending: false,
			message: null,
			messageType: 'success',
			messageDetail: null,
		};

		this.pendingSubmission = null;

		this.updateLanguages();

		this.socket = window.io(location.origin);
		this.socket.on('update-submission', this.handleUpdateSubmission);
		this.socket.on('update-languages', this.handleUpdateLanguages);
	}

	updateLanguages = async () => {
		const languages = await api('GET', '/contests/4/languages');
		this.setState({languages});
		this.map && this.map.setFaceColors(languages.map((language) => {
			if (language.type === 'unknown') {
				return 'black';
			}

			if (language.team === undefined) {
				if (language.available === true) {
					return 'white';
				}
				return 'grey';
			}

			return ['red', 'blue', 'green'][language.team];
		}));
	}

	handleRefCanvas = (node) => {
		this.canvas = node;
		if (!this.mapInited) {
			this.mapInited = true;
			this.map = new Map(this.canvas, this.handleFacesUpdate, this.handleClickFace);
		}
	};

	handleFacesUpdate = (faces) => {
		this.setState({faces});
	};

	handleClickFace = (faceIndex) => {
		this.setState(({languages}) => {
			const language = languages[faceIndex];
			if (!language || language.available !== true) {
				return {};
			}
			return {selectedLanguage: language};
		});
	};

	handleChangeCode = (event) => {
		this.setState({
			code: event.target.value,
		});
	};

	handleChangeFile = (event) => {
		this.setState({
			files: event.target.files,
		});
	};

	handleCloseModal = () => {
		this.setState({
			code: '',
			files: [],
			message: null,
			messageDetail: null,
			selectedLanguage: null,
		});
	}

	handleSend = async () => {
		if (this.state.isPending) {
			return;
		}

		this.setState({
			isPending: true,
			message: null,
			messageDetail: null,
		});

		const result = await api('POST', '/contests/4/submission', {
			language: this.state.selectedLanguage.slug,
			...(this.state.files.length > 0 ? {file: this.state.files[0]} : {code: this.state.code}),
		});

		if (result.error) {
			this.setState({
				message: result.error,
				messageType: 'danger',
				messageDetail: null,
				isPending: false,
			});
		}

		this.pendingSubmission = result._id;
	}

	handleUpdateSubmission = async (data) => {
		if (this.pendingSubmission !== data._id) {
			return;
		}

		this.pendingSubmission = null;
		const submission = await api('GET', '/contests/4/submission', {_id: data._id});

		if (submission.status === 'failed') {
			this.setState({
				message: 'Submission failed.',
				messageType: 'danger',
				messageDetail: data._id,
				isPending: false,
			});
		} else if (submission.status === 'success') {
			this.setState({
				message: 'You won the language!',
				messageType: 'danger',
				messageDetail: data._id,
				isPending: false,
			});
		}
	}

	render() {
		const selectedLanguage = this.state.selectedLanguage || {};
		return (
			<div>
				<div className="map">
					<div ref={this.handleRefCanvas}/>
					<div className="language-labels">
						{[...this.state.faces.entries()]
							.filter(([, face]) => face.z < 0.99915)
							.map(([index, face]) => (
								<div
									key={index}
									className="language-label"
									style={{
										color: (this.state.languages[index] && this.state.languages[index].team === undefined) ? '#222' : 'white',
										transform: `translate(${face.x}px, ${face.y}px) translate(-50%, -50%) scale(${(0.99915 - face.z) * 3000})`,
									}}
								>
									{(this.state.languages[index] && this.state.languages[index].name) || ''}
								</div>
							))}
					</div>
				</div>
				<Modal isOpen={this.state.selectedLanguage !== null} toggle={this.handleCloseModal} className="language-modal">
					<ModalHeader>{selectedLanguage.name}</ModalHeader>
					<ModalBody>
						{selectedLanguage.solution ? (
							<React.Fragment>
								<p>Owner: {selectedLanguage.solution.user} ({selectedLanguage.team})</p>
								<p>
									{'Solution: '}
									<a href={`/contests/4/submissions/${selectedLanguage.solution._id}`} target="_blank">
										{selectedLanguage.solution._id}
									</a>
									{` (${selectedLanguage.solution.size} bytes)`}
								</p>
							</React.Fragment>
						) : (
							<React.Fragment>
								<p>Owner: N/A</p>
								<p>Solution: N/A</p>
							</React.Fragment>
						)}
						<Form>
							<FormGroup
								disabled={!this.state.files || this.state.files.length === 0}
							>
								<Input
									type="textarea"
									className="code"
									value={this.state.code}
									onChange={this.handleChangeCode}
									disabled={this.state.files && this.state.files.length > 0}
								/>
							</FormGroup>
							<FormGroup>
								<Input type="file" onChange={this.handleChangeFile}/>
							</FormGroup>
						</Form>
						{this.state.message && (
							<p className={`p-3 mb-2 bg-${this.state.messageType} text-white`}>
								{this.state.message}
								{this.state.messageDetail && (
									<React.Fragment>
										{' Check out the detail '}
										<a href={`/contests/4/submissions/${this.state.messageDetail}`} target="_blank">here</a>.
									</React.Fragment>
								)}
							</p>
						)}
					</ModalBody>
					<ModalFooter>
						<Button color="primary" onClick={this.handleSend} disabled={this.state.isPending}>Send</Button>{' '}
						<Button color="secondary" onClick={this.handleCloseModal}>Cancel</Button>
					</ModalFooter>
				</Modal>
			</div>
		);
	}
}

module.exports = App;
