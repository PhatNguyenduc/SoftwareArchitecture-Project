require('dotenv').config({ path: '../private.env' });
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    },
});

async function sendEmailNotification(serviceName, status, email) {
    const letter = {
        from: process.env.GMAIL_USER,
        to: email,
        subject: `${serviceName} Health Notification`,
        text: `Alert: ${serviceName} is currently ${status}. Please have a check`
    };

    try {
        await transporter.sendMail(letter);
        console.log("Email sent successfully");
    } catch (error) {
        console.log("Failed to send email. The code is implement in monitor/sidecar/emailNotification.js")
    }
}

module.exports = sendEmailNotification;