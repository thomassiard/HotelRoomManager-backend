const express = require("express");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");

const app = express();
app.use(bodyParser.json());

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;

if (!EMAIL_USER || !EMAIL_PASSWORD) {
  console.error(
    "Please provide EMAIL_USER and EMAIL_PASSWORD environment variables."
  );
  process.exit(1);
}

// Konfiguracija za slanje e-maila
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD,
  },
});

app.post("/send-email", async (req, res) => {
  try {
    const { email, message } = req.body;

    // Postavite e-mail opcije
    const mailOptions = {
      from: email,
      to: "alenblocic9@gmail.com",
      subject: "Contact Form Submission",
      text: `Email: ${email}\nMessage: ${message}`,
    };

    // Pošaljite e-mail
    await transporter.sendMail(mailOptions);

    res.status(200).send("E-mail sent successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error sending e-mail");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default sendEmail;
