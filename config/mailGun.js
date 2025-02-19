const mailgun = require("mailgun-js");
const DOMAIN = process.env.MAILGUN_DOMAIN;
const mg = mailgun({ apiKey: process.env.MAILGUN_API_KEY, domain: DOMAIN });

const sendEmail = (to, subject, text) => {
  const data = {
    from: "Urbaan Collections <no-reply@urbaan.in>",
    to,
    subject,
    text,
  };

  return new Promise((resolve, reject) => {
    mg.messages().send(data, (error, body) => {
      if (error) {
        console.error("Error sending email:", error);
        reject(error);
      } else {
        console.log("Email sent:", body);
        resolve(body);
      }
    });
  });
};

module.exports = {
  sendEmail,
};
