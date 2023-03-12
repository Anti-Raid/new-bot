const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
require("dotenv").config();
const fs = require("fs");

const deploy = process.argv[2];

const commands = [];
const commandFiles = fs
  .readdirSync("./Commands")
  .filter((file) => file.endsWith(".js"));

const clientId = "849331145862283275";
const guildId = "822794927754706975";

for (const file of commandFiles) {
  const command = require(`./Commands/${file}`);
  if (command.data) commands.push(command.data.toJSON());
}

const rest = new REST({ version: "9" }).setToken(process.env.token);

(async () => {
  try {
    if (deploy == "deploy") {
      await rest.put(Routes.applicationCommands(clientId), { body: commands });
    } else {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: commands,
      });
    }
  } catch (error) {
    console.error(error);
  }
})();
