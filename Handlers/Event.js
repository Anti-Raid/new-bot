const {
	readdirSync,
} = require('fs');
const {
	join,
} = require('path');
const filePath = join(__dirname, '..', 'Events');
const ascii = require("ascii-table")
const table = new ascii('Events Check')

module.exports.run = async (client) => {
	const eventFiles = readdirSync(filePath);
	for (const eventFile of eventFiles) {
		const event = require(`${filePath}/${eventFile}`);
		let eventName = event.name;
		if (!eventName) {
			eventName = eventFile.split('.').shift();
			client.events.set(eventName, event);
			client.on(eventName, event.bind(null, client));
		} else {
			client.events.set(eventName, event);
			if (event.once) client.once(eventName, (...eventArgs) => event.run(...eventArgs, client));
			if (!event.once) client.on(eventName, (...eventArgs) => event.run(...eventArgs, client));

		}
	await table.addRow(eventName, "✔", "Loaded")
	}
	console.log(table.toString())
};