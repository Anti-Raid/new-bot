import { EmbedBuilder } from "discord.js";
import { Command, FinalResponse } from "../core/client";
import { SlashCommandBuilder } from "@discordjs/builders";
import { Permission, syncGuildPermissionsByRole } from "../core/common/guilds/guildBase";

let command: Command = {
    userPerms: [Permission.Owner],
    botPerms: [],
    interactionData: new SlashCommandBuilder()
	.setName("sync")
	.setDescription("Sync the permissions of the servers moderation teams.")
	.addStringOption((option) => option
		.setName("by")
		.setDescription("How to sync the permissions?")
        .addChoices(
            {name: "By Role Permissions", value: "role_permissions"},
        )
		.setRequired(true)
	),
    execute: async (ctx) => {
        let by = ctx.interaction.options.getString("by") as string;

        switch (by) {
            case "role_permissions":
                await ctx.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("Orange")
                            .setDescription(
                                `Syncing...`
                            )
                    ],
                })

                let permMap = await syncGuildPermissionsByRole(ctx.interaction.guild)

                await ctx.edit({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("Orange")
                            .setDescription(
                                `Synced! ${JSON.stringify(permMap).slice(0, 4000)}`
                            )
                    ],
                })

                return FinalResponse.dummy()

                break;
            default:
                return FinalResponse.reply(
                    {
                        embeds: [
                            new EmbedBuilder()
                                .setColor("Red")
                                .setDescription(
                                    `Unknown sync method \`${by}\`.`
                                )
                        ]
                    }
                )
        }
    }
}

export default command;