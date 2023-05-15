const { unstable_dev } = require("wrangler");

describe("Franklin Sumbit Wrapper test cases", () => {

  const payload = {"firstname":"test","lastname":"Test","email":"test@gmail.com","phone":"987654321","addressLine1":"Testing","addressLine2":"","city":"BANGALORE","postalcode":"56000","country":"India","product":"","serialNo":"","inquiry":"test","attachment":"e2e tests"};
    
  const timeout = 30000;
  let worker;

  beforeAll(async () => {
    worker = await unstable_dev("src/index.js", {
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
    const resp = await worker.fetch('/en/submit-a-tech-support-ticket/form', {
        'Content-Type': 'application/json',
        method: 'POST',
        body: JSON.stringify({data : ""})
    });
    if (resp) {
        expect(await resp.text()).toMatch("Missing data");
        expect(resp.status).toEqual(400);
    }
  });

  it("Submitted Form with empty data", async () => {
    const resp = await worker.fetch('/en/submit-a-tech-support-ticket/form', {
        'Content-Type': 'application/json',
        method: 'POST',
        body: JSON.stringify({data : {}})
    });
    if (resp) {
        expect(await resp.text()).toMatch("Missing data");
        expect(resp.status).toEqual(400);
    }
  });

  it("Submitted Form without data attribute", async () => {
    const resp = await worker.fetch('/en/submit-a-tech-support-ticket/form', {
        'Content-Type': 'application/json',
        method: 'POST',
        body: JSON.stringify({})
    });
    if (resp) {
        expect(await resp.text()).toMatch("Missing data");
        expect(resp.status).toEqual(400);
    }
  });

  it("Submitted Form ", async () => {
    const resp = await worker.fetch('/en/submit-a-tech-support-ticket/form', {
        headers: {
            'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({data : payload})
    });
    if (resp) {
        expect(resp.status).toEqual(201);
    }
  });
});