import CustomError from '../model/CustomError.js';

/**
   * Validate captcha token and in case of missing or invalid throw error.
   * @param {secretKey} Site server side secret key.
   * @param {token} Token generated on client side.
   */
const googleRecaptchaValidation = async (secretKey, token, url = 'https://www.google.com/recaptcha/api/siteverify') => {
  if (!token) {
    throw new CustomError('Missing captcha token', 403);
  } else {
    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token);
    const result = await fetch(url, {
      body: formData,
      method: 'POST',
    });
    const outcome = await result.json();
    if (!outcome.success) {
      throw new CustomError('Invalid captcha token provided', 403);
    }
  }
};

export default googleRecaptchaValidation;
