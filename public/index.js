/*
Citation for unhandlerejection override below
Date: 8/11/2024
Copied from stackoverflow post
URL: https://stackoverflow.com/a/60782386
*/
window.addEventListener('unhandledrejection', (event) => {
	event.preventDefault();
}, false);

[...document.getElementsByClassName('form-horizontal')].forEach((elem) => {
	elem.addEventListener('submit', (e) => Query(e, elem));
});

async function Query(e, formElem) {
	e.preventDefault();
	let formData = new FormData(formElem);
	console.log(formData);
	let command = formElem.dataset.command;
	let data = {};

	switch (command) {
		case 'SELECT':
			data.searchTerms = [];
			for (let [key, value] of formData) {
				data.searchTerms.push({field: key, value: value});
			};
		break;

		case 'INSERT':
			data.insertTerms = [];
			for (let [key, value] of formData) {
				data.insertTerms.push({field: key, value: value});
			};
		break;

		case 'UPDATE':
			data.updateTerms = [];
			for (let [key, value] of formData) {
				if (key==='id') {
					data.id = value;
					return;
				};

				data.updateTerms.push({field: key, value: value});
			};
		break;

		case 'DELETE':
			data.id = formData.id;
		break;
	}

    fetch(`/database/${document.getElementById('HeroSection').dataset.entity}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({command: command, data: data})
	})
	.then((response) => {
		window.location.href = response.json();
	});
}