// Test email sending script
const nodemailer = require('nodemailer');
require('dotenv').config({ path: '.env.local' });

async function testEmail() {
  console.log('🔧 Testing email configuration...');
  console.log('SMTP_HOST:', process.env.SMTP_HOST);
  console.log('SMTP_USER:', process.env.SMTP_USER);
  console.log('USE_ETHEREAL_EMAIL:', process.env.USE_ETHEREAL_EMAIL);
  
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Verify SMTP connection
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!');

    // Send test email
    const info = await transporter.sendMail({
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to: 'adityaanandatwork276@gmail.com',
      subject: 'Test Email from NexusOne',
      text: 'This is a test email to verify Gmail SMTP is working!',
      html: '<h1>✅ Gmail SMTP is working!</h1><p>This is a test email to verify the configuration.</p>',
    });

    console.log('📧 Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    
    if (error.message.includes('Invalid login')) {
      console.log('\n🔑 Make sure you:');
      console.log('1. Have 2-Step Verification enabled on your Google account');
      console.log('2. Generated an App Password (not your regular password)');
      console.log('3. Updated SMTP_PASS in .env.local with the 16-character app password');
    }
  }
}

testEmail();
