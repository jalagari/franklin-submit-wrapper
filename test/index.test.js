const { unstable_dev } = require("wrangler");
const { init, payload, verifyResponse } = require("./util");


describe("Franklin Sumbit Wrapper test cases", () => {
  let worker;

  beforeAll(async () => {
    worker = await unstable_dev("src/index.js", {
      vars: {
            ORIGIN_HOSTNAME: "forms-api.azure-api.net",
            GOOGLE_RECAPTCHA_SECRET_KEY: ""
      },
      experimental: { disableExperimentalWarning: true },
    });
  });

  afterAll(async () => {
    await worker.stop();
  });

  it("Get Reqeust - Should return 404", async () => {
    const resp = await worker.fetch();
    await verifyResponse(resp, 'Not Found.', 404);
  });

  it("Submitted Form without Data", async () => {
    const resp = await worker.fetch('/en/submit-a-tech-support-ticket/form', init);
    await verifyResponse(resp, 'Missing data', 400);
  });

  it("Submitted Form with empty data", async () => {
    init.body = JSON.stringify({data : {}})
    const resp = await worker.fetch('/en/submit-a-tech-support-ticket/form', init);
    await verifyResponse(resp, 'Missing data', 400);
  });

  it("Submitted Form without data attribute", async () => {
    init.body = JSON.stringify({})
    const resp = await worker.fetch('/en/submit-a-tech-support-ticket/form', init);
    await verifyResponse(resp, 'Missing data', 400);
  });

  it("Submitted Form with unsupported content", async () => {
    init.headers = {}
    init.body = JSON.stringify({data : payload})
    const resp = await worker.fetch('/en/submit-a-tech-support-ticket/form', init);
    await verifyResponse(resp, 'Unsupported content-type', 415);
  });

  it("Submitted Form ", async () => {
    init.body = JSON.stringify({data : payload})
    init.headers["Content-Type"] =  'application/json';
    const resp = await worker.fetch('/api/af', init);
    if (resp) {
        const data = await resp.text();
        expect(data).not.toBeNull();
        expect(typeof +data).toBe('number');
        expect(resp.status).toEqual(200);
    }
  });
});