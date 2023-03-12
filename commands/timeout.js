const { SlashCommandBuilder } = require('@discordjs/builders');
const { Client, CommandInteraction, EmbedBuilder } = require('discord.js');
const ms = require("ms");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout a user for a specified duration.')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to be timed out.')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('duration')
        .setDescription('The duration of the timeout in minutes.')
        .setRequired(true)
        .addChoices(
          {name: `60 seconds`, value: 1000*60},
          {name:`5 minutes`, value: 1000*60*5},
          {name:`10 minutes`, value: 1000*60*10},
        {name:`1 hour`, value: 1000*60*60},
        {name:`1 day`, value: 1000*60*60*24},
        {name:`1 week`, value: 1000*60*60*24*7}))
    .addStringOption(option => option.setName("reason").setDescription("The reason for the timeout.").setMaxLength(1024).setRequired(true)),
/**
 * 
 * @param {Client} client 
 * @param {CommandInteraction} interaction 
 * @returns 
 */
  async execute(client, interaction) {
    const member = interaction.options.getMember('user');
    const user = interaction.options.getUser('user');
    const duration = interaction.options.getInteger('duration');
    const reason = interaction.options.getString("reason");
    console.log(duration);
    if(member.manageable || member.moderatable) {
      member.timeout(duration, `${reason} | Issued by: ${interaction.user.tag}`);
      interaction.reply({embeds: [new EmbedBuilder()
        .setColor("DarkRed")
        .setAuthor({name: `${interaction.user.tag} | ${interaction.guild.name} (${interaction.guild.nameAcronym})`, iconURL: user.displayAvatarURL({dynamic: true})})
      .setDescription(`${user.tag} Timeouted for ${require("ms")(duration, {long: true})}`)
    .setTimestamp()]})
    }else{
      return interaction.reply({content:`${user.tag} couldn't be timeouted. Check if i have the permissions to timeout him/her.`})
    }
  },
};