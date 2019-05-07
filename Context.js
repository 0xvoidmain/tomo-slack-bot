var isMentionBot = s => s.includes('<@UHTPF4A1J>')

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

function getTextBetween(s, a, b) {
  if (s.includes(a) && s.includes(b)) {
    var result = [];
    while (true) {
      var i = s.indexOf(a);
      if (i == -1) return result;

      s = s.substring(i + a.length);
      var j = s.indexOf(b);
      if (j == -1) return result;
      result.push(s.substring(0, j));
      s = s.substring(j);
    }
  }
  return [];
}

module.exports = {
  isMentionBot,
  isMorning() {
    var now = new Date();
    if (now.getHours() < 12) return true;
  },
  isAfternoon() {
    var now = new Date();
    if (now.getHours() >= 12 && now.getHours() <= 17) return true;
  },
  isEvening() {
    var now = new Date();
    if (now.getHours() > 17 && now.getHours() <= 21) return true;
  },
  isSayHi(s) {
    var _s = s.toLowerCase();
    var listOfWords = ['hey ', 'hi ', 'hello ', 'chao ', 'chào ', 'ê ', ' ei', ' êi', 'này ', ' này'];
    if (!isMentionBot(s)) return false;
    if (s.length > 20) return false;
    if (s.length == 12) return true;

    for (var i = 0; i < listOfWords.length; i++) {
      var w = listOfWords[i];
      if (s.includes(w)) return true;
    }

    return false;
  },
  isTranferTomo(s) {
    s = s.toLowerCase();
    var conditions = [
      ['transfer ', ' to '],
      ['send ', ' to '],
      ['gửi ', ' cho '],
      ['gửi ', ' tới '],
      ['chuyển ', ' tới '],
      ['chuyển ', ' cho '],
      ['tip ', ' to '],
      ['tip ', ' cho '],
      ['tip ', ' <@', 'tomo'],
      ['tip ', ' <@', 'TOMO'],
    ];

    if (!s.includes('tomo')) return false;

    for (var i = 0; i < conditions.length; i++) {
      var w = conditions[i];
      var result = true;
      for (var j = 0; j < w.length; j++) {
        if (!s.includes(w[j])) {
          result = false;
          break;
        }
      }

      if (result == true) {
        return true;
      }
    }

    return false;
  },
  isPenalty(s) {
    s = s.toLowerCase();
    var conditions = [
      ['transfer ', ' penalty'],
      ['send ', ' penalty'],
      ['gửi ', ' penalty'],
      ['nộp ', ' phạt'],
      ['nộp ', ' đi muộn'],
      ['đóng ', ' phạt'],
      ['đóng ', ' đi muộn'],
      ['chuyển ', ' phạt'],
      ['chuyển ', ' đi muộn'],
    ];

    if (!s.includes('tomo')) return false;

    for (var i = 0; i < conditions.length; i++) {
      var w = conditions[i];
      var result = true;
      for (var j = 0; j < w.length; j++) {
        if (!s.includes(w[j])) {
          result = false;
          break;
        }
      }

      if (result == true) {
        return true;
      }
    }

    return false;
  },
  async haveAddress(bot, user) {
    var user = await bot.getUserById(user);
    if (!user.profile) return false;
    if (!user.profile.fields) return false;
    if (!user.profile.fields.XfHUC31413) return false;
    if (!user.profile.fields.XfHUC31413.value) return false;
    if (!isAddress(user.profile.fields.XfHUC31413.value)) return false;
    return true;
  },
  async getAddress(bot, user) {
    var user = await bot.getUserById(user);
    if (!user.profile) return false;
    if (!user.profile.fields) return false;
    if (!user.profile.fields.XfHUC31413) return false;
    if (!user.profile.fields.XfHUC31413.value) return false;
    if (!isAddress(user.profile.fields.XfHUC31413.value)) return false;
    return user.profile.fields.XfHUC31413.value;
  },
  getRecipents(text) {
    var s = text.toLowerCase();
    var words = s.split(' ').map(e => e.trim()).filter(e => e);
    var result = [];
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      if (w == 'to' || w == 'cho' || w == 'tới') {
        for (var j = i + 1; j < words.length; j++) {
          var r = words[j];
          var recipents = getTextBetween(r, '<@', '>');
          if (recipents && recipents.length > 0) {
            result = result.concat(recipents);
          }
        }
      }
    }
    return result.map(e => e.toUpperCase());
  },
  getAmount(text) {
    var s = text.toLowerCase();
    var words = s.split(' ').map(e => e.trim()).filter(e => e);
    var result = 0;
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      if (w == 'transfer' || w == 'send' || w == 'gửi' || w == 'chuyển' || w == 'tip' || w == 'nộp' || w == 'đóng') {
        for (var j = i + 1; j < words.length; j++) {
          var a = words[j];
          var nextW = words[j + 1];
          if (nextW && nextW.includes('tomo')) {
            result = parseFloat(a);
          }
        }
      }
    }
    return  isNaN(result) ? 0 : result;
  },
  getAmountFromAnswer(text) {
    var s = text.toLowerCase();
    var words = s.split(' ').map(e => e.trim()).filter(e => e);
    var result = 0;
    console.log(words);
    for (var i = 0; i < words.length; i++) {
      var a = words[i];
      result = parseFloat(a);
      console.log(result);
      if (!isNaN(result)) return result;
    }
    return  isNaN(result) ? 0 : result;
  },
  getRecipentsFromAnswer(text) {
    var s = text.toLowerCase();
    var words = s.split(' ').map(e => e.trim()).filter(e => e);
    var result = [];
    for (var i = 0; i < words.length; i++) {
      var r = words[i];
      var recipents = getTextBetween(r, '<@', '>');
      if (recipents && recipents.length > 0) {
        result = result.concat(recipents);
      }
    }
    return result.map(e => e.toUpperCase());
  },
  isAnswerQuestion(flow) {
    if (flow.createdAt + 20 * 60 * 1000 < new Date().getTime()) return false;
    if (flow.messages.length < 2) return false;
    if (flow.messages[flow.messages.length - 2].typeOfMessage == 'QUESTION') return true;
    return false;
  }
}