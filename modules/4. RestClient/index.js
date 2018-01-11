class RestClient {
  constructor (mainClass, { twitter, bot }) {
    this.mainClass = mainClass;
    this.OAuthKey = twitter.APIKey;
    this.OAuthSecret = twitter.secret;
    this.discordToken = bot.token;

    this.BASE_URL = 'api.twitter.com/1.1';
  }

  async getTagByID (id) {
    const res = await this.mainClass.utils.get({
      url: `discordapp.com/api/v6/users/${id}`,
      headers: {
        'Authorization': `Bot ${this.mainClass.config.bot.token}`
      }
    });

    return res.status === 200 && `${res.body.username}#${res.body.discriminator}` || null;
  }

  async genericPost (endpoint, secret, qs = '', body = '', params = {}) {
    const url = this.BASE_URL + endpoint;
    const OAuthData = this.mainClass.OAuthClient.signHeaders('POST', url, params, secret).join(',');

    const res = await this.mainClass.utils.post({
      url: url + qs,
      headers: {
        'Authorization': `OAuth ${OAuthData}`
      }
    }, body);

    return res;
  }

  async genericGet (endpoint, secret, qsData, params) {
    const url = this.BASE_URL + endpoint;
    const qs = this.mainClass.utils.qs.create(qsData);

    const OAuthData = this.mainClass.OAuthClient.signHeaders('GET', url, params, secret).join(', ');

    const res = await this.mainClass.utils.get({
      url: url + qs,
      headers: {
        'Authorization': `OAuth ${OAuthData}`
      }
    });

    return res;
  }

  async getTimeline (token, secret, since_id = 1, count = 1) {
    return this.genericGet(
      '/statuses/home_timeline.json',
      secret,
      { count, since_id },
      { oauth_token: token }
    );
  }

  async tweet (token, secret, status) {
    return this.genericPost(
      '/statuses/update.json',
      secret,
      this.mainClass.utils.qs.create({ status }),
      status,
      { oauth_token: token, status }
    );
  }

  async like (token, secret, id) {
    return this.genericPost(
      '/favorites/create.json',
      token,
      secret,
      { id }
    );
  }

  async unlike (token, secret, id) {
    return this.genericPost(
      '/favorites/destroy.json',
      token,
      secret,
      { id }
    );
  }

  async retweet (token, secret, id) {
    return this.genericPost(
      `/statuses/retweet/${id}.json`,
      token,
      secret
    );
  }

  async unretweet (token, secret, id) {
    return this.genericPost(
      `/statuses/unretweet/${id}.json`,
      token,
      secret
    );
  }
}

async function init () {
  this.RestClient = new RestClient(this, this.config);
}

module.exports = init;