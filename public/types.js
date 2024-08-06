function Query(command, data) {
    fetch('/database', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({entity: 'Types', command: command, data: data})
	});
}

document.getElementById("enter-button").addEventListener("click", function () {
    let name = document.getElementById("name-input").value;
    Query('CREATE', {name: name});
});

document.getElementById("search-button").addEventListener("click", function () {
    let name = document.getElementById("name-input").value;
    Query('SELECT', {field: 'name', value: name});
});