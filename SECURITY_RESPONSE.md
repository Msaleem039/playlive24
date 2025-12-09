# Security Response Guide - CVE-2025-55182 (React2Shell)

## ⚠️ CRITICAL: Your VPS was compromised due to React2Shell vulnerability

This guide will help you:
1. Remove malware from your server
2. Patch the vulnerability
3. Secure your server against future attacks

---

## Step 1: DO NOT RESTART THE VPS YET

**Important:** Do not start your VPS until you've completed the cleanup steps below. Starting it without removing malware will allow the attacker to continue exploiting your system.

---

## Step 2: Access Your Server in Rescue Mode

1. **Boot into Rescue Mode:**
   - Most VPS providers offer a "Rescue Mode" or "Recovery Mode"
   - Access your VPS control panel and enable rescue mode
   - This allows you to access the filesystem without booting the compromised OS

2. **Mount the Filesystem:**
   ```bash
   # The exact commands depend on your provider
   # Typically, the filesystem will be mounted at /mnt or /rescue
   ```

---

## Step 3: Identify and Remove Malware

### A. Check for Malicious Processes

```bash
# List all running processes
ps aux | grep -v "\["

# Look for suspicious processes:
# - Unknown processes with high CPU usage
# - Processes with random names
# - Cryptocurrency miners (often named xmrig, cpuminer, etc.)
# - Processes listening on unexpected ports
```

### B. Check for Malicious Files

```bash
# Find recently modified files (last 7 days)
find /path/to/your/app -type f -mtime -7 -ls

# Check for suspicious files in common locations:
find /tmp -type f -name "*" -ls
find /var/tmp -type f -name "*" -ls
find ~ -name "*.sh" -o -name "*.py" -o -name "*.pl" | grep -v node_modules

# Look for files with suspicious names:
find /path/to/your/app -type f \( -name "*miner*" -o -name "*crypto*" -o -name "*shell*" \)
```

### C. Check for Unauthorized Cron Jobs

```bash
# Check user crontabs
crontab -l

# Check system-wide cron jobs
ls -la /etc/cron.d/
ls -la /etc/cron.hourly/
ls -la /etc/cron.daily/
cat /etc/crontab

# Look for suspicious entries
```

### D. Check for Backdoors

```bash
# Check for unauthorized SSH keys
cat ~/.ssh/authorized_keys

# Check for suspicious network connections
netstat -tulpn | grep LISTEN

# Check for processes listening on unexpected ports
ss -tulpn
```

### E. Remove Identified Malware

```bash
# Stop malicious processes (replace PID with actual process ID)
kill -9 <PID>

# Remove malicious files
rm -f /path/to/malicious/file

# Remove unauthorized cron jobs
crontab -e  # Edit and remove suspicious entries
```

---

## Step 4: Patch the Vulnerability

### A. Update Dependencies (Already Done in Code)

The `package.json` has been updated with patched versions:
- **Next.js**: Updated from `15.2.4` to `^15.2.6` (patched)
- **React**: Updated from `^19` to `^19.2.1` (patched)
- **React-DOM**: Updated from `^19` to `^19.2.1` (patched)

### B. Install Updated Dependencies

**On your local machine (before deploying):**

```bash
# Remove node_modules and package-lock.json for clean install
rm -rf node_modules package-lock.json

# Install updated dependencies
npm install

# Verify versions
npm list react react-dom next

# Expected output should show:
# react@19.2.1
# react-dom@19.2.1
# next@15.2.6 (or higher)
```

### C. Rebuild Your Application

```bash
# Build the application
npm run build

# Test locally first
npm run dev
```

---

## Step 5: Secure Your Server

### A. Change All Passwords and Secrets

**Assume all credentials are compromised:**

1. **Change system passwords:**
   ```bash
   passwd  # Change root password
   passwd <username>  # Change user passwords
   ```

2. **Rotate API keys and secrets:**
   - Database passwords
   - API keys
   - JWT secrets
   - Environment variables
   - SSH keys

3. **Update `.env` files:**
   - Generate new secrets
   - Update all environment variables
   - Never commit `.env` files to git

### B. Review and Secure SSH Access

```bash
# Disable password authentication (use SSH keys only)
sudo nano /etc/ssh/sshd_config

# Set these values:
PasswordAuthentication no
PubkeyAuthentication yes
PermitRootLogin no

# Restart SSH service
sudo systemctl restart sshd
```

### C. Configure Firewall

```bash
# Install and configure UFW (Ubuntu/Debian)
sudo apt update
sudo apt install ufw

# Allow only necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp     # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Check status
sudo ufw status
```

### D. Set Up Intrusion Detection

```bash
# Install fail2ban to prevent brute force attacks
sudo apt install fail2ban

# Configure fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### E. Enable Automatic Security Updates

```bash
# Ubuntu/Debian
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# Enable automatic updates
sudo systemctl enable unattended-upgrades
```

---

## Step 6: Deploy Patched Application

### A. Clean Deployment

1. **Remove old application files:**
   ```bash
   # On your server (in rescue mode or after cleanup)
   cd /path/to/your/app
   rm -rf .next node_modules package-lock.json
   ```

2. **Upload new code:**
   - Use git to pull latest code, OR
   - Upload files via SFTP/SCP

3. **Install dependencies:**
   ```bash
   npm ci  # Clean install (uses package-lock.json)
   ```

4. **Build application:**
   ```bash
   npm run build
   ```

5. **Start application:**
   ```bash
   npm start
   # Or use PM2:
   pm2 restart your-app-name
   ```

---

## Step 7: Post-Deployment Monitoring

### A. Monitor Logs

```bash
# Application logs
tail -f /path/to/your/app/.next/server.log

# System logs
tail -f /var/log/syslog
tail -f /var/log/auth.log

# Check for suspicious activity
grep -i "error\|unauthorized\|failed" /var/log/auth.log
```

### B. Monitor System Resources

```bash
# Check CPU and memory usage
top
htop

# Check disk usage
df -h

# Check network connections
netstat -tulpn
ss -tulpn
```

### C. Set Up Alerts

- Monitor CPU usage (cryptominers use high CPU)
- Monitor network traffic
- Set up alerts for failed login attempts
- Monitor application errors

---

## Step 8: Additional Security Hardening

### A. Environment Variables Security

1. **Never expose sensitive data:**
   - Use environment variables for all secrets
   - Never commit `.env` files
   - Use a secrets manager in production

2. **Review your `.env` files:**
   ```bash
   # Check for exposed secrets
   grep -r "password\|secret\|key\|token" .env* --exclude-dir=node_modules
   ```

### B. Application Security Headers

Add security headers in `next.config.mjs`:

```javascript
const nextConfig = {
  // ... existing config
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}
```

### C. Rate Limiting

Consider implementing rate limiting for API endpoints to prevent abuse.

### D. Regular Security Audits

1. **Keep dependencies updated:**
   ```bash
   npm audit
   npm audit fix
   ```

2. **Regular security scans:**
   - Run `npm audit` weekly
   - Monitor security advisories
   - Subscribe to Next.js security updates

---

## Step 9: Verify Fix

### A. Check Installed Versions

```bash
npm list react react-dom next
```

Should show:
- `react@19.2.1` or higher
- `react-dom@19.2.1` or higher  
- `next@15.2.6` or higher

### B. Test Application

1. Test all critical functionality
2. Verify no suspicious processes are running
3. Check logs for errors
4. Monitor resource usage

---

## Step 10: Incident Response Checklist

- [ ] VPS stopped (already done by provider)
- [ ] Server accessed in rescue mode
- [ ] Malware identified and removed
- [ ] All passwords and secrets rotated
- [ ] Dependencies updated to patched versions
- [ ] Application rebuilt with patched code
- [ ] Firewall configured
- [ ] SSH secured
- [ ] Monitoring set up
- [ ] Application deployed and tested
- [ ] Post-deployment monitoring active

---

## Prevention for Future

1. **Keep dependencies updated:**
   - Run `npm audit` regularly
   - Subscribe to security advisories
   - Update dependencies promptly

2. **Implement security best practices:**
   - Use environment variables for secrets
   - Enable firewall
   - Use SSH keys instead of passwords
   - Regular backups
   - Monitor logs and system resources

3. **Set up automated security:**
   - Automated dependency updates (Dependabot)
   - Automated security scanning
   - Intrusion detection systems

---

## Need Help?

If you encounter issues during cleanup:
1. Document the error
2. Check application logs
3. Verify all steps were followed
4. Consider professional security audit if critical data was exposed

---

## References

- [CVE-2025-55182 Details](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2025-55182)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [React Security](https://react.dev/learn/escape-hatches)

---

**Last Updated:** After patching CVE-2025-55182
**Status:** Critical - Immediate action required

