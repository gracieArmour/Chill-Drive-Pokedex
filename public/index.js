/*
CITATIONS

unhandlerejection override (line 9)
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

// function numberParser(str) {
// 	if (parseInt(str)) return parseInt(str);
// 	if (parseFloat(str)) return parseFloat(str);
// 	return str;
// }

async function Query(e, formElem) {
	e.preventDefault();
	let formData = new FormData(formElem);
	console.log(formData);
	let entity = document.getElementById('HeroSection').dataset.entity;
	let command = formElem.dataset.command;
	
	let data = {};

	switch (command) {
		case 'SELECT':
			let searchTerms = [];
			for (let [key, value] of formData) {
				if (value === '') continue;
				searchTerms.push(`${key}=${value}`);
			};
			window.location.href = `/entity/${entity}?${searchTerms.join('&')}`;
			return;

		case 'INSERT':
			data.insertTerms = [];
			for (let [key, value] of formData) {
				if (value === '') continue;
				data.insertTerms.push({field: key, value: value});
			};
			break;

		case 'UPDATE':
			data.updateTerms = [];
			for (let [key, value] of formData) {
				if (value === '') continue;
				
				if (key==='id') {
					data.id = value;
					continue;
				};

				data.updateTerms.push({field: key, value: value});
			};
			break;

		case 'DELETE':
			data.id = formData.id;
			break;
	}

    await fetch(`/database/${entity}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({command: command, data: data})
	});
	
	location.reload();
}