const { SlashCommandBuilder } = require("@discordjs/builders");
const twofactor = require("node-2fa");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("enable-2fa")
		.setDescription("Enable Two-Factor Authentication"),
	async execute(client, interaction, database) {
	   const secret = twofactor.generateSecret({ name: "AntiRaid", account: `${interaction.user.username}#${interaction.user.discriminatior}` });
           
           interaction.user.send({
              content: "Hello, ${interaction.user.username}.\n\nIt seems that you want to enable Two-Factor Authentication, don't worry, the process is extremely simple.\n\nHere is your secret key: /`/`/`${secret.secret}/`/`/`. Just enter this secret key into your Two Factor Authentication app such as Authy, Google Authenticator or Microsoft Authenticator. Once you do this, please send the one-time verification code provided by the authenticator app to confirm all steps were done properly!\n\nIf you do not want to enable 2fa, do not follow any of the instructions provided.`
           });
        },
	async autocomplete(client, interaction, database) {},
};
