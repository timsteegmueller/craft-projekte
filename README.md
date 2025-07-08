# 🚀 Craft CMS Auto-Update System

<div align="center">

![Craft CMS](https://img.shields.io/badge/Craft%20CMS-5.x-orange?style=for-the-badge&logo=craft-cms)
![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-Automated-blue?style=for-the-badge&logo=github-actions)
![PHP](https://img.shields.io/badge/PHP-8.1+-777BB4?style=for-the-badge&logo=php)
![Status](https://img.shields.io/badge/Status-Production%20Ready-success?style=for-the-badge)

**Automatische Dependency-Updates für Craft CMS Projekte mit Zero-Downtime Deployment**

[🎯 Features](#-features) • [⚡ Quick Start](#-quick-start) • [🔧 Konfiguration](#-konfiguration) • [📊 Monitoring](#-monitoring)

</div>

---

## 🎯 Features

### 🤖 **Vollständige Automatisierung**
- ⏰ **Scheduled Updates** - Automatische Updates jeden Sonntag um 3 Uhr
- 🔄 **Auto-Pull Requests** - Automatische PR-Erstellung mit detaillierten Changelogs
- 💾 **Database Backups** - Automatische Backups vor jedem Update
- 🔍 **Health Checks** - Kontinuierliche Website-Überwachung

### 🛡️ **Enterprise-Ready Security**
- 🔐 **SSH-Key Authentication** - Sichere Server-Verbindungen
- 🏰 **Zero-Downtime Deployments** - Keine Service-Unterbrechungen
- 📋 **Audit Logs** - Vollständige Nachverfolgbarkeit aller Änderungen
- ⚠️ **Error Handling** - Intelligente Fehlerbehandlung mit Rollback-Funktionen

### 📱 **Smart Notifications**
- 💬 **Slack Integration** - Real-time Updates in dein Team-Channel
- 📧 **E-Mail Alerts** - Benachrichtigungen bei kritischen Fehlern
- 📊 **Status Dashboard** - Übersichtliche Monitoring-Oberfläche

---

## ⚡ Quick Start

### 1. 📋 **Repository Setup**

```bash
# Repository klonen
git clone https://github.com/timsteegmueller/craft-projekte.git
cd craft-projekte

# Workflow-Ordner erstellen
mkdir -p .github/workflows
```

### 2. 🔑 **GitHub Secrets konfigurieren**

Gehe zu **Repository → Settings → Secrets and variables → Actions** und füge hinzu:

| Secret | Beschreibung | Beispiel |
|--------|--------------|----------|
| `SSH_PRIVATE_KEY` | SSH Private Key für Server-Zugriff | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `SSH_USER` | Server-Username | `ubuntu` oder `www-data` |
| `SSH_HOST` | Server-Hostname | `craft-server.deine-domain.de` |
| `DB_USER` | Datenbank-Username | `craftuser` |
| `DB_PASSWORD` | Datenbank-Passwort | `secure_password_123` |
| `DB_NAME` | Datenbank-Name | `craft_production` |
| `SLACK_WEBHOOK_URL` | Slack Webhook für Notifications | `https://hooks.slack.com/...` |

### 3. 🚀 **Workflow aktivieren**

```bash
# Workflow-Datei erstellen
cp templates/craft-update.yml .github/workflows/

# Konfiguration anpassen
vim .github/workflows/craft-update.yml

# Committen und pushen
git add .github/workflows/craft-update.yml
git commit -m "🚀 Add Craft CMS auto-update workflow"
git push origin main
```

---

## 🔧 Konfiguration

### 📂 **Projekt-Matrix konfigurieren**

Bearbeite `.github/workflows/craft-update.yml` und passe die Projekt-Matrix an:

```yaml
strategy:
  matrix:
    project:
      - name: "hauptwebsite"
        server: "prod-server-01.example.com"
        path: "/var/www/hauptwebsite"
        repo: "timsteegmueller/hauptwebsite"
        branch: "main"
        domain: "https://example.com"
        
      - name: "kundenprojekt-alpha"
        server: "prod-server-02.example.com" 
        path: "/var/www/alpha-projekt"
        repo: "timsteegmueller/alpha-projekt"
        branch: "production"
        domain: "https://alpha-kunde.com"
```

### ⏰ **Cron-Schedule anpassen**

```yaml
on:
  schedule:
    # Jeden Sonntag um 3:00 Uhr
    - cron: '0 3 * * 0'
    
    # Oder täglich um 2:00 Uhr  
    # - cron: '0 2 * * *'
    
    # Oder jeden ersten Montag im Monat
    # - cron: '0 2 1-7 * 1'
```

### 🔔 **Notification-Channels**

#### Slack Setup:
```bash
# Slack App erstellen: https://api.slack.com/apps
# Webhook URL kopieren und als Secret hinzufügen
```

#### Discord Setup:
```yaml
# In der Workflow-Datei:
- name: Discord Notification
  uses: Ilshidur/action-discord@master
  with:
    args: '🚀 Craft CMS Updates für {{ EVENT_PAYLOAD.project }} abgeschlossen!'
  env:
    DISCORD_WEBHOOK: ${{ secrets.DISCORD_WEBHOOK }}
```

---

## 📊 Monitoring

### 📈 **Workflow-Status Dashboard**

```mermaid
graph TD
    A[Scheduled Trigger] --> B[Backup Database]
    B --> C[Update Craft CMS]
    C --> D[Update Composer]
    D --> E[Run Tests]
    E --> F{Tests Pass?}
    F -->|✅ Yes| G[Create Pull Request]
    F -->|❌ No| H[Send Alert]
    G --> I[Health Check]
    I --> J[Deploy Success]
    H --> K[Rollback]
```

### 🔍 **Log-Monitoring**

```bash
# GitHub Actions Logs ansehen
gh run list --workflow=craft-update.yml

# Detaillierte Logs für einen Run
gh run view --log

# Server-Logs überprüfen
ssh user@server "tail -f /var/log/craft-updates.log"
```

### 📊 **Metriken & KPIs**

| Metrik | Beschreibung | Zielwert |
|--------|--------------|----------|
| **Update Success Rate** | Erfolgreiche Updates vs. Fehlgeschlagene | > 95% |
| **Deployment Time** | Durchschnittliche Deployment-Dauer | < 5 Min |
| **Downtime** | Service-Unterbrechungen pro Update | 0 Sek |
| **Recovery Time** | Zeit bis zur Wiederherstellung nach Fehlern | < 2 Min |

---

## 🛠️ Erweiterte Features

### 🧪 **Staging-Environment Integration**

```yaml
# Staging-Tests vor Production
- name: Deploy to Staging
  if: github.ref == 'refs/heads/main'
  run: |
    ssh ${{ secrets.SSH_USER }}@staging.example.com \
      "cd /var/www/staging && git pull && php craft migrate/all"
    
- name: Run Integration Tests
  run: |
    curl -f https://staging.example.com/health-check
```

### 🔄 **Multi-Environment Rollout**

```yaml
strategy:
  matrix:
    environment: [staging, production]
    include:
      - environment: staging
        server: staging-server.example.com
        branch: develop
      - environment: production  
        server: prod-server.example.com
        branch: main
```

### 📦 **Asset Pipeline Integration**

```yaml
- name: Build Frontend Assets
  run: |
    npm ci
    npm run production
    
- name: Optimize Images
  uses: calibreapp/image-actions@main
  with:
    githubToken: ${{ secrets.GITHUB_TOKEN }}
```

---

## 🚨 Troubleshooting

### ❗ **Häufige Probleme**

<details>
<summary>🔐 SSH-Verbindung fehlgeschlagen</summary>

```bash
# SSH-Key testen
ssh -T ${{ secrets.SSH_USER }}@${{ secrets.SSH_HOST }}

# Known Hosts Problem lösen
ssh -o StrictHostKeyChecking=no user@server

# SSH-Agent Debug
ssh -vvv user@server
```
</details>

<details>
<summary>💾 Database Backup fehlgeschlagen</summary>

```bash
# Berechtigungen prüfen
ls -la /var/backups/

# Festplattenspeicher prüfen  
df -h

# MySQL-Verbindung testen
mysql -u $DB_USER -p -e "SHOW DATABASES;"
```
</details>

<details>
<summary>🔄 Composer Update Fehler</summary>

```bash
# Memory-Limit erhöhen
php -d memory_limit=2G /usr/local/bin/composer update

# Cache leeren
composer clear-cache

# Dependencies analysieren
composer why-not php 8.2
```
</details>

### 🆘 **Emergency Procedures**

```bash
# 🚨 Sofort-Rollback
git revert HEAD --no-edit
git push origin main

# 🔄 Database Restore
mysql -u $DB_USER -p $DB_NAME < backup_YYYYMMDD.sql

# 🏥 Service Health Check
curl -I https://your-domain.com/
```

---

## 🤝 Contributing

### 💡 **Feature Requests**

Hast du Ideen für neue Features? Erstelle ein [Issue](https://github.com/timsteegmueller/craft-projekte/issues) mit dem Label `enhancement`.

### 🐛 **Bug Reports**

```markdown
**Bug Beschreibung:**
Kurze Beschreibung des Problems

**Reproduktion:**
1. Gehe zu '...'
2. Klicke auf '....'
3. Scrolle nach unten zu '....'
4. Siehe Fehler

**Erwartetes Verhalten:**
Was sollte eigentlich passieren?

**Screenshots:**
Falls anwendbar, füge Screenshots hinzu

**Environment:**
- OS: [e.g. Ubuntu 20.04]
- PHP Version: [e.g. 8.1.12]
- Craft Version: [e.g. 4.4.15]
```

### 🔧 **Development Setup**

```bash
# Repository forken
gh repo fork timsteegmueller/craft-projekte

# Lokal klonen
git clone https://github.com/DEIN-USERNAME/craft-projekte.git

# Feature-Branch erstellen
git checkout -b feature/awesome-new-feature

# Changes committen
git commit -m "✨ Add awesome new feature"

# Pull Request erstellen
gh pr create --title "✨ Add awesome new feature"
```

---

## 📚 Ressourcen

### 📖 **Dokumentation**
- [Craft CMS Documentation](https://craftcms.com/docs/4.x/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Laravel Envoyer Guide](https://envoyer.io/docs/1.0/introduction)

### 🎓 **Tutorials**
- [Zero-Downtime Deployments](https://example.com/zero-downtime)
- [Database Migration Best Practices](https://example.com/db-migrations)
- [Monitoring & Alerting Setup](https://example.com/monitoring)

### 🛠️ **Tools**
- [Craft CLI](https://github.com/craftcms/cli)
- [GitHub CLI](https://cli.github.com/)
- [SSH Config Management](https://www.ssh.com/academy/ssh/config)

---

## 📄 Lizenz

```
MIT License

Copyright (c) 2025 Tim Steegmüller

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
```

---

<div align="center">

**Erstellt mit ❤️ von [Tim Steegmüller](https://github.com/timsteegmueller)**

** Farbcode • 2025**

[![GitHub stars](https://img.shields.io/github/stars/timsteegmueller/craft-projekte?style=social)](https://github.com/timsteegmueller/craft-projekte)
[![GitHub forks](https://img.shields.io/github/forks/timsteegmueller/craft-projekte?style=social)](https://github.com/timsteegmueller/craft-projekte/fork)
[![GitHub issues](https://img.shields.io/github/issues/timsteegmueller/craft-projekte)](https://github.com/timsteegmueller/craft-projekte/issues)

</div>
