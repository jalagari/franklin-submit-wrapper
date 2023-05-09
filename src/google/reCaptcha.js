import CustomError from '../model/CustomError.js';

export default class GoogleRecaptcha {
  ENDPOINT = 'https://www.google.com/recaptcha/api/siteverify';

  SECRET_KEY;

  constructor(secretKey) {
    this.SECRET_KEY = secretKey;
  }

  /**
   * Validate captcha token and in case of missing or invalid throw error.
   * @param {data} Formdata with token attribute.
   */
  async validate(token) {
    if (!token) {
      throw new CustomError('Missing captcha token', 403);
    } else {
      const formData = new FormData();
      formData.append('secret', this.SECRET_KEY);
      formData.append('response', token);
      const result = await fetch(this.ENDPOINT, {
        body: formData,
        method: 'POST',
      });
      const outcome = await result.json();
      if (!outcome.success) {
        throw new CustomError('Invalid captcha token provided', 403);
      }
    }
  }
}
