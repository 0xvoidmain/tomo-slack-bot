var Context = require('../Context');
var serivce = require('../service');

module.exports = async function (bot, cx, ts, channel, user, text) {
  var msgs = [
    `hey <@${user}>, I have sent a new transaction through TomoWallet.`,
    `ok <@${user}>. Please confirm the transaction, which I have sent you through TomoWallet`,
  ].filter(e => !!e);

  var response = '';
  var attachments = [];
  var typeOfMessage = '';
  var subtypeOfMessage = '';
  var dataContext = cx.dataContext || {};
  var finishConversation = false;

  cx.context = 'TRANSFER_TOMO';
  var sender = user;
  var recipents = [];
  var amount = 0;
  var isOk = true;

  if (Context.isAnswerQuestion(cx)) {
    var question = cx.messages[cx.messages.length - 2];

    if (question.subtypeOfMessage == 'AMOUNT') {
      amount = Context.getAmountFromAnswer(text);
    }
    else if (question.subtypeOfMessage == 'RECIPIENT') {
      recipents = Context.getRecipentsFromAnswer(text);
    }
  }
  else {
    amount = Context.getAmount(text);
    recipents = Context.getRecipents(text);
  }

  dataContext.sender = dataContext.sender || sender;
  dataContext.recipents = dataContext.recipents || recipents;
  dataContext.recipents = dataContext.recipents.length > 0 ? dataContext.recipents : recipents;
  dataContext.amount = dataContext.amount || amount;

  cx.dataContext = dataContext;

  if (dataContext.amount == 0) {
    response = `<@${user}>, Let's me know exact number of Tomo you want to send`;
    isOk = false;
    typeOfMessage = 'QUESTION';
    subtypeOfMessage = 'AMOUNT';
  }
  else if (dataContext.recipents.length == 0) {
    response = `<@${user}>, Who do you want to send TOMO to?`;
    isOk = false;
    typeOfMessage = 'QUESTION';
    subtypeOfMessage = 'RECIPIENT';
  }
  else if (!await Context.haveAddress(bot, sender)) {
    response = `<@${user}>, I cannot find your *TomoWallet* in your profile. Update *TomoWallet* in your profile then try again please`;
    attachments.push({
      text: "Go to profile, click to Edit Profile then update your TomoWallet ",
      color: "#FF3B30"
    })
    thread_ts = ts;
    finishConversation = true;
    isOk = false;
  }
  else {
    var listDontHaveAddress = [];
    var count = 0;
    for (var i = 0; i < dataContext.recipents.length; i++) {
      if (!await Context.haveAddress(bot, dataContext.recipents[i]))
        listDontHaveAddress.push(dataContext.recipents[i]);
        count++;
    }
    if (listDontHaveAddress.length > 0) {
      listDontHaveAddress = listDontHaveAddress.map(e => `<@${e}>`).join(', ');
      response = `${listDontHaveAddress}, I cannot find your *TomoWallet* in your profile. Please update TomoWallet in your profile.`;
      attachments.push({
        text: "Go to profile, click to Edit Profile then update your TomoWallet",
        color: "#FF3B30"
      })
      attachments.push({
        text: `_<@${user}>, Wait for ${listDontHaveAddress} ${count > 1 ? 'update' : 'updates'} TomoWallet then try again, please_`,
        color: "good"
      });
      thread_ts = ts;
      finishConversation = true;
      isOk = false;
    }
  }

  if (isOk) {
    response = msgs[Math.round(Math.random() * 1000) % msgs.length];
    var senderDetail = await bot.getUserById(sender);
    var users = [];
    for (var i = 0; i < dataContext.recipents.length; i++) {
      var v = await bot.getUserById(dataContext.recipents[i]);
      var add = v.profile.fields.XfHUC31413.value;
      users.push(v);
      console.log(`>> ${senderDetail.profile.fields.XfHUC31413.value} | ${add} | ${dataContext.amount}`)
      var message = `from ${senderDetail.real_name || senderDetail.name} to ${v.real_name || v.name}`;
      message = encodeURIComponent(message);
      await serivce.sendNotify(
        senderDetail.profile.fields.XfHUC31413.value,
        `tomochain:${add}?amount=${dataContext.amount}&message=${message}`
      )
    }
    users = users.map(e => e.real_name || e.name);
    attachments.push({ color: "#FF3B30", text: `*Amount:* ${dataContext.amount} TOMO` });
    attachments.push({ color: "good", text: `*${dataContext.recipents.length == 1 ? 'Recipient' : 'Recipients'}: * ${users.join(', ')}` });
    finishConversation = true;
    thread_ts = ts;
  }

  if (finishConversation) {
    delete conversations[channel + '-' + user];
  }
  else {
    cx.messages.push({
      isBot: true,
      text: response,
      typeOfMessage,
      subtypeOfMessage,
    });
  }

  return {
    text: response,
    attachments: attachments,
    thread_ts
  }
}
