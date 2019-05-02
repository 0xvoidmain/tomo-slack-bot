const SlackBot = require('slackbots');
const Context = require('./Context');
const ProcessMessage = require('./processMessage')
require('dotenv').config()

global.conversations = {};
var ids = {};
var isAddress = function (address) {
  address = address.toLowerCase();
  if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
      // check if it has the basic requirements of an address
      return false;
  } else if (/^(0x)?[0-9a-f]{40}$/.test(address) || /^(0x)?[0-9A-F]{40}$/.test(address)) {
      // If it's all small caps or all all caps, return true
      return true;
  }
  return false;
};


const bot = new SlackBot({
  token: process.env.SLACK_TOKEN,
  name: 'Boss'
});

bot.on('start', async () => {
  // var users = await bot.getUsers();
  // users = users.members;
  // console.log(users.map(e => ({id: e.id, name: e.name})));
  // users = users.map(e => ({
  //   name: e.name,
  //   real_name: e.real_name,
  //   id: e.id,
  //   address: e.profile.fields.XfHUC31413.value
  // }));
  // users.filter(e => e.address && e.address.trim()).forEach(e => {
  //   if (!isAddress(e.address)) {
  //     bot.postMessageToUser(e.name, `Your TomoWallet is invalid. Check your TomoWallet again please`);
  //   }
  //   else if (checks[e.address]) {
  //     bot.postMessageToUser(e.name, `Your TomoWallet is same with ${e.real_name || e.name}. Check your TomoWallet again please`);
  //   }
  //   else {
  //     checks[e.address] = e.name;
  //   }
  // });
});

bot.on('error', (err) => {
  console.log('error', err);
  bot.postMessageToUser('tunght91', 'Error: ' + err.toString())
});

bot.on('message', async data => {
  try {
    if (data.type !== 'message') return;
    if (data.subtype == 'bot_message') return;
    if (data.subtype == 'message_replied') return;
    if (!data.text || !data.text.trim()) return;
    console.log(data);
    await handleMessage(data);
  }
  catch (ex) {
    console.log('handle message', ex);
    bot.postMessageToUser('tunght91', 'Error: ' + ex.toString());
  }
});


async function handleMessage(message) {
  var user = await bot.getUserById(message.user);
  if (user.name == 'tunght91') {
    switch (message.text) {
      case 'clear-conversation': global.conversations = {}; return;
    }
  }

  if (Context.isMentionBot(message.text)) {
    await createNewConversation(message.channel, message.user);
  }

  var response = await processMessageWith(message, message.channel, message.user, message.text);
  if (response) {
    await sendResponse(message, response);
  }
}

async function createNewConversation(channel, user) {
  conversations[channel + '-' + user] = conversations[channel + '-' + user] || {
    context: '',
    createdAt: new Date().getTime(),
    messages: []
  }
}

async function processMessageWith(message, channel, user, text) {
  if (!conversations[channel + '-' + user]) {
    var userDetail = await bot.getUserById(user);
    if (text.includes('&gt;&gt;') && userDetail.name == 'tunght91') {
      var ts = text.split('&gt;&gt;')[0].trim();
      var msg = text.split('&gt;&gt;')[1].trim();
      if (ids[ts]) {
        ts = ids[ts];
      }
      var channelDetail = await bot.getChannelById(ts.split('|')[0]);
      bot.postMessageToChannel(channelDetail.name, msg, {
        thread_ts: ts.split('|')[1]
      });
    }
    return null;
  }

  var cx = conversations[channel + '-' + user];

  cx.messages.push({
    isBot: false,
    text: text
  });

  if (Context.isSayHi(text)) {
    return await ProcessMessage.SayHi(bot, cx, user, text);
  }
  else if (Context.isPenalty(text) || cx.context == 'PENALTY') {
    return await ProcessMessage.Penalty(bot, cx, channel, user, text);
  }
  else if (Context.isTranferTomo(text) || cx.context == 'TRANSFER_TOMO') {
    return await ProcessMessage.Transaction(bot, cx, channel, user, text);
  }
  else {
    var userDetail = await bot.getUserById(user);
    var id = Object.keys(ids).length;
    ids[id] = `${message.channel}|${message.ts}`;
    bot.postMessageToUser('tunght91', `\`${id}\`. How to reply this one? *${message.channel}|${message.ts}*`, {
      attachments: [{
        text: `*${userDetail.real_name || userDetail.name}: *"${text}"`
      }]
    });
    return null;
  }
}

async function sendResponse(message, response) {
  var channel = await bot.getChannelById(message.channel);
  if (message.thread_ts) {
    bot.postMessageToChannel(channel.name, response.text, {
      thread_ts: message.thread_ts,
      "attachments": response.attachments
    });
  }
  else {
    bot.postMessageToChannel(channel.name, response.text, {
      "attachments": response.attachments
    });
  }
}