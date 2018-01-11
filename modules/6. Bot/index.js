const { Client } = require('eris');
const fs = require('fs');
const events = require(`${__dirname}/events`);

function init () {
  return new Promise(resolve => {
    const mainClass = this;

    class Bot extends Client {
      constructor (props) {
        super(mainClass.config.bot.token, props);
        this.connect();

        this.commands = {};
        this.loadCommands();

        this.MessageCollector = new mainClass.utils.MessageCollector(this);

        this
          .once('ready', resolve)
          .on('ready', events.onReady.bind(mainClass))
          .on('messageCreate', events.onMessageCreate.bind(mainClass))
          .on('messageReactionAdd', events.onMessageReaction.add.bind(mainClass))
          .on('messageReactionRemove', events.onMessageReaction.remove.bind(mainClass));
      }

      async loadCommands () {
        fs.readdir(`${__dirname}/commands`, (err, files) => {
          if (err) {
            return this.log(err.stack, 'error');
          }

          let failed = 0;

          files.forEach(file => {
            try {
              const command = require(`${__dirname}/commands/${file}`);
              this.commands[command.name] = Object.assign({
                aliases: [],
                ownerOnly: false,
                usage: '{command}'
              }, command);
            } catch (err) {
              failed++;
              mainClass.log(`Failed to load command ${file}: \n${err.stack}`, 'error');
            }
          });

          mainClass.log(`Successfully loaded ${files.length - failed}/${files.length} commands.`);
        });

      }

      async sendMessage (target, content, isUser = false) {
        if (content instanceof Object && !content.content) {
          content = { embed: content };
        }

        if (content.embed && !content.embed.color) {
          content.embed.color = mainClass.config.bot.embedColor;
        }

        try {
          if (isUser) {
            const DMChannel = await this.getDMChannel(target);
            return await DMChannel.createMessage(content); // return await is okay here
          } else {                                        //  because we're in a try-catch
            return await this.createMessage(target, content);
          }
        } catch (err) {
          if (
            !err.message.includes('Missing Permissions') && // TODO: re-test these and replace these strings with HTTP codes
            !err.message.includes('Cannot send messages to this user') &&
            !err.message.includes('Missing Access')
          ) {
            mainClass.log(`Unrecognized error: ${err.stack}\n${content}`, 'error');
          } else {
            return false;
          }
        }
      }
    }

    this.bot = new Bot();
  });
}

module.exports = init;