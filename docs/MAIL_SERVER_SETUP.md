# Mail Server Setup Documentation

## System Overview

### Components
1. Mail Server (Postfix + Dovecot)
2. Backend API (Node.js)
3. Database (MySQL)
4. Frontend (React)

### Flow
1. Email Received → Mail Server
2. Mail Server → Webhook (Backend API)
3. Backend API → Database
4. Frontend ← Backend API (Real-time updates)

## Configuration Requirements

### Mail Server
- Postfix for SMTP
- Dovecot for IMAP/POP3
- SSL/TLS certificates
- SPF, DKIM, DMARC records
- Anti-spam configuration

### DNS Records Needed
```
# MX Records
@ IN MX 10 mail.yourdomain.com.

# SPF Record
@ IN TXT "v=spf1 ip4:YOUR_SERVER_IP ~all"

# DKIM Record
mail._domainkey IN TXT "v=DKIM1; k=rsa; p=YOUR_PUBLIC_KEY"

# DMARC Record
_dmarc IN TXT "v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com"
```

### Environment Variables
```
# Mail Server
MAIL_SERVER_HOST=mail.yourdomain.com
MAIL_SERVER_PORT=25
MAIL_SERVER_USERNAME=your-username
MAIL_SERVER_PASSWORD=your-password

# Database
DB_HOST=localhost
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=your-db-name

# Backend
API_PORT=3000
JWT_SECRET=your-jwt-secret
```

## Postfix Configuration Files

### 1. Main Configuration (/etc/postfix/main.cf)
```
# Basic Configuration
myhostname = mail.yourdomain.com
mydomain = yourdomain.com
myorigin = $mydomain
inet_interfaces = all
inet_protocols = ipv4
mydestination = $myhostname, localhost.$mydomain, localhost

# TLS parameters
smtpd_tls_cert_file=/etc/letsencrypt/live/mail.yourdomain.com/fullchain.pem
smtpd_tls_key_file=/etc/letsencrypt/live/mail.yourdomain.com/privkey.pem
smtpd_use_tls=yes
smtpd_tls_security_level = may
smtpd_tls_protocols = !SSLv2, !SSLv3

# Virtual domains and aliases
virtual_alias_domains = hash:/etc/postfix/virtual_domains
virtual_alias_maps = hash:/etc/postfix/virtual
transport_maps = hash:/etc/postfix/transport

# SMTP restrictions
smtpd_recipient_restrictions =
  permit_mynetworks,
  permit_sasl_authenticated,
  reject_unauth_destination

# Size limits
message_size_limit = 10240000
mailbox_size_limit = 51200000
```

### 2. Master Configuration (/etc/postfix/master.cf)
```
# Service    Type   Private Unpriv  Chroot  Wakeup  Maxproc Command + args
smtp         inet   n       -       n       -       -       smtpd
submission   inet   n       -       n       -       -       smtpd
  -o syslog_name=postfix/submission
  -o smtpd_tls_security_level=encrypt
  -o smtpd_sasl_auth_enable=yes
  -o smtpd_tls_auth_only=yes

# Custom transport for webhook
webhook   unix  -       n       n       -       -       pipe
  flags=FR user=www-data argv=/etc/postfix/pipe-to-webhook.sh ${recipient} ${sender} ${original_subject}
```

### 3. Webhook Script (/etc/postfix/pipe-to-webhook.sh)
```bash
#!/bin/bash

# Read email content
email_content=$(cat)

# Extract recipient from command line argument
recipient="$1"

# Forward to webhook
curl -X POST \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "recipient=$recipient" \
  --data-urlencode "sender=$2" \
  --data-urlencode "subject=$3" \
  --data-urlencode "body=$email_content" \
  http://localhost:3000/webhook/email/incoming
```

### 4. Transport Configuration (/etc/postfix/transport)
```
# Transport mappings
tempmail.pro webhook:
securetemp.com webhook:
privacymail.org webhook:
```

### 5. Virtual Email Configuration (/etc/postfix/virtual)
```
# Virtual email mappings
@tempmail.pro webhook
@securetemp.com webhook
@privacymail.org webhook
```

### 6. Virtual Domains Configuration (/etc/postfix/virtual_domains)
```
# Temporary email domains
tempmail.pro
securetemp.com
privacymail.org
```

## Setup Steps

1. Install Required Packages:
```bash
apt-get update
apt-get install -y postfix postfix-mysql dovecot-core dovecot-imapd dovecot-pop3d
```

2. Configure SSL/TLS:
```bash
apt-get install -y certbot
certbot certonly --standalone -d mail.yourdomain.com
```

3. Copy Configuration Files:
```bash
# Copy all configuration files to their respective locations
cp main.cf /etc/postfix/
cp master.cf /etc/postfix/
cp pipe-to-webhook.sh /etc/postfix/
cp transport /etc/postfix/
cp virtual /etc/postfix/
cp virtual_domains /etc/postfix/
```

4. Set Permissions:
```bash
chmod +x /etc/postfix/pipe-to-webhook.sh
chown www-data:www-data /etc/postfix/pipe-to-webhook.sh
```

5. Update Postfix Maps:
```bash
postmap /etc/postfix/transport
postmap /etc/postfix/virtual
postmap /etc/postfix/virtual_domains
```

6. Restart Services:
```bash
systemctl restart postfix
systemctl restart dovecot
```

## Monitoring and Maintenance

### Log Monitoring
```bash
# Monitor mail logs
tail -f /var/log/mail.log

# Monitor webhook delivery
tail -f /var/log/syslog | grep webhook
```

### Regular Maintenance
1. Check SSL certificate renewal
2. Monitor disk space
3. Review mail logs for errors
4. Update virus definitions
5. Backup configurations

## Security Checklist

- [ ] SSL/TLS certificates installed and valid
- [ ] SPF records configured
- [ ] DKIM signing enabled
- [ ] DMARC policy set
- [ ] Firewall rules configured
- [ ] Regular security updates
- [ ] Log monitoring enabled
- [ ] Backup system in place

## Troubleshooting

1. Check Mail Logs:
```bash
tail -f /var/log/mail.log
```

2. Test Mail Delivery:
```bash
echo "Test" | mail -s "Test Subject" test@yourdomain.com
```

3. Check Postfix Configuration:
```bash
postfix check
postconf -n
```

4. Verify DNS Records:
```bash
dig MX yourdomain.com
dig TXT yourdomain.com
```

5. Test Webhook:
```bash
curl -X POST \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "recipient=test@example.com" \
  --data-urlencode "sender=sender@example.com" \
  --data-urlencode "subject=Test" \
  --data-urlencode "body=Test Body" \
  http://localhost:3000/webhook/email/incoming
```