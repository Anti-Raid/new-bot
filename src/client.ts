import { Client, GatewayIntentBits, ActivityType, codeBlock, EmbedBuilder, Events, CommandInteraction, Message, InteractionResponse, Routes, Team, SlashCommandBuilder, Interaction, ModalSubmitInteraction, Colors, PermissionsBitField, TeamMember, AutocompleteInteraction } from "discord.js";
import { AutocompleteContext, CommandContext, ContextReply } from "./context";
import { Logger } from "./logger";
import { readdirSync } from "node:fs";
import { config } from "./config";

export class FinalResponse {
    private dummyResponse: boolean // If true, then there is no final response (all processing is done in the command itself)
    private reply: ContextReply

    constructor() {}

    static dummy() {
        let response = new FinalResponse()
        response.dummyResponse = true
        return response
    }

    static reply(reply: ContextReply) {
        let response = new FinalResponse()
        response.reply = reply
        return response
    }

    /**
     * Mark the response as a dummy response or not (if true, then there is no final response (all processing is done in the command itself))
     * @param dummyResponse If true, then there is no final response (all processing is done in the command itself)
     */
    setDummyResponse(dummyResponse: boolean) {
        this.dummyResponse = dummyResponse
    }

    /**
     * Sets the final response
     * @param reply The final response
     */
    setFinalResponse(reply: ContextReply) {
        this.reply = reply
    }

    /**
     * 
     * @param ctx The context of the command
     * @returns The final response
     */
    async handle(ctx: CommandContext) {
        if(this.dummyResponse) {
            return
        }

        return await ctx.reply(this.reply)
    }
}

export enum BotStaffPerms {
    Owner,
}

export interface Command {
    userPerms: PermissionsBitField[];
    botPerms: PermissionsBitField[];
    botStaffPerms?: BotStaffPerms[];
    interactionData: SlashCommandBuilder;
    execute: (context: CommandContext) => Promise<FinalResponse>;
    autocomplete?: (context: AutocompleteContext) => Promise<void>;
}

export class AntiRaid extends Client {
    commands: Map<string, Command> = new Map();
    logger: Logger
    private hasLoadedListeners: boolean = false;
    private teamOwners: string[] = []

    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMessages,
            ],
        })
        this.logger = new Logger()
    }

    get botOwners(): string[] {
        return this.teamOwners
    }

    /**
     * Prepares the bot for use
     */
    async prepare() {
        if(!this.hasLoadedListeners) {
            this.loadEventListeners()
        }

        // Fetch team owners of bot
        this.rest.setToken(config.token)
        let data = await this.rest.get(Routes.oauth2CurrentApplication())
        this.logger.info("Discord", "Loaded application", data)

        // @ts-expect-error
        let teamMembers: TeamMember[] = data?.team?.members

        this.teamOwners = teamMembers.map(member => member.user.id)

        this.logger.info("Discord", `Loaded ${this.teamOwners.length} team owners`, this.teamOwners)

        await this.loadCommands()
    }

    /**
     * Starts the bot
     */
    async start() {
        await this.prepare()
        await this.login(config.token)
    }

    /**
     * This function waits until a button is pressed then returns the customId of the button
    */
    async waitForButtons(customIds: string[], timeout: number = 60000) {
        return new Promise<string>((resolve, reject) => {
            let listener = (interaction: Interaction) => {
                if(interaction.isButton()) {
                    if(customIds.includes(interaction.customId)) {
                        this.off(Events.InteractionCreate, listener)
                        resolve(interaction.customId)
                    }
                }
            }

            this.on(Events.InteractionCreate, listener)

            setTimeout(() => {
                this.off(Events.InteractionCreate, listener)
                reject("Timed out")
            }, timeout)
        })
    }

    /**
     * This function waits until a modal is submitted based on custom id then returns the customId of the modal and the response
     */
    async waitForModal(customId: string, timeout: number = 60000) {
        return new Promise<{ customId: string, response: ModalSubmitInteraction }>((resolve, reject) => {
            let listener = (interaction: Interaction) => {
                if(interaction.isModalSubmit()) {
                    if(interaction.customId == customId) {
                        this.off(Events.InteractionCreate, listener)
                        resolve({ customId: interaction.customId, response: interaction })
                    }
                }
            }

            this.on(Events.InteractionCreate, listener)

            setTimeout(() => {
                this.off(Events.InteractionCreate, listener)
                reject("Timed out")
            }, timeout)
        })
    }
    
    /**
     * This function is called when the bot is ready
     */
    private async onReady() {
        this.user.setActivity("Development of v6.0.0", {
            type: ActivityType.Watching,
        });
    
        this.user.setStatus("dnd");
    
        this.logger.success("Discord", `Connected as ${this.user.username}!`);
    }

    /**
     * This function handles all the bot staff permissions
     * @param ctx The context of the command
     * @param perms The permissions to check
     * @returns true if the user has the staff perms needed, else false
     */
    private async handleBotStaffPerms(ctx: CommandContext | AutocompleteContext, perms: BotStaffPerms[]) {
        if(perms?.length == 0) return true

        if(perms.includes(BotStaffPerms.Owner)) {
            if(!this.botOwners.includes(ctx.interaction.user.id)) {
                if(ctx instanceof CommandContext) {
                    await ctx.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle("Bot Owners Only")
                                .setDescription(
                                    `This command can only be used by **owners** of the bot.`
                                )
                                .setColor(Colors.Red)
                        ]
                    });
                }
                return false;
            }
        }

        return true
    }

    /**
     * This function handles all the bot/user permissions
     * @param ctx The context of the command
     * @param command The command to check
     * @returns true if the user has the staff perms needed, else false
     */
    private async handlePermissions(ctx: CommandContext | AutocompleteContext, command: Command) {
        if(command.userPerms.length > 0) {
            if(!ctx.interaction.memberPermissions.has(command.userPerms)) {
                if(ctx instanceof CommandContext) {
                    await ctx.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle("Insufficient Permissions")
                                .setDescription(
                                    `You do not have the required permissions to run this command. You need the following permissions: \`${command.userPerms.join(", ")}\``
                                )
                                .setColor(Colors.Red)
                        ]
                    });
                }
                return false;
            }
        }

        if(command.botPerms.length > 0) {
            if(!ctx.interaction.appPermissions.has(command.botPerms)) {
                if(ctx instanceof CommandContext) {
                    await ctx.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle("Insufficient Permissions")
                                .setDescription(
                                    `I do not have the required permissions to run this command. I need the following permissions: \`${command.botPerms.join(", ")}\``
                                )
                                .setColor(Colors.Red)
                        ]
                    });
                }
                return false;
            }
        }

        return true
    }

    /**
     * This is the core event listener for interactions
     */
    private async onInteraction(interaction: Interaction) {
        // Slash Command
        if (interaction.isChatInputCommand()) {
            const command = this.commands.get(interaction.commandName);
    
            if (!command) {
                await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("Command Unavailable")
                            .setDescription(
                                `The command \`${interaction.commandName}\` is not available at this time`
                            )
                            .setColor(Colors.Red)
                            .toJSON(),
                    ]
                });
                return;
            }

            let ctx = new CommandContext(this, interaction)

            if(!this.handleBotStaffPerms(ctx, command.botStaffPerms)) {
                return
            }

            if(!this.handlePermissions(ctx, command)) {
                return
            }
    
            try {
                let fr = await command.execute(ctx);

                if(fr) {
                    await fr.handle(ctx)
                }

                return
            } catch (error) {
                this.logger.error(`Command (${interaction.commandName})`, error);
    
                await interaction.reply(
                    `An error has occured.\n\n${codeBlock("js", error)}`
                );
                return;
            }
        }
    
        // Autocomplete
        if (interaction.isAutocomplete()) {
            const command = this.commands.get(
                interaction.commandName
            );
            if (!command) {
                return this.logger.error(
                    `Autocomplete (${interaction.commandName})`,
                    "Command does not exist"
                );
            }

            if (!command.autocomplete) {
                return this.logger.error(
                    `Autocomplete (${interaction.commandName})`,
                    "Command does not have an autocomplete function"
                );
            }
    
            let ctx = new AutocompleteContext(this, interaction)

            if(!this.handleBotStaffPerms(ctx, command.botStaffPerms)) {
                return
            }

            if(!this.handlePermissions(ctx, command)) {
                return
            }

            try {
                return await command.autocomplete(ctx);
            } catch (error) {
                return this.logger.error(
                    `Autocomplete (${interaction.commandName})`,
                    error
                );
            }
        }
    }

    /**
     * Loads all commands of the bot
     */
    private async loadCommands() {
        if(this.commands.size > 0) {
            this.logger.error("Discord", "Commands have already been loaded")
            return false
        }

        // Commands
        const commandFiles = readdirSync("build/commands")
            .filter((file) => file.endsWith(".js"));
        
        for (const file of commandFiles) {
            this.logger.info("Loader", `Loading command ${file.replace(".js", "")}`)
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

            this.commands.set(command.interactionData.name, command);
        }
    }

    /**
     * Loads all event listeners of the bot
     */
    private loadEventListeners() {
        if(this.hasLoadedListeners) {
            this.logger.error("Discord", "Event listeners have already been loaded")
            return false
        }

        this.once(Events.ClientReady, this.onReady);        

        // Discord Debug Event
        this.on(Events.Debug, (info) => this.logger.debug("Discord", info));

        // Discord Error Event
        this.on(Events.Error, (error) => this.logger.error("Discord", error));

        this.on(Events.InteractionCreate, this.onInteraction);        

        this.hasLoadedListeners = true
    }
}