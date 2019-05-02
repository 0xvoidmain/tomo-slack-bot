var Context = require('../Context');
var service = require('../service');

module.exports = async function (bot, cx, ts, channel, user, text) {
  var msgs = [
    `hey <@${user}>, I have sent a new transaction through TomoWallet.`,
    `ok <@${user}>. Please confirm the transaction, which I have sent you through TomoWallet`,
  ].filter(e => !!e);

  var response = '';
  var attachments = [];
  var thread_ts = undefined;
  var typeOfMessage = '';
  var subtypeOfMessage = '';
  var dataContext = cx.dataContext || {};
  var finishConversation = false;

  cx.context = 'PENALTY';
  var sender = user;
  var amount = 0;
  var isOk = true;

  if (Context.isAnswerQuestion(cx)) {
    var question = cx.messages[cx.messages.length - 2];

    if (question.subtypeOfMessage == 'AMOUNT') {
      amount = Context.getAmountFromAnswer(text);
    }
  }
  else {
    amount = Context.getAmount(text);
  }

  dataContext.sender = dataContext.sender || sender;
  dataContext.amount = dataContext.amount || amount;

  cx.dataContext = dataContext;

  if (dataContext.amount == 0) {
    response = `<@${user}>, Let's me know exact number of Tomo you want to send`;
    isOk = false;
    typeOfMessage = 'QUESTION';
    subtypeOfMessage = 'AMOUNT';
  }
  else if (!await Context.haveAddress(bot, sender)) {
    response = `<@${user}>, I cannot find your *TomoWallet* in your profile`;
    attachments.push({
      text: "_Go to profile, click to Edit Profile then update your TomoWallet_",
      color: "#3AA3E3"
    });
    thread_ts = ts;
    isOk = false;
  }

  if (isOk) {
    response = msgs[Math.round(Math.random() * 1000) % msgs.length];
    var senderDetail = await bot.getUserById(sender);
    console.log(`>> ${senderDetail.profile.fields.XfHUC31413.value}| Penalty | ${dataContext.amount}`)
    var message = `from ${senderDetail.real_name || senderDetail.name} send ${amount} TOMO for Cash Penalty - TomoChain`;
    message = encodeURIComponent(message);
    await service.sendNotify(
      senderDetail.profile.fields.XfHUC31413.value,
      `tomochain:0x48Aa20c9135a10544c57F4de7a80A6209152b98D?amount=${dataContext.amount}&message=${message}`);
    attachments.push({ color: "#FF3B30", text: `*Amount:* ${dataContext.amount} TOMO` });
    attachments.push({ color: "good", text: `Cash Penalty | 0x48Aa20c9135a10544c57F4de7a80A6209152b98D` });
    attachments.push({ color: "#03a9f4", text: `<@UGG4AQZ4H>, check this transaction after 2 minutes please` });
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
