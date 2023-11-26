import { Client, GatewayIntentBits, ActivityType, codeBlock, EmbedBuilder, Events, CommandInteraction, Message, InteractionResponse, Routes, Team, SlashCommandBuilder, Interaction, ModalSubmitInteraction, Colors, PermissionsBitField, TeamMember } from "discord.js";
import { AutocompleteContext, CommandContext } from "./context";
import { Logger } from "./logger";
import { readdirSync } from "node:fs";
import { config } from "./config";

export interface Command {
    userPerms: PermissionsBitField[];
    botPerms: PermissionsBitField[];
    interactionData: SlashCommandBuilder;
    execute: (context: CommandContext) => Promise<void>;
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

            if(command.userPerms.length > 0) {
                if(!interaction.memberPermissions.has(command.userPerms)) {
                    await interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle("Insufficient Permissions")
                                .setDescription(
                                    `You do not have the required permissions to run this command. You need the following permissions: \`${command.userPerms.join(", ")}\``
                                )
                                .setColor(Colors.Red)
                        ]
                    });
                    return;
                }
            }

            if(command.botPerms.length > 0) {
                if(!interaction.appPermissions.has(command.botPerms)) {
                    await interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle("Insufficient Permissions")
                                .setDescription(
                                    `I do not have the required permissions to run this command. I need the following permissions: \`${command.botPerms.join(", ")}\``
                                )
                                .setColor(Colors.Red)
                        ]
                    });
                    return;
                }
            }
    
            try {
                let ctx = new CommandContext(this, interaction)
                return await command.execute(ctx);
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
    
            try {
                let ctx = new AutocompleteContext(this, interaction)
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