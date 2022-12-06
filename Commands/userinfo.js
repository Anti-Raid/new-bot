const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, EmbedBuilder } = require('discord.js');
module.exports = {
	data: new SlashCommandBuilder().setName('user').setDescription("Get User info")
    .addUserOption(usr => usr.setName("mention").setDescription("Mention the user").setRequired(true)),
	/**
	 *
	 * @param {CommandInteraction} interaction
	 */
	run: async (interaction, database, fetch) => {\
        // you can rework this i just wanted to test smth
        const user = interaction.options.getUser("mention");
        const fetchedUser = await fetch(`https://api.antiraid.xyz/api/users/get?id=${user.id}`, {method: "GET"}).then(res => res.json());
        console.log(fetchedUser)
        interaction.reply({content: "Progress is successfully unmade.\n> "+fetchedUser})
    }
};
