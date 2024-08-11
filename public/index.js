async function Query(formElem) {
	let formData = new FormData(formElem);
	console.log(formData);
	let data = {};

	switch (command) {
		case 'SELECT':
			data.searchTerms = [];
			Object.keys(formData).forEach((key) => (data.searchTerms.push({field: key, value: formData[key]})));
		break;

		case 'INSERT':
			data.insertTerms = [];
			Object.keys(formData).forEach((key) => (data.insertTerms.push({field: key, value: formData[key]})));
		break;

		case 'UPDATE':
			data.updateTerms = [];
			Object.keys(formData).forEach((key) => {
				if (key==='id') {
					data.id = formData[key];
					return;
				};

				data.updateTerms.push({field: key, value: formData[key]});
			});
		break;

		case 'DELETE':
			data.id = formData.id;
		break;
	}

    fetch('/database', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({entity: document.getElementById('HeroSection').dataset.entity, command: formElem.dataset.command, data: data})
	});
}