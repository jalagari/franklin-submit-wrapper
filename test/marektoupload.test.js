const { unstable_dev } = require("wrangler");
const { payload} = require("./util");
require('isomorphic-fetch');

describe("Franklin Sumbit Wrapper Marketo sync test cases", () => {
  let worker;
  let init = {
    headers: {
       'content-type': 'application/json'
    },
     method: 'POST'
   }

  beforeAll(async () => {
    worker = await unstable_dev("src/index.js", {
      vars: {
        GOOGLE_RECAPTCHA_SECRET_KEY: "",
        ORIGIN_HOSTNAME: "forms-api.azure-api.net",
        MARKETO_ENABLED_FORMS: '["/api/af"]',
        MARKETO_FIELD_MAP: '{"firstname":"firstName","lastname":"lastName","company":"facilityName2","product":"ProductInterest__c","solutions":"SolutionInterest__c","service":"service","message":"message"}'
      },

      experimental: { disableExperimentalWarning: true },
    });
  });

  afterAll(async () => {
    await worker.stop();
  });

  it("Submit Form with marketo field not exist", async () => {
    // adding field for which incorrect field mapping exist
    const updatedPayload = {'company': "test", ...payload};
    init.body = JSON.stringify({data : updatedPayload})
    const resp = await worker.fetch('/api/af', init);
    expect(resp.status).toEqual(500);
  });

  it("Submit Form", async () => {
    init.body = JSON.stringify({data : payload})
    const resp = await worker.fetch('/api/af', init);
    expect(resp.status).toEqual(200);

    expect(resp).not.toBeNull();

    const data = await resp.text();
    expect(data).not.toBeNull();
    console.log("Data" , data);
    expect(typeof +data).toBe('number');
    expect(resp.status).toEqual(200);

    const response = await fetch(`http://forms-api.azure-api.net/api/af/${data}`)

    expect(response).not.toBeNull();

  });

});