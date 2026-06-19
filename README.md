 Contact Mailer (Using Nodemailer)

A small Express + Nodemailer project: a contact form that sends a real email to you,
auto-replies to the sender, and optionally attaches a file.

 Folder structure
 
contact-mailer/
├── .env.             ←  fill in your credentials
├── package.json
├── index.js          ← Express server, transporter, mail options, send logic
└── public/
    └── index.html     ← the contact form (with file upload field)

After running once, Node will also create:
└── uploads/           ← temporary storage for uploaded attachments (auto-created by multer)
 Setup

1. Install dependencies:
   npm install

2. OAuth2 (more secure, used in production apps)
   
   EMAIL_USER=you@gmail.com
   CLIENT_ID=your-client-id.apps.googleusercontent.com
   CLIENT_SECRET=your-client-secret
   REFRESH_TOKEN=your-refresh-token
   RECEIVER=yourname@gmail.com
   PORT=3000
   
3. Start the server:
 
   npm start

5. Open `http://localhost:env{PORT}` in your browser, fill out the form, and submit.

 Features implemented

- transporter.verify() — checks SMTP credentials at startup, before any email is sent
- Specific error handling — distinguishes auth failures, connection issues, and bad addresses
- Auto-reply — sender automatically receives a confirmation email
- File attachments — optional file upload via **multer** , passed into `mailOptions.attachments`

 Testing with Postman (without the HTML form)

- Method: `POST`
- URL: `http://localhost:3000/send`
- Body type: `form-data` (not raw JSON, since attachments require multipart)
  - `name`: text
  - `email`: text
  - `message`: text
  - `attachment`: file (optional)

OAuth2 setup steps (completed)

These are the steps taken to switch the transporter from an app password to OAuth2 authentication with Gmail.

1. **Created a Google Cloud project** named "Nodemailer" at console.cloud.google.com
2. **Enabled the Gmail API** under APIs & Services → Library
3. **Configured the OAuth consent screen**
   - User type: External
   - Added `venkatvishaalts@gmail.com` as a test user under Audience 
4. **Created an OAuth client ID** under APIs & Services → Credentials
   - Application type: Web application
   - Name: "TSVV"
   - Authorized redirect URI: `https://developers.google.com/oauthplayground`
   - Got a Client ID and Client Secret
5. **Generated a refresh token** using the [OAuth2 Playground](https://developers.google.com/oauthplayground)
   - Entered own Client ID/Secret
   - Authorized scope `https://mail.google.com/`
   - Exchanged the authorization code for tokens → copied the `refresh_token` from the JSON response
6. **Updated `.env`** with `CLIENT_ID`, `CLIENT_SECRET`, and `REFRESH_TOKEN` in place of `EMAIL_PASS`
7. **Updated the transporter in `index.js`** to use `type: 'OAuth2'` with the new credentials, and added a `transporter.on('token', ...)` listener to log access token refreshes

