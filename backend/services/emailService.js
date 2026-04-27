const nodemailer = require('nodemailer');

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // or 'hotmail', 'outlook', 'yahoo'
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send welcome email
const sendWelcomeEmail = async (userEmail, userName) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: 'Welcome to Our Gym!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">Welcome ${name}!</h2>
        <p>Thank you for joining our gym! We're excited to have you on board.</p>
        <p>Your account has been successfully created. You can now:</p>
        <ul>
          <li>Book classes</li>
          <li>Track your attendance</li>
          <li>View membership plans</li>
          <li>Make payments online</li>
        </ul>
        <p>If you have any questions, feel free to contact us.</p>
        <br>
        <p>Best regards,<br>Gym Management Team</p>
      </div>
    `
  };
  
  await transporter.sendMail(mailOptions);
};

// Send payment confirmation email
const sendPaymentConfirmation = async (userEmail, userName, amount, planName) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: 'Payment Confirmation',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">Payment Received!</h2>
        <p>Dear ${userName},</p>
        <p>We have received your payment of <strong>KSh ${amount}</strong> for <strong>${planName}</strong>.</p>
        <p>Your membership is now active. You can now access all gym facilities.</p>
        <p>Thank you for choosing us!</p>
        <br>
        <p>Best regards,<br>Gym Management Team</p>
      </div>
    `
  };
  
  await transporter.sendMail(mailOptions);
};

// Send booking confirmation email
const sendBookingConfirmation = async (userEmail, userName, className, classDate, classTime) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: 'Class Booking Confirmation',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">Booking Confirmed!</h2>
        <p>Dear ${userName},</p>
        <p>Your booking for <strong>${className}</strong> has been confirmed.</p>
        <p><strong>Date:</strong> ${classDate}</p>
        <p><strong>Time:</strong> ${classTime}</p>
        <p>Please arrive 10 minutes early for check-in.</p>
        <br>
        <p>Best regards,<br>Gym Management Team</p>
      </div>
    `
  };
  
  await transporter.sendMail(mailOptions);
};

// Send password reset email
const sendPasswordResetEmail = async (userEmail, resetToken) => {
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ff9800;">Password Reset Request</h2>
        <p>You requested to reset your password. Click the link below to proceed:</p>
        <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <br>
        <p>Best regards,<br>Gym Management Team</p>
      </div>
    `
  };
  
  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendWelcomeEmail,
  sendPaymentConfirmation,
  sendBookingConfirmation,
  sendPasswordResetEmail
};