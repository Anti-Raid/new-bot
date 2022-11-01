const { CommandInteraction } = require("discord.js");

module.exports = {
    name: "interactionCreate",
    /**
     * 
     * @param {CommandInteraction} interaction 
     */
    run: async (interaction) => {
        if (!interaction.client.commands.has(interaction.commandName)) return interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });

        const command = interaction.client.commands.get(interaction.commandName);
        command.run(interaction)
    }
}