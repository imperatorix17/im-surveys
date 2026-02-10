import { api, opendiscord, utilities } from "#opendiscord"
import * as discord from "discord.js"

// DECLARATION

declare module "#opendiscord-types" {
    export interface ODPluginManagerIds_Default {
        "surveys-create": api.ODPlugin
    }
    export interface ODSlashCommandManagerIds_Default {
        "surveys-create:create": api.ODSlashCommand
    }
    export interface ODTextCommandManagerIds_Default {
        "surveys-create:create": api.ODTextCommand
    }
    export interface ODCommandResponderManagerIds_Default {
        "surveys-create:create": {
            source: "slash" | "text",
            params: {},
            workers: "surveys-create:create" | "surveys-create:logs"
        }
    }
    export interface ODMessageManagerIds_Default {
        "surveys-create:success-message": {
            source: "slash" | "text" | "other",
            params: { question: string; responses: number },
            workers: "surveys-create:success-message"
        },
        "surveys-create:error-message": {
            source: "slash" | "text" | "other",
            params: { error: string },
            workers: "surveys-create:error-message"
        }
    }
    export interface ODEmbedManagerIds_Default {
        "surveys-create:success-embed": {
            source: "slash" | "text" | "other",
            params: { question: string; responses: number },
            workers: "surveys-create:success-embed"
        },
        "surveys-create:error-embed": {
            source: "slash" | "text" | "other",
            params: { error: string },
            workers: "surveys-create:error-embed"
        }
    }
}

// SLASH COMMAND
opendiscord.events.get("onSlashCommandLoad").listen((slash) => {
    slash.add(new api.ODSlashCommand("surveys-create:create", {
        name: "surveys-create",
        description: "Create a poll in the specified channel",
        type: discord.ApplicationCommandType.ChatInput,
        contexts: [discord.InteractionContextType.Guild],
        integrationTypes: [discord.ApplicationIntegrationType.GuildInstall],
        options: [
            {
                name: "question",
                description: "The poll question",
                type: discord.ApplicationCommandOptionType.String,
                required: true,
                maxLength: 200
            },
            {
                name: "channel",
                description: "Channel where the poll will be sent",
                type: discord.ApplicationCommandOptionType.Channel,
                required: true
            },
            {
                name: "answer1",
                description: "First answer (required)",
                type: discord.ApplicationCommandOptionType.String,
                required: true,
                maxLength: 100
            },
            {
                name: "answer2",
                description: "Second answer (required)",
                type: discord.ApplicationCommandOptionType.String,
                required: true,
                maxLength: 100
            },
            {
                name: "answer3",
                description: "Third answer (optional)",
                type: discord.ApplicationCommandOptionType.String,
                required: false,
                maxLength: 100
            },
            {
                name: "answer4",
                description: "Fourth answer (optional)",
                type: discord.ApplicationCommandOptionType.String,
                required: false,
                maxLength: 100
            },
            {
                name: "answer5",
                description: "Fifth answer (optional)",
                type: discord.ApplicationCommandOptionType.String,
                required: false,
                maxLength: 100
            }
        ]
    }))
})

// TEXT COMMAND 
opendiscord.events.get("onTextCommandLoad").listen((text) => {
    const generalConfig = opendiscord.configs.get("opendiscord:general")

    text.add(new api.ODTextCommand("surveys-create:create", {
        name: "surveys-create",
        prefix: generalConfig.data.prefix,
        dmPermission: false,
        guildPermission: true,
        options: [
            {
                type: "string",
                name: "question",
                required: true,
                regex: /^.+$/
            },
            {
                type: "channel",
                name: "channel",
                required: true
            },
            {
                type: "string",
                name: "answer1",
                required: true,
                regex: /^.+$/
            },
            {
                type: "string",
                name: "answer2",
                required: true,
                regex: /^.+$/
            },
            {
                type: "string",
                name: "answer3",
                required: false,
                regex: /^.+$/
            },
            {
                type: "string",
                name: "answer4",
                required: false,
                regex: /^.+$/
            },
            {
                type: "string",
                name: "answer5",
                required: false,
                regex: /^.+$/
            }
        ]
    }))
})

// HELP MENU
opendiscord.events.get("onHelpMenuComponentLoad").listen((menu) => {
    menu.get("opendiscord:extra").add(
        new api.ODHelpMenuCommandComponent("surveys-create:create", 0, {
            slashName: "surveys-create [Question] [Channel] [Answer1] [Answer2]...",
            textName: "surveys-create",
            slashDescription: "Create a poll!",
            textDescription: "Create a poll!"
        })
    )
})

opendiscord.events.get("onEmbedBuilderLoad").listen((embeds) => {
    const generalConfig = opendiscord.configs.get("opendiscord:general")

    // Success Embed (command response)
    embeds.add(new api.ODEmbed("surveys-create:success-embed"))
    embeds.get("surveys-create:success-embed")!.workers.add(
        new api.ODWorker("surveys-create:success-embed", 0, (instance, params, source, cancel) => {
            instance.setTitle(utilities.emojiTitle("📊", "Poll created"))
            instance.setColor(generalConfig.data.mainColor)
            instance.setDescription(`✅ Poll successfully created!`)
            instance.setFooter(`Number of answers: ${params.responses}`)
        })
    )

    // Error Embed
    embeds.add(new api.ODEmbed("surveys-create:error-embed"))
    embeds.get("surveys-create:error-embed")!.workers.add(
        new api.ODWorker("surveys-create:error-embed", 0, (instance, params, source, cancel) => {
            instance.setTitle(utilities.emojiTitle("❌", "Error"))
            instance.setColor(0xff0000)
            instance.setDescription(`**${params.error}**`)
        })
    )
})


opendiscord.events.get("onMessageBuilderLoad").listen((messages) => {
    // Success Message
    messages.add(new api.ODMessage("surveys-create:success-message"))
    messages.get("surveys-create:success-message")!.workers.add(
        new api.ODWorker("surveys-create:success-message", 0, async (instance, params, source, cancel) => {
            instance.addEmbed(
                await opendiscord.builders.embeds
                    .getSafe("surveys-create:success-embed")
                    .build(source, { question: params.question, responses: params.responses })
            )
            if (source === "slash") instance.setEphemeral(true)
        })
    )

    messages.add(new api.ODMessage("surveys-create:error-message"))
    messages.get("surveys-create:error-message")!.workers.add(
        new api.ODWorker("surveys-create:error-message", 0, async (instance, params, source, cancel) => {
            instance.addEmbed(
                await opendiscord.builders.embeds
                    .getSafe("surveys-create:error-embed")
                    .build(source, { error: params.error })
            )
            if (source === "slash") instance.setEphemeral(true)
        })
    )
})


// COMMAND RESPONDER

opendiscord.events.get("onCommandResponderLoad").listen((commands) => {
    const generalConfig = opendiscord.configs.get("opendiscord:general")

    commands.add(
        new api.ODCommandResponder("surveys-create:create", generalConfig.data.prefix, "surveys-create")
    )

    commands.get("surveys-create:create")!.workers.add([
        new api.ODWorker("surveys-create:create", 0, async (instance, params, source, cancel) => {
            const { guild, channel, user } = instance

            if (!guild) {
                instance.reply(
                    await opendiscord.builders.messages
                        .getSafe("opendiscord:error-not-in-guild")
                        .build(source, { channel, user })
                )
                return cancel()
            }

            
            const member =
                guild.members.cache.get(user.id) || (await guild.members.fetch(user.id).catch(() => null))
            if (!member?.permissions.has(discord.PermissionsBitField.Flags.ManageMessages)) {
                instance.reply(
                    await opendiscord.builders.messages
                        .getSafe("opendiscord:error-no-permissions")
                        .build(source, {
                            guild,
                            channel,
                            user,
                            permissions: ["admin", "discord-administrator"]
                        })
                )
                return cancel()
            }

            const question = instance.options.getString("question", true)
            const targetChannel = instance.options.getChannel("channel", true) as discord.TextChannel

            
            const responses: string[] = []
            const a1 = instance.options.getString("answer1", true)
            const a2 = instance.options.getString("answer2", true)
            const a3 = instance.options.getString("answer3", false)
            const a4 = instance.options.getString("answer4", false)
            const a5 = instance.options.getString("answer5", false)

            responses.push(a1, a2)
            if (a3) responses.push(a3)
            if (a4) responses.push(a4)
            if (a5) responses.push(a5)

            if (responses.length < 2) {
                instance.reply(
                    await opendiscord.builders.messages
                        .getSafe("surveys-create:error-message")
                        .build(source, { error: "At least 2 answers are required." })
                )
                return cancel()
            }

            try {
                
                const generalConfig = opendiscord.configs.get("opendiscord:general")
                const emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"]
                const color = generalConfig.data.mainColor as discord.ColorResolvable

                const surveyEmbed = new discord.EmbedBuilder()
                    .setTitle(utilities.emojiTitle("📊", question))
                    .setColor(color)
                    .setDescription(
                        responses
                            .map((r, i) => `${emojis[i]} ${r}`)
                            .join("\n") || "No answers available."
                    )
                    .setFooter({ text: "React with the corresponding emoji to vote." })

                
                const sentMessage = await targetChannel.send({ embeds: [surveyEmbed] })

                for (let i = 0; i < responses.length; i++) {
                    await sentMessage.react(emojis[i])
                }

                await instance.reply(
                    await opendiscord.builders.messages
                        .getSafe("surveys-create:success-message")
                        .build(source, { question, responses: responses.length })
                )
            } catch (err: any) {
                process.emit("uncaughtException", err)
                await instance.reply(
                    await opendiscord.builders.messages
                        .getSafe("surveys-create:error-message")
                        .build(source, { error: "Error sending poll." })
                )
            }
        }),

        new api.ODWorker("surveys-create:logs", -1, (instance, params, source, cancel) => {
            const question = instance.options.getString("question", true)
            opendiscord.log(`${instance.user.displayName} created a poll!`, "plugin", [
                { key: "user", value: instance.user.username },
                { key: "userid", value: instance.user.id, hidden: true },
                { key: "channelid", value: instance.channel.id, hidden: true },
                { key: "question", value: question.substring(0, 80) },
                { key: "method", value: source }
            ])
        })
    ])
})
