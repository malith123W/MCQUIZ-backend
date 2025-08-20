# Email Setup for Password Reset

To enable the "Forgot Password" feature, you need to configure email credentials in your `.env` file.

## Required Environment Variables

Add these to your `.env` file:

```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
```

## Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this password as `EMAIL_PASS`

## Other Email Services

You can modify the `createTransporter()` function in `controllers/passwordResetController.js` to use other email services:

### Outlook/Hotmail
```javascript
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'outlook',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};
```

### Custom SMTP
```javascript
const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'your-smtp-host.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};
```

## Testing

1. Start the backend server
2. Click "Forgot Password" on the login page
3. Enter a valid email address
4. Check your email for the OTP
5. Complete the password reset process

## Security Notes

- OTPs expire after 10 minutes
- OTPs are automatically deleted from the database after expiration
- Failed OTP attempts are tracked
- Passwords are securely hashed using bcrypt
- All OTPs are cleared after successful password reset 