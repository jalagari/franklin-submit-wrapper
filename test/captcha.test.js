const { unstable_dev } = require("wrangler");
const { payload, init } = require("./util");

describe("Franklin Sumbit Wrapper Google reCaptcha test cases", () => {
  
  let worker;

  beforeAll(async () => {
    worker = await unstable_dev("src/index.js", {
      vars: {
            GOOGLE_RECAPTCHA_SECRET_KEY: "testing",
           // GOOGLE_RECAPTCHA_URL: "/testing"
      },
      experimental: { disableExperimentalWarning: true },
    });
  });

  afterAll(async () => {
    await worker.stop();
  });

  it("Submitted Form without token ", async () => {
    init.body = JSON.stringify({data : payload})
    const resp = await worker.fetch('/en/submit-a-tech-support-ticket/form', init);
    if (resp) {
       expect(await resp.text()).toMatch('{\"code\":403,\"message\":\"Missing captcha token\"}');
        expect(resp.status).toEqual(403);
    }
  });

  it("Submitted Form with invalid token ", async () => {
    init.body = JSON.stringify({data : payload, token : "Testing"})
    const resp = await worker.fetch('/en/submit-a-tech-support-ticket/form', init);
    console.log( "INit", init)
    if (resp) {
       expect(await resp.text()).toMatch('{\"code\":403,\"message\":\"Invalid captcha token provided\"}');
        expect(resp.status).toEqual(403);
    }
  });
});