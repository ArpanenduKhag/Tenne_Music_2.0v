﻿const Discord = require("discord.js")
const {
  MessageEmbed
} = require("discord.js")
const config = require("../botconfig/config.json")
const ee = require("../botconfig/embed.json")
const {
  format,
  databasing,
  escapeRegex,
  delay
} = require("../handlers/functions")
const playermanager = require("../handlers/playermanager");
module.exports = async (client, message) => {
  try {
    if (message.author.id === client.user.id) {
      try {
        if (message) message.delete({timeout: 4000}).catch(e => console.log("Couldn't delete msg, this is for preventing a bug".gray));
      } catch {
        /* */ }
    } else {
      try {
        if (message) message.delete({timeout: 4000}).catch(e => console.log("Couldn't delete msg, this is for preventing a bug".gray));
      } catch {
        /* */ }
    }
    if (message.author.bot) return; // if the message  author is a bot, return aka ignore the inputs
    //getting the Database Data
    let db = client.setups.get(message.guild.id)
    //getting the Voice Channel Data of the Message Member
    const {
      channel
    } = message.member.voice;
    //if not in a Voice Channel return!
    if (!channel) return message.channel.send(new MessageEmbed().setColor(ee.wrongcolor).setTitle("You need to join a voice channel."));
    //get the lavalink erela.js player information
    const player = client.manager.players.get(message.guild.id);
    //if there is a player and the user is not in the same channel as the Bot return information message
    if (player && channel.id !== player.voiceChannel) return message.channel.send(new MessageEmbed().setColor(ee.wrongcolor).setTitle("❌ I am already playing somewhere else!").setDescription(`You can listen to me in: \`${message.guild.channels.cache.get(player.VoiceChannel).name}\``));
    //if the user is not in the channel as in the db voice channel return error
    if (channel.id !== db.voicechannel) return message.channel.send(new MessageEmbed().setColor(ee.wrongcolor).setTitle(`You need to be in the: \`${message.guild.channels.cache.get(db.voicechannel).name}\` VoiceChannel`));
    //get the prefix regex system
    const prefixRegex = new RegExp(`^(<@!?${client.user.id}>|${escapeRegex(config.prefix)})\\s*`); //the prefix can be a Mention of the Bot / The defined Prefix of the Bot
    //if there is no prefix attached to that message, then search a song on youtueb
    if (!prefixRegex.test(message.content)) {
      return playermanager(client, message, message.content.trim().split(/ +/), "song:youtube");
    }
    //if there is a attached prefix try executing a cmd!
    const [, matchedPrefix] = message.content.match(prefixRegex); //now define the right prefix either ping or not ping
    const args = message.content.slice(matchedPrefix.length).trim().split(/ +/); //create the arguments with sliceing of of the rightprefix length
    const cmd = args.shift().toLowerCase(); //creating the cmd argument by shifting the args by 1
    if (cmd.length === 0) return message.channel.send(new Discord.MessageEmbed()
      .setColor(ee.wrongcolor)
      .setFooter(ee.footertext, ee.footericon)
      .setTitle(`❌ Unkown command, try: **\`${config.prefix}help\`**`)
      .setDescription(`To play Music simply type \`${config.prefix}play <Title / Url>\`\n\nYou can also just type the song name / url into the channel and I'll search for it!`)
    );
    let command = client.commands.get(cmd); //get the command from the collection
    if (!command) command = client.commands.get(client.aliases.get(cmd)); //if the command does not exist, try to get it by his alias
    if (command) //if the command is now valid
    {
      if (!client.cooldowns.has(command.name)) { //if its not in the cooldown, set it too there
        client.cooldowns.set(command.name, new Discord.Collection());
      }
      const now = Date.now(); //get the current time
      const timestamps = client.cooldowns.get(command.name); //get the timestamp of the last used commands
      const cooldownAmount = (command.cooldown || 1) * 1000; //get the cooldownamount of the command, if there is no cooldown there will be automatically 1 sec cooldown, so you cannot spam it^^
      if (timestamps.has(message.author.id)) { //if the user is on cooldown
        const expirationTime = timestamps.get(message.author.id) + cooldownAmount; //get the amount of time he needs to wait until he can run the cmd again
        if (now < expirationTime) { //if he is still on cooldonw
          const timeLeft = (expirationTime - now) / 1000; //get the lefttime
          return message.channel.send(new Discord.MessageEmbed()
            .setColor(ee.wrongcolor)
            .setFooter(ee.footertext, ee.footericon)
            .setTitle(`❌ Please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`)
          ); //send an information message
        }
      }
      timestamps.set(message.author.id, now); //if he is not on cooldown, set it to the cooldown
      setTimeout(() => timestamps.delete(message.author.id), cooldownAmount); //set a timeout function with the cooldown, so it gets deleted later on again
      try {
        client.stats.inc(message.guild.id, "commands"); //counting our Database stats for SERVER
        client.stats.inc("global", "commands"); //counting our Database Stats for GLOBAL
        //run the command with the parameters:  client, message, args, user, text, prefix,
        command.run(client, message, args, message.member, args.join(" "), config.prefix);
      } catch (e) {
        console.log(String(e.stack).red)
        return message.channel.send(new Discord.MessageEmbed()
          .setColor(ee.wrongcolor)
          .setFooter(ee.footertext, ee.footericon)
          .setTitle("❌ Something went wrong while, running the: `" + command.name + "` command")
          .setDescription(`\`\`\`${String(JSON.stringify(e)).substr(0, 2000)}\`\`\``)
        )
      }
    }
  } catch (e) {
    console.log(String(e.stack).bgRed)
  }
}
/**
 * @INFO
 * Bot Coded by Tennessine07
 * @INFO
 */