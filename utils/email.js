// utils/email.js
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendConfirmationEmail = async (email, token) => {
  const confirmationLink = `${process.env.FRONTEND_URL}/confirm-email?token=${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 40px; text-align: center;">
      <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h2 style="color: #4f46e5;">Welcome to Quizora 👋</h2>
        <p style="font-size: 16px; color: #333;">Thanks for signing up! Please confirm your email address to get started.</p>
        <a href="${confirmationLink}" 
           style="display: inline-block; margin-top: 20px; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
           ✅ Confirm Email
        </a>
        <p style="margin-top: 30px; font-size: 13px; color: #888;">If you didn’t sign up, you can safely ignore this email.<br>This link will expire in 24 hours.</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    to: email,
    subject: 'Confirm Your Email Address',
    html,
  });
};

export const sendResetEmail = async (email, token) => {
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 40px; text-align: center;">
      <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h2 style="color: #4f46e5;">Password Reset Request 🔐</h2>
        <p style="font-size: 16px; color: #333;">Click the button below to reset your password. This link will expire in 1 hour.</p>
        <a href="${resetLink}" 
           style="display: inline-block; margin-top: 20px; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
           🔁 Reset Password
        </a>
        <p style="margin-top: 30px; font-size: 13px; color: #888;">If you didn't request this, ignore this email.</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    to: email,
    subject: 'Reset Your Quizora Password',
    html,
  });
};

export const sendHallTicketEmail = async (email, name, contestName, hallTicketNo) => {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const html = `
    <div style="font-family: Arial; padding: 20px;">
      <h2>Hello ${name},</h2>
      <p>Thank you for registering for <strong>${contestName}</strong>.</p>
      <p>Your hall ticket number is:</p>
      <h3 style="color: #4f46e5;">${hallTicketNo}</h3>
      <p>Good luck with the contest!</p>
      <p>Regards,<br>Quizora Team</p>
    </div>
  `;

  await transporter.sendMail({
    to: email,
    subject: `Your Hall Ticket for ${contestName}`,
    html,
  });
};

