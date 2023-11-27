// Very simple script to bootstrap the core commands. Rest can simply be deployed using the deploy command
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { config } from "./core/config";
import { Logger } from "./core/logger";
import { readFileSync } from "fs";
import { Command } from "./core/client";

// Initalize REST
const rest = new REST().setToken(config.token);
const logger = new Logger();

let guildOnlyCommandsList = [
	"deploy"
];

async function start() {
	let commands = []
	for (const file of guildOnlyCommandsList) {
		logger.info("Bootstrap", `Deploying ${file} to server ${config.main_server}`);

		const command: Command = (await import(`./commands/${file}`))?.default;

		if(!command) {
			throw new Error(`Invalid command ${file.replace(".js", "")}. Please ensure that you are exporting the command as default using \`export default command;\``)
		}

		let neededProps = ["execute", "interactionData"]

		for(let prop of neededProps) {
			if(!command[prop]) {
				throw new Error(`Command ${file} is missing property ${prop}`)
			}
		}

		if(command.interactionData.name != file.replace(".js", "")) {
			throw new Error(`Command ${file} has an invalid name. Please ensure that the name of the command is the same as the file name`)
		}

		commands.push(command.interactionData.toJSON());
	}

	await rest.put(Routes.applicationGuildCommands(config.client_id, config.main_server), { body: commands })
		.then(console.log)
		.catch(console.error);
}

start();