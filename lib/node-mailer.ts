import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: "smtp.ensend.co",
  port: 587,
  secure: false,
  auth: {
    user: process.env.ENSEND_USERNAME,
    pass: process.env.ENSEND_PASSWORD,
  },
});

// export const transporter = nodemailer.createTransport({
//   host: "smtp.gmail.com",
//     port: 465,
//   secure: true,
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// export const transporter = nodemailer.createTransport({
//   service: "smtp.resend.com",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });
