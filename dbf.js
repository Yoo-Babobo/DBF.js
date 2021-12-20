"use strict";

const fs = require("fs");

/**
 * Main class for managing a Discord bot
 */
class DiscordBot {
    /**
     * Constructor for creating a Discord bot
     * @param {object} data 
     * @returns {DiscordBot} Discord bot
     */
    constructor(data = {
        /**
         * Discord API
         */
        discordApi: null,
        /**
         * Rest API
         */
        restApi: null,
        /**
         * Discord client `IGNORE THIS`
         */
        client: null,
        /**
         * Discord client options. Discord client intents are required
         */
        clientOptions: [],
        /** 
         * Discord bot token `REQUIRED`
         */
        token: "",
        /**
         * Discord bot prefixes. Defaults to `!`
         */
        prefixes: ["!"],
        /**
         * Discord bot owners
         */
        owners: [],
        /** 
         * Discord bot blocked users
         */
        blockedUsers: [],
        /**
         * Discord bot statuses
         * ```json
         * [
                {
                    "name": "!help",
                    "type": "PLAYING",
                    "status": "idle"
                },
                {
                    "name": "I'm a Discord bot!",
                    "type": "WATCHING",
                    "status": "dnd"
                }
            ]
         * ```
         */
        statuses: [],
        /** 
         * Discord bot status interval in which the Discord bot status should be updated. Defaults to `15000` (15 seconds)
         */
        statusInterval: 15000,
        /**
         * Discord bot responces. Defaults to:
         * ```json
         * "command_unknown": [
                "This command doesn't exist"
            ],
            "command_error": [
                "Something went wrong: ```{{error}}```"
            ],
            "command_cooldown": [
                "Please wait `{{cooldown}}` second{{s}} before using this command again"
            ],
            "command_guild_only": [
                "This command can only be used in a server"
            ],
            "command_dms_only": [
                "This command can only be used in DMs"
            ],
            "command_owners_only": [
                "Only bot owners can use this command"
            ],
            "command_blocked": [
                "You are blocked from using this command"
            ],
            "command_no_permission": [
                "You don't have permission to use this command"
            ],
            "command_no_bot_permission": [
                "I don't have permission to use this command"
            ],
            "command_incorrect_usage": [
                "Please use this command correctly: `{{usage}}`"
            ]
         * ```
         */
        responces: {
            "command_unknown": [
                "This command doesn't exist"
            ],
            "command_error": [
                "Something went wrong: ```{{error}}```"
            ],
            "command_cooldown": [
                "Please wait `{{cooldown}}` second{{s}} before using this command again"
            ],
            "command_guild_only": [
                "This command can only be used in a server"
            ],
            "command_dms_only": [
                "This command can only be used in DMs"
            ],
            "command_owners_only": [
                "Only bot owners can use this command"
            ],
            "command_blocked": [
                "You are blocked from using this command"
            ],
            "command_no_permission": [
                "You don't have permission to use this command"
            ],
            "command_no_bot_permission": [
                "I don't have permission to use this command"
            ],
            "command_incorrect_usage": [
                "Please use this command correctly: `{{usage}}`"
            ]
        },
        /**
         * Discord bot slash commands. Defaults to `false`
         */
        slash: false,
        /**
         * Discord bot root directory path in which all subfolder that need to be loaded are found. Defaults to `./`
         */
        path: ".",
        /**
         * Discord bot commands folder in which all Discord bot command files are located. Defaults to `command`
         */
        commandsPath: "commands",
        /**
         * Discord bot commands folder in which all Discord bot event files are located. Defaults to `events`
         */
        eventsPath: "events",
        /**
         * Discord bot buttons folder in which all Discord bot event button are located. Defaults to `buttons`
         */
        buttonsPath: "buttons",
        /**
         * Discord bot select menus folder in which all Discord bot select menu files are located. Defaults to `selects`
         */
        selectMenusPath: "selects",
        /**
         * Discord bot slash commands folder in which all Discord bot slash command files are located. Defaults to `slash`
         */
        slashPath: "slash",
        /**
         * Log information to console. Defaults to `true`
         */
        logging: true,
        /**
         * Discord ot development. Defaults to `true`
         */
        dev: true,
        /**
         * Discord bot development guild id
         */
        devGuildId: ""
    }) {
        /**
         * Discord API
         */
        this.discord = data.discordApi || null;
        /**
         * Discord client `IGNORE THIS`
         */
        this.client = new this.discord.Client(data.clientOptions || []);
        /**
         * Discord bot token `REQUIRED`
         */
        this.token = data.token || "";
        /**
         * Discord bot data
         */
        this.data = data || {};
        /**
         * Discord client options. Discord client intents are required
         */
        this.options = data.clientOptions || [];
        
        this.client.once("ready", () => this.__ready());
        this.client.on("messageCreate", message => this.__message(message));
        this.client.on("interactionCreate", interaction => this.__interaction(interaction));

        return this;
    }

    /**
     * Logs a message to the console. Useful only for this class. Use console.log instead
     * @param {...string} message Message to log
     * @returns {DiscordBot} Discord bot
     */
    __log(...message) {
        if (this.data.dev && (typeof this.data.logging === "undefined" ? true : this.data.logging)) console.log("DBF => " + message.join(" "));
        return this;
    }

    /**
     * Logs the bot into Discord
     * @returns {DiscordBot} Discord bot
     */
    login() {
        this.client.login(this.token);
        return this;
    }

    /**
     * Logs the bot out of Discord
     * @returns {DiscordBot} Discord bot
     */
    logout() {
        this.client.destroy();
        return this;
    }

    /**
     * Callback for when the `ready` event is triggered on the bot
     */
    onready() {}

    /**
     * This is the internal `ready` callback for the bot. Do not re-assign. Re-assign `onready()` instead
     */
    __ready() {
        this.onready();
        this.__status();
        this.statusLoop = setInterval(() => this.__status(), this.data.statusInterval || 15000);
        this.__loadCommands((this.data.path || ".") + "/" + (this.data.commandsPath || "commands"));
        this.__registerEvents((this.data.path || ".") + "/" + (this.data.eventsPath || "events"));
        this.__registerButtons((this.data.path || ".") + "/" + (this.data.buttonsPath || "buttons"));
        this.__registerSelectMenus((this.data.path || ".") + "/" + (this.data.selectMenusPath || "selects"));
        this.__deployCommands((this.data.path || ".") + "/" + (this.data.slashPath || "slash"), this.data.restApi || null, this.data.version || "9", this.data.dev || false, this.data.devId || "")
        console.log("\nDBF => Bot (" + this.client.user.username + ") has successfully started\n");
    }

    /**
     * Callback for when the `messageCreate` event is triggered on the bot
     * @param {object} message Message object
     */
    onmessage(message) {}

    /**
     * This is the internal `messageCreate` callback for the bot. Do not re-assign. Re-assign `onmessage()` instead
     * @param {object} message Object with data from the message
     */
    __message(message) {
        this.onmessage(message);

        const client = message.client;
        const responces = this.data.responces || {
            "command_unknown": [
                "This command doesn't exist"
            ],
            "command_error": [
                "Something went wrong: ```{{error}}```"
            ],
            "command_cooldown": [
                "Please wait `{{cooldown}}` second{{s}} before using this command again"
            ],
            "command_guild_only": [
                "This command can only be used in a server"
            ],
            "command_dms_only": [
                "This command can only be used in DMs"
            ],
            "command_owners_only": [
                "Only bot owners can use this command"
            ],
            "command_no_permission": [
                "You don't have permission to use this command"
            ],
            "command_no_bot_permission": [
                "I don't have permission to use this command"
            ],
            "command_incorrect_usage": [
                "Please use this command correctly: `{{usage}}`"
            ]
        };

        var command_name = "";

        try {
            if (message.author.bot) return;
            if (message.webhookID) return;
    
            var prefix = false;
            for (const thisPrefix of this.data.prefixes || ["!"]) if (message.content.startsWith(thisPrefix)) prefix = thisPrefix;
            if (!prefix) return;
            
            const raw_args = message.content.slice(prefix.length).trim().split(/ +/);
            command_name = raw_args.shift().toLowerCase();
            const args = raw_args.slice(0);
            var embed;
            var msg;
    
            if (command_name === "" || command_name === null) return;
    
            if (!client.commands.has(command_name)) {
                msg = responces.command_unknown[Math.floor(Math.random() * responces.command_unknown.length)]
                    .replace(/{{command}}/g, command_name)
                    .replace(/{{prefix}}/g, prefix);
    
                embed = new this.discord.MessageEmbed()
                    .setColor("RED")
                    .setTitle("Unknown Command")
                    .setDescription(msg);
                
                return message.channel.send({ embeds: [embed] });
            }
    
            var owner = false;
            for (const thisOwner of this.data.owners || []) if (message.author.id === thisOwner) owner = thisOwner;
            
            const command = client.commands.get(command_name) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(command_name));
            const num_args = command.args || 0;
            const { cooldowns } = client;

            if (!this.data.blockedUsers) this.data.blockedUsers = [];
            if (!command.blockedUsers) command.blockedUsers = [];
            if (!command.unblockedUsers) command.unblockedUsers = [];

            // TODO this doesn't work... SO MAKE IT WORK
            if (this.data.blockedUsers.includes(message.author.id) || command.blockedUsers.includes(message.author.id)) {
                if (!command.unblockedUsers.includes(message.author.id)) {
                    msg = responces.command_blocked[Math.floor(Math.random() * responces.command_blocked.length)]
                        .replace(/{{author}}/g, message.author.username)
                        .replace(/{{command}}/g, command_name);
                    
                    embed = new this.discord.MessageEmbed()
                        .setColor("RED")
                        .setTitle("Blocked")
                        .setDescription(msg);
                    
                    return message.channel.send({ embeds: [embed] });
                }
            }
    
            if (!cooldowns.has(command.name)) cooldowns.set(command.name, new this.discord.Collection());
    
            const now = Date.now();
            const timestamps = cooldowns.get(command.name);
            const cooldown_amount = (command.cooldown || 1) * 1000;
    
            if (timestamps.has(message.author.id)) {
                const expiration_time = timestamps.get(message.author.id) + cooldown_amount;
                if (now < expiration_time) {
                    const timeLeft = (expiration_time - now) / 1000;
                    msg = responces.command_cooldown[Math.floor(Math.random() * responces.command_cooldown.length)]
                        .replace(/{{s}}/g, s(parseFloat(timeLeft.toFixed(1))))
                        .replace(/{{cooldown}}/g, timeLeft.toFixed(1).replace("0.", ".").replace(".0", ""))
                        .replace(/{{author}}/g, message.author.username)
                        .replace(/{{command}}/g, command_name);
                    
                    embed = new this.discord.MessageEmbed()
                        .setColor("RED")
                        .setDescription(msg);
                    
                    return message.channel.send({ embeds: [embed] });
                }
            }
    
            if (command.guildOnly && message.channel.type !== "text") {
                msg = responces.command_guild_only[Math.floor(Math.random() * responces.command_guild_only.length)]
                    .replace(/{{author}}/g, message.author.username)
                    .replace(/{{command}}/g, command_name);
    
                embed = new this.discord.MessageEmbed()
                    .setColor("RED")
                    .setDescription(msg);
                
                return message.channel.send({ embeds: [embed] });
            }
    
            if (command.dmsOnly && message.channel.type !== "dm") {
                msg = responces.command_dms_only[Math.floor(Math.random() * responces.command_dms_only.length)]
                    .replace(/{{author}}/g, message.author.username)
                    .replace(/{{command}}/g, command_name);
    
                embed = new this.discord.MessageEmbed()
                    .setColor("RED")
                    .setDescription(msg);
                
                return message.channel.send({ embeds: [embed] });
            }
    
            if (command.ownersOnly && !owner) {
                msg = responces.command_owners_only[Math.floor(Math.random() * responces.command_owners_only.length)]
                    .replace(/{{s}}/g, s(owners.length))
                    .replace(/{{author}}/g, message.author.username)
                    .replace(/{{command}}/g, command_name);
    
                embed = new this.discord.MessageEmbed()
                    .setColor("RED")
                    .setDescription(msg);
                
                return message.channel.send({ embeds: [embed] });
            }
    
            if (command.permissions) {
                const author_perms = message.channel.permissionsFor(message.author);
                if (!author_perms || !author_perms.has(command.permissions) || !author_perms.has("ADMINISTRATOR")) {
                    if (Array.isArray(command.permissions)) msg = responces.command_no_permission[Math.floor(Math.random() * responces.command_no_permission.length)]
                        .replace(/{{permissions}}/g, command.permissions.join(", ").toUpperCase())
                        .replace(/{{s}}/g, s(command.permissions.length))
                        .replace(/{{author}}/g, message.author.username)
                        .replace(/{{command}}/g, command_name);
                    else msg = responces.command_no_permission[Math.floor(Math.random() * responces.command_no_permission.length)]
                        .replace(/{{permissions}}/g, command.permissions.toUpperCase())
                        .replace(/{{s}}/g, "s")
                        .replace(/{{author}}/g, message.author.username)
                        .replace(/{{command}}/g, command_name);
                    
                    embed = new this.discord.MessageEmbed()
                        .setColor("RED")
                        .setDescription(msg);
                    
                    return message.channel.send({ embeds: [embed] });
                }
            }
    
            if (command.botPermissions) {
                const bot_perms = message.channel.permissionsFor(message.client.user);
                if (!bot_perms || !bot_perms.has(command.botPermissions) || !bot_perms.has("ADMINISTRATOR")) {
                    if (Array.isArray(command.botPermissions)) msg = responces.command_no_bot_permission[Math.floor(Math.random() * responces.command_no_bot_permission.length)]
                        .replace(/{{permissions}}/g, command.botPermissions.join(", ").toUpperCase())
                        .replace(/{{s}}/g, s(command.botPermissions.length))
                        .replace(/{{author}}/g, message.author.username)
                        .replace(/{{command}}/g, command_name);
                    else msg = responces.command_no_bot_permission[Math.floor(Math.random() * responces.command_no_bot_permission.length)]
                        .replace(/{{permissions}}/g, command.botPermissions.toUpperCase())
                        .replace(/{{s}}/g, "s")
                        .replace(/{{author}}/g, message.author.username)
                        .replace(/{{command}}/g, command_name);
                    
                    embed = new this.discord.MessageEmbed()
                        .setColor("RED")
                        .setDescription(msg);
                    
                    return message.channel.send({ embeds: [embed] });
                }
            }
    
            if (num_args != args.length) {
                var result = command.usage ? " " + command.usage : num_args === 0 ? "" : " <" + num_args + " required argument" + s(num_args) + ">";
                msg = responces.command_incorrect_usage[Math.floor(Math.random() * responces.command_incorrect_usage.length)]
                    .replace(/{{usage}}/g, prefix + command_name + result)
                    .replace(/{{author}}/g, message.author.username)
                    .replace(/{{command}}/g, command_name);
                
                embed = new this.discord.MessageEmbed()
                    .setColor("RED")
                    .setDescription(msg);
                
                return message.channel.send({ embeds: [embed] });
            }
    
            timestamps.set(message.author.id, now);
            setTimeout(() => timestamps.delete(message.author.id), cooldown_amount);
    
            command.execute(message, args);
        } catch (error) {
            console.error(error)
            msg = responces.command_error[Math.floor(Math.random() * responces.command_error.length)]
                .replace(/{{error}}/g, error)
                .replace(/{{author}}/g, message.author.username)
                .replace(/{{command}}/g, command_name);
            
            embed = new this.discord.MessageEmbed()
                .setColor("RED")
                .setTitle("Error")
                .setDescription(msg);
            
            return message.channel.send({ embeds: [embed] });
        }
    }

    /**
     * Callback for when the `interactionCreate` event is triggered on the bot
     * @param {object} interaction Interaction object
     */
    oninteraction(interaction) {}

    /**
     * This is the internal `interactionCreate` callback for the bot. Do not re-assign. Re-assign `oninteraction()` instead
     * @param {object} interaction Object with data from the interaction
     */
    async __interaction(interaction) {
        this.oninteraction(interaction);

        const responces = this.data.responces;

        if (interaction.isCommand()) {
            const command = interaction.client.slash.get(interaction.commandName);
            if (!command) return;
        
            try { await command.execute(interaction); }
            catch (error) {
                console.error(error);

                msg = responces.command_error[Math.floor(Math.random() * responces.command_error.length)]
                    .replace(/{{error}}/g, error);
                
                embed = new this.discord.MessageEmbed()
                    .setColor("RED")
                    .setTitle("Error")
                    .setDescription(msg);
                
                await interaction.reply({ embeds: [embed], ephemeral: true });
            }
        } else if (interaction.isButton()) {
            const button = interaction.client.buttons.get(interaction.customId);
            if (!button) return;
            try { await button.execute(interaction); }
            catch (error) { console.error(error); }
        } else if (interaction.isSelectMenu()) {
            const select = interaction.client.selects.get(interaction.customId);
            if (!select) return;
            try { await select.execute(interaction); }
            catch (error) { console.error(error); }
        }
    }

    /**
     * Internal function to set status(s) of the bot, selected randomly from `data.responces`
     * @returns {DiscordBot} Discord bot
     */
    __status() {
        const status = this.data.statuses[Math.floor(Math.random() * this.data.statuses.length)];
        this.client.user.setPresence({
            activities: [
                {
                    name: status.name
                        .replace(/{{name}}/g, this.client.user.username)
                        .replace(/{{prefix}}/g, !this.data.prefixes ? "!" : this.data.prefixes[0])
                        .replace(/{{servers}}/g, this.client.guilds.cache.size)
                        .replace(/{{channels}}/g, this.client.channels.cache.size)
                        .replace(/{{users}}/g, this.client.users.cache.size) || (!this.data.prefixes ? "!" : this.data.prefixes[0]) + "help",
                    type: status.type || "PLAYING",
                    url: status.url || null
                }
            ],
            status: status.status || "online"
        });
        return this;
    }

    /**
     * Internal function for loading commands from their files
     * @param {string} path Path to commands folder. Defaults to `./commands`
     * @returns {DiscordBot} Discord bot
     */
    __loadCommands(path = "./commands") {
        var files = [];
        try { files = fs.readdirSync(path).filter(file => file.endsWith(".js")); }
        catch { return this; }

        this.client.commands = new this.discord.Collection();
        this.client.cooldowns = new this.discord.Collection();

        if (files.length < 1) return this;

        this.__log("Registering commands");

        for (const file of files) {
            const command = require(path + "/" + file);
            this.__log("Registering command " + command.name);
            this.client.commands.set(command.name, command);
            this.__log("Successfully registered command " + command.name);
        }

        this.__log("All commands have been registered");

        return this;
    }

    /**
     * Internal function for loading events from their files
     * @param {string} path Path to events folder. Defaults to `./events`
     * @returns {DiscordBot} Discord bot
     */
    __registerEvents(path = "./events") {
        var files = [];
        try { files = fs.readdirSync(path).filter(file => file.endsWith(".js")); }
        catch { return this; }

        if (files.length < 1) return this;
    
        this.__log("Registering events");
    
        for (const file of files) {
            const event = require(path + "/" + file);
            this.__log("Registering event " + event.name);
            if (event.once) this.client.once(event.name, (...args) => event.execute(...args));
            else this.client.on(event.name, (...args) => event.execute(...args));
            this.__log("Successfully registered event " + event.name);
        }
    
        this.__log("All events have been registered");

        return this;
    }

    /**
     * Internal function for loading buttons from their files
     * @param {string} path Path to buttons folder. Defaults to `./buttons`
     * @returns {DiscordBot} Discord bot
     */
     __registerButtons(path = "./buttons") {
        var files = [];
        try { files = fs.readdirSync(path).filter(file => file.endsWith(".js")); }
        catch { return this; }

        this.client.buttons = new this.discord.Collection();

        if (files.length < 1) return this;
    
        this.__log("Registering buttons");
    
        for (const file of files) {
            const button = require(path + "/" + file);
            this.__log("Registering button " + button.id);
            this.client.buttons.set(button.id, button);
            this.__log("Successfully registered button " + button.id);
        }
    
        this.__log("All buttons have been registered");

        return this;
    }

    /**
     * Internal function for loading select menus from their files
     * @param {string} path Path to select menus folder. Defaults to `./selects`
     * @returns {DiscordBot} Discord bot
     */
     __registerSelectMenus(path = "./selects") {
        var files = [];
        try { files = fs.readdirSync(path).filter(file => file.endsWith(".js")); }
        catch { return this; }

        this.client.selects = new this.discord.Collection();

        if (files.length < 1) return this;
    
        this.__log("Registering select menus");
    
        for (const file of files) {
            const select = require(path + "/" + file);
            this.__log("Registering select menu " + select.id);
            this.client.selects.set(select.id, select);
            this.__log("Successfully registered select menu " + select.id);
        }
    
        this.__log("All select menus have been registered");

        return this;
    }

    /**
     * Internal function for loading slash commands from their files
     * @param {string} path Path to slash commands folder. Defaults to `./slash`
     * @param {Function} rest Rest API
     * @param {version} version Rest API version to use. Defaults to `9` (current)
     * @param {boolean} dev Discord bot development. Defaults to `true`
     * @param {string} devId Discord bot guild id
     * @returns {DiscordBot} Discord bot
     */
    __deployCommands(path = "./slash", rest = null, version = "9", dev = true, devId = "") {
        try {
            if (!(this.data.slash || false)) return;
            
            const id = this.client.user.id;
            var files = [];
            try { files = fs.readdirSync(path).filter(file => file.endsWith(".js")); }
            catch { return this; }
            const commands = [];
        
            this.client.slash = new this.discord.Collection();
        
            for (const file of files) {
                const command = require(path + "/" + file);
                commands.push(command.data.toJSON());
                this.client.slash.set(command.data.name, command);
            }
        
            const _rest = new rest({ version: version }).setToken(this.token || "");
        
            (async () => {
                try {
                    if (!dev) {
                        await _rest.put("/applications/" + id + "/commands", { body: commands });
                        this.__log("Successfully registered application commands globally");
                    } else {
                        await _rest.put("/applications/" + id + "/guilds/" + devId + "/commands", { body: commands });
                        this.__log("Successfully registered application commands for development guild");
                    }
                } catch (error) { console.error(error); }
            })();
        } catch (error) { console.error(error); }

        return this;
    }
}

function s(int) { return int == 1 ? "" : "s"; }

module.exports = DiscordBot;