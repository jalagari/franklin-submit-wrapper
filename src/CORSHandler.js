export default class CORSHandler {

  allowedHosts = [];

  constructor(allowedHosts) {
    this.allowedHosts = allowedHosts;
  }

  isWhiteListedHost = (hostName) => {
    return this.allowedHosts.includes(hostName);
  };

  wrapHeaders = (response, reqUrl, hostName) => {
    if (response && this.isWhiteListedHost(hostName)) {
      response.headers.set('Access-Control-Allow-Headers', 'content-type');
      response.headers.set('Access-Control-Allow-Origin', reqUrl);
    }
    return response;
  };
}
