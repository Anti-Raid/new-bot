const {SlashCommandBuilder} = require("@discordjs/builders")
const { CommandInteraction, EmbedBuilder } = require("discord.js")
module.exports = {
    data: new SlashCommandBuilder().setName("ping").setDescription("Check the bot\'s ping"),
    /**
     * 
     * @param {CommandInteraction} interaction 
     */
    run: async (interaction) => {
        interaction.reply({embeds: [new EmbedBuilder().setDescription(`The bot ping is \`${interaction.client.ws.ping}\`ms`)]})
    }

}