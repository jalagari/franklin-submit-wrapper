const { unstable_dev } = require("wrangler");
const { verifyResponse } = require("./util");
require('isomorphic-fetch');


describe("Franklin Sumbit Wrapper File upload (multipart) test cases", () => {

  //let fileUpload = new FileUpload();
  let worker;
  let init = {
    headers: {
       'content-type': 'multipart/form-data'
    },
     method: 'POST'
   }

  beforeAll(async () => {
    worker = await unstable_dev("src/index.js", {
      vars: {
            ORIGIN_HOSTNAME: "forms-api.azure-api.net",
            FILE_SIZE_LIMIT_IN_MB: 0.00001,
            GOOGLE_RECAPTCHA_SECRET_KEY: "",
           // GOOGLE_RECAPTCHA_URL: "/testing"
      },
      compatibilityFlags: ["nodejs_compat"],
      experimental: { disableExperimentalWarning: true },
    });
  });

  afterAll(async () => {
    await worker.stop();
  });

  it("Submitted Form with unsupported file", async () => {
   
    init.body = '--XXX\r\nContent-Disposition: form-data; name="file";  filename="move.mp4"\r\nContent-Type: video/mp4\r\n\r\n["file"]\r\n\r\n--XXX\r\nContent-Disposition: form-data; name="data"\r\nContent-Type: application/json\r\n\r\n{"a":"b"}\r\n--XXX\r\nContent-Disposition: form-data; name="fileNames"\r\nContent-Type: application/json\r\n\r\n["file"]\r\n\r\n--XXX--'
    init.headers["content-type"] = 'multipart/form-data; boundary=XXX'
    const resp = await worker.fetch('/en/submit-a-tech-support-ticket/form', init);

    await verifyResponse(resp, 'video/mp4 based files are not supported', 415);
  });


  it("Submitted Form with large file size", async () => {
   
    init.body = '--XXX\r\nContent-Disposition: form-data; name="file";  filename="issues.pdf"\r\nContent-Type: application/pdf\r\n\r\n["expected to faile"]\r\n\r\n--XXX\r\nContent-Disposition: form-data; name="data"\r\nContent-Type: application/json\r\n\r\n{"a":"b"}\r\n--XXX\r\nContent-Disposition: form-data; name="fileNames"\r\nContent-Type: application/json\r\n\r\n["file"]\r\n\r\n--XXX--'
    init.headers["content-type"] = 'multipart/form-data; boundary=XXX'
    const resp = await worker.fetch('/en/submit-a-tech-support-ticket/form', init);

    await verifyResponse(resp, 'File size should be <', 413);
  });

  it("Submitted Form ", async () => {
    init.body = '--XXX\r\nContent-Disposition: form-data; name="file";  filename="sucess.pdf"\r\nContent-Type: application/pdf\r\n\r\n["file"]\r\n\r\n--XXX\r\nContent-Disposition: form-data; name="data"\r\nContent-Type: application/json\r\n\r\n{"a":"b"}\r\n--XXX\r\nContent-Disposition: form-data; name="fileNames"\r\nContent-Type: application/json\r\n\r\n["file"]\r\n\r\n--XXX--'
    init.headers["content-type"] = 'multipart/form-data; boundary=XXX'
    const resp = await worker.fetch('/api/af', init);
    expect(resp).not.toBeNull();

    const data = await resp.text();
    expect(data).not.toBeNull();
    console.log("Data" , data);
    expect(typeof +data).toBe('number');
    expect(resp.status).toEqual(200);

    const response = await fetch(`http://forms-api.azure-api.net/api/af/${data}`)

    expect(response).not.toBeNull();
    const payload = await
    expect(response).not.toBeNull();
  });
});