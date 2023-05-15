export default class CustomError extends Error {
  code;

  details;

  constructor(message, code, details) {
    super(message);
    this.code = code;
    this.details = details;
  }

  getStatus() {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}
