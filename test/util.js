
exports.payload = {"firstname":"test","lastname":"Test","email":"test@gmail.com","phone":"987654321","addressLine1":"Testing","addressLine2":"","city":"BANGALORE","postalcode":"56000","country":"India","product":"","serialNo":"","inquiry":"test","attachment":"e2e tests"};
exports.init = {
 headers: {
    'Content-Type': 'application/json',
  },
  method: 'POST',
  body: JSON.stringify({data : ""})
}

exports.verifyResponse = async (resp, msg, code) => {
  expect(resp).not.toBeNull();
  expect(await resp.text()).toMatch(msg);
  expect(resp.status).toEqual(code);
}