// Packages
import { AntiRaid } from "./core/client";
import sql from "./core/db";


// Create Discord Client
const client = new AntiRaid();

client.logger.info("Database", sql)
/*
// Guild member update event
client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
	// Check if the member's nickname has changed
	if (oldMember.nickname !== newMember.nickname) {
		const guild = await getGuild(oldMember.guild.id);
		const embed = new EmbedBuilder()
			.setColor("Orange")
			.setDescription(
				`***${newMember.user.tag}*** has changed their nickname to **${newMember.nickname}**`
			)
			.setTimestamp();

		if (guild)
			client.channels.cache.get(guild.audit).send({ embeds: [embed] });
	}

	// Check if the member has been added or removed from any roles
	const addedRoles = newMember.roles.cache.filter(
		(role) => !oldMember.roles.cache.has(role.id)
	);
	const removedRoles = oldMember.roles.cache.filter(
		(role) => !newMember.roles.cache.has(role.id)
	);

	if (addedRoles.size > 0) {
		const guild = await getGuild(oldMember.guild.id);
		const embed = new EmbedBuilder()
			.setColor("Green")
			.setDescription(
				`***${
					newMember.user.tag
				}*** has been given the roles: \n**${addedRoles.map(
					(role) => `- ${role}`
				)}**`
			)
			.setTimestamp();

		if (guild)
			client.channels.cache.get(guild.audit).send({ embeds: [embed] });
	}

	if (removedRoles.size > 0) {
		const guild = getGuild(oldMember.guild.id);
		const embed = new EmbedBuilder()
			.setColor("Red")
			.setDescription(
				`***${
					newMember.user.tag
				}*** has has been removed from roles: \n**${removedRoles.map(
					(role) => `- ${role}`
				)}**`
			)
			.setTimestamp();

		if (guild)
			client.channels.cache.get(guild.audit).send({ embeds: [embed] });
	}
});

// Discord Message Events
client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
	// Ignore messages from other bots
	if (newMessage.author.bot) return;

	// Check if the message content has changed
	if (oldMessage.content !== newMessage.content) {
		const guild = await getGuild(oldMessage.guild.id);
		const embed = new EmbedBuilder()
			.setColor("Orange")
			.setDescription(
				`***${newMessage.author.tag}*** edited their message in *${
					newMessage.channel.name
				}*\n**Old Message:** \n> ${oldMessage.content.substr(
					0,
					1024
				)}\n**New Message:**\n> ${newMessage.content.substr(0, 1024)}`
			)
			.setTimestamp();

		if (guild)
			client.channels.cache.get(guild.audit).send({ embeds: [embed] });
	}
});

client.on(Events.MessageDelete, async (message) => {
	// Ignore messages from other bots
	if (message.author.bot) return;

	const guild = await getGuild(oldMember.guild.id);
	const embed = new EmbedBuilder()
		.setColor("Orange")
		.setDescription(
			`***${message.author.tag}*** has deleted their message in *${
				message.channel.name
			}*\n**Deleted Message: \n> ${message.content.substr(0, 1024)}`
		)
		.setTimestamp();

	if (guild) client.channels.cache.get(guild.audit).send({ embeds: [embed] });
});
*/

// Login to Discord
client.start();
