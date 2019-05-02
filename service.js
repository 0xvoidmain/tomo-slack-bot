var Web3 = require('web3');
var axios = require('axios');

var web3 = new Web3();

module.exports = {
  async sendNotify(address, deeplink) {
    var PRIVATE_KEY = process.env.PRIVATE_KEY;
    var api = 'https://wallet.tomochain.com';

    var base64Data = Buffer.from(JSON.stringify({
      appName: 'TomoBoss',
      address: address,
      deepLink: deeplink
    })).toString('base64');
    var signMessage = web3.eth.accounts.sign(base64Data, PRIVATE_KEY)
    var signature = signMessage.signature;
    var { data } = await axios.post(`${api}/api/services/notification/push`, {
      message: base64Data,
      signature
    });

    if (data.error) {
      throw new Error('The application dont have permission for push notification to TomoWallet');
    }
  }
}