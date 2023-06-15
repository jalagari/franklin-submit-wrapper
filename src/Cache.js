export default class Cache {
  /**
   * Cloudflare KeyValue Namespace
   */
  namespace;

  constructor(namespace) {
    this.namespace = namespace;
  }

  async put(key, data, ttl) {
    if (ttl) {
      await this.namespace?.put(key, JSON.stringify(data), {
        expirationTtl: ttl,
      });
    } else {
      await this.namespace?.put(key, JSON.stringify(data));
    }
  }

  async get(key) {
    let data = await this.namespace?.get(key);
    if (data) {
      return JSON.parse(data);
    }
    return {};
  }
}
