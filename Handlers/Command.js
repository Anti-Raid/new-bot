const { readdirSync } = require('fs');
const { join } = require('path');
const filePath = join(__dirname, '..', 'Commands');
const ascii = require("ascii-table")
const table = new ascii('Commands Check')
module.exports.run = async (client) => {
	for (const cmd of readdirSync(filePath).filter(cmdFile => cmdFile.endsWith('.js'))) {
		const command = require(`${filePath}/${cmd}`);
		// eslint-disable-next-line no-inline-comments
		if (!command.data?.name) {
			table.addRow(command.data.name, "!!", "Missing name data")
		}
		if(!command.data.description) {
			table.addRow(command.data.name, '!!', 'Missing data description')
		}
		if(command.data.name) {
		client.commands.set(command.data.name, command);
		await table.addRow(command.data.name, "✔", 'Loaded');
		}
	}
	console.log(table.toString())
};