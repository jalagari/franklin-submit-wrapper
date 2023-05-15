const { unstable_dev } = require("wrangler");
const { init, payload } = require("./util");


describe("Franklin Sumbit Wrapper test cases", () => {
  let worker;

  beforeAll(async () => {
    worker = await unstable_dev("src/index.js", {
      vars: {
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
    if (resp) {
        expect(resp.status).toEqual(404);
    }
  });

  it("Submitted Form without Data", async () => {
    const resp = await worker.fetch('/en/submit-a-tech-support-ticket/form', init);
    if (resp) {
        expect(await resp.text()).toMatch("Missing data");
        expect(resp.status).toEqual(400);
    }
  });

  it("Submitted Form with empty data", async () => {
    init.body = JSON.stringify({data : {}})
    const resp = await worker.fetch('/en/submit-a-tech-support-ticket/form', init);
    if (resp) {
        expect(await resp.text()).toMatch("Missing data");
        expect(resp.status).toEqual(400);
    }
  });

  it("Submitted Form without data attribute", async () => {
    init.body = JSON.stringify({})
    const resp = await worker.fetch('/en/submit-a-tech-support-ticket/form', init);
    if (resp) {
        expect(await resp.text()).toMatch("Missing data");
        expect(resp.status).toEqual(400);
    }
  });

  it("Submitted Form ", async () => {
    init.body = JSON.stringify({data : payload})
    const resp = await worker.fetch('/en/submit-a-tech-support-ticket/form', init);
    if (resp) {
        expect(resp.status).toEqual(201);
    }
  });
});