const mailgun = require("mailgun-js");
const DOMAIN = process.env.MAILGUN_DOMAIN;
const mg = mailgun({ apiKey: process.env.MAILGUN_API_KEY, domain: DOMAIN });

const templates = {
  order_created: "order_created",
  dispatch_mail: "dispatch_mail",
  delivery_mail: "delivery_mail",
};

const sendEmail = (to, actionType, variables = {}) => {
  const templateName = templates[actionType];
  if (!templateName) {
    console.error(`Invalid email action type: ${actionType}`);
    return Promise.reject(new Error("Invalid email template"));
  }

  const data = {
    from: "Urbaan Collections <no-reply@urbaan.in>",
    to,
    subject: variables.subject || "Urbaan Collections Notification",
    template: templateName, // Mailgun template name
    "h:X-Mailgun-Variables": JSON.stringify(variables), // Passing variables to the template
  };

  return new Promise((resolve, reject) => {
    mg.messages().send(data, (error, body) => {
      if (error) {
        console.error("Error sending email:", error);
        reject(error);
      } else {
        console.log("Email sent successfully:", body);
        resolve(body);
      }
    });
  });
};

module.exports = { sendEmail };
