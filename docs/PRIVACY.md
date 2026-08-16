# TeamSync Privacy Policy

*Last updated: August 15, 2026*

This Privacy Policy explains what personal data TeamSync collects, how it is
used, and the choices you have. "TeamSync", "we", or "us" refers to the
operators of the TeamSync collaboration platform.

## 1. Data we collect

- **Account data**: name, email address, role, profile fields (title, bio,
  location), and login credentials. Passwords are stored only as bcrypt
  hashes — we never store plaintext passwords.
- **Workspace data**: content you create or upload (tasks, chats, meetings,
  events, files, notifications, activity records) within a workspace you
  belong to.
- **Usage data**: server logs including IP address, request paths, and
  timestamps, used for security and operations.
- **Sessions**: a JWT session token is stored in an httpOnly cookie (and/or
  sent as a Bearer token) so you stay signed in.

## 2. How we use data

- To operate, secure, and improve TeamSync.
- To send transactional email (invitations and password reset links).
- To enforce roles and permissions within a workspace.
- To comply with legal obligations.

We do not sell personal data and do not use it for advertising.

## 3. Email

Transactional messages are sent via a configured provider (Resend, Mailgun, or
SMTP). In local development with no provider configured, messages are logged
to the console and not delivered. Email addresses you send invites to are
stored so the invitation can be accepted.

## 4. Data retention

Account and workspace data is retained while your account is active. You may
request deletion of your account and data. Server logs are retained for a
reasonable period for security and debugging.

## 5. Security

We use encryption in transit (HTTPS in production), bcrypt password hashing,
httpOnly session cookies, and role-based access control. No data transmission
or storage is 100% secure; we cannot guarantee absolute security.

## 6. Third-party processors

We may share limited data with service providers that help operate the service
(hosting, email delivery, error tracking). These providers process data only on
our instructions.

## 7. Your rights

Depending on your jurisdiction (e.g., GDPR or CCPA), you may have the right to
access, correct, export, or delete your personal data. Contact the workspace
administrator or the TeamSync operator to exercise these rights.

## 8. Changes to this policy

We may update this policy. Material changes will be announced on the service.
Continued use after changes take effect constitutes acceptance of the revised
policy.

## 9. Contact

Questions about this policy: contact the workspace administrator or the
TeamSync operator through the support channel listed on the site.