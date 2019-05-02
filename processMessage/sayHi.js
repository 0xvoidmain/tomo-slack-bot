var Context = require('../Context');

module.exports = async function(bot, cx, user, text) {
  var msgs = [
    `What's up? <@${user}>`,
    Context.isMorning() && `Good morning, <@${user}>`,
    Context.isMorning() && `Morning <@${user}>`,
    `What can I help you? <@${user}>`,
    `How are you?  <@${user}>`
  ].filter(e => !!e);

  var response = '';

  cx.context = 'SAY_HI';

  response = msgs[Math.round(Math.random() * 1000) % msgs.length];

  cx.messages.push({
    isBot: true,
    text: response,
  });

  return {
    text: response,
  }
}
