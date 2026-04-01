---
name: DevSec (Development Security)
description: Integrating security practices throughout the software development lifecycle.
---

# DevSec Skill

This skill focuses on building secure applications by incorporating security considerations at every stage.

## Core Principles
1. **Secure by Design**: Consider security from the beginning of the design process.
2. **Least Privilege**: Only grant the minimum necessary permissions to users and services.
3. **Defense in Depth**: Implement multiple layers of security to protect sensitive data.
4. **Input Validation**: Never trust user input—always validate and sanitize on the server.

## Security Controls
- **Authentication**: Multi-Factor Authentication (MFA), JWT with short expiration.
- **Authorization**: Role-Based Access Control (RBAC) or Attribute-Based Access Control (ABAC).
- **Communication**: Enforce HTTPS / TLS for all data in transit.
- **Vulnerability Scanning**: Use tools to scan dependencies for known vulnerabilities.

## Best Practices
- Implement Content Security Policy (CSP) headers.
- Sanitize HTML to prevent Cross-Site Scripting (XSS).
- Use CSRF tokens where appropriate.
