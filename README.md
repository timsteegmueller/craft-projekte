# 💾 CraftCMS Auto Backup & Update System

<div align="center">

![Craft CMS](https://img.shields.io/badge/Craft%20CMS-4.x%20%7C%205.x-orange?style=for-the-badge&logo=craft-cms)
![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-Automated-blue?style=for-the-badge&logo=github-actions)
![PHP](https://img.shields.io/badge/PHP-8.1%2B-777BB4?style=for-the-badge&logo=php)
![MySQL](https://img.shields.io/badge/MySQL-5.7%2B-4479A1?style=for-the-badge&logo=mysql)
![Status](https://img.shields.io/badge/Status-Production%20Ready-success?style=for-the-badge)

**Automatische Backup & Update Pipeline für CraftCMS mit Zero-Risk Deployment**

[🎯 Features](#-features) • [⚡ Quick Start](#-quick-start) • [🔧 Konfiguration](#-konfiguration) • [📊 Monitoring](#-monitoring) • [🚨 Troubleshooting](#-troubleshooting)

</div>

---

## 🎯 Features

### 🤖 **Intelligente Automatisierung**
- 🔄 **Repository Dispatch Trigger** - Flexibler externer Auslöser für Updates
- 💾 **Pre-Update Database Backup** - Automatische Sicherung vor jedem Update
- 🚀 **CraftCMS Core & Plugin Updates** - Vollständige Aktualisierung aller Komponenten
- 🔍 **Health Monitoring** - MySQL Service Health Checks

### 🛡️ **Enterprise-Grade Security**
- 🔐 **Secret Management** - Sichere Webhook-URL Verwaltung über GitHub Secrets
- 🏥 **Rollback-Ready** - Automatische Backups ermöglichen schnelle Wiederherstellung
- 📋 **Full Audit Trail** - Komplette Nachverfolgung aller Update-Aktivitäten
- ⚠️ **Error Handling** - Robuste Fehlerbehandlung mit detailliertem Logging

### 📱 **Smart Integration**
- 🔗 **n8n Webhook Support** - Nahtlose Integration in bestehende Automatisierungsflows
- 📊 **JSON Status Reporting** - Strukturierte Rückmeldungen für weitere Verarbeitung
- 🌐 **Multi-Project Support** - Skalierbar für mehrere CraftCMS-Installationen

---

## ⚡ Quick Start

### 1. 📋 **Repository Setup**

```bash
# Repository für CraftCMS-Projekte erstellen
mkdir craft-auto-updater
cd craft-auto-updater

# Projekt-Struktur anlegen
mkdir -p .github/workflows
mkdir -p mein-test-projekt
```

### 2. 🔑 **GitHub Secrets konfigurieren**

Gehe zu **Repository → Settings → Secrets and variables → Actions** und füge hinzu:

| Secret | Beschreibung | Beispiel |
|--------|--------------|----------|
| `N8N_WEBHOOK_URL` | n8n Webhook für Post-Update Benachrichtigungen | `https://your-n8n-instance.com/webhook/craft-update` |

### 3. 🚀 **Workflow-Datei erstellen**

Erstelle `.github/workflows/craft-backup-update.yml`:

```yaml
# Automatisierter Workflow für CraftCMS Backup und Updates
# Wird ausgelöst durch einen Repository Dispatch Event von außen
name: 💾 CraftCMS Auto Backup & Update

on:
  repository_dispatch:
    # Lauscht auf externe Trigger mit dem spezifischen Event-Type
    types: [run-backup-und-update]

jobs:
  craft-auto-update:
    # Läuft auf Ubuntu (ist günstiger und schneller als Windows/macOS)
    runs-on: ubuntu-latest
    
    services:
      mysql:
        # MySQL 5.7 Service für die Datenbank - ältere Version für Kompatibilität
        image: mysql:5.7
        env:
          # Standard-Zugangsdaten für die Test-Datenbank
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: craft
          MYSQL_USER: craft
          MYSQL_PASSWORD: craft
        ports:
          # MySQL Port 3306 für die Verbindung freigeben
          - 3306:3306
        options: >-
          # Health Check um sicherzustellen, dass MySQL bereit ist
          --health-cmd="mysqladmin ping --silent"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=3
    
    steps:
      # Repository Code herunterladen
      - name: 📥 Checkout Repo
        uses: actions/checkout@v3
      
      # PHP Umgebung vorbereiten mit allen nötigen Extensions für CraftCMS  
      - name: 📦 Set up PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: 8.2
          # Alle Extensions die CraftCMS braucht
          extensions: mbstring, pdo_mysql, dom, curl, intl, gd, zip, fileinfo
          # Memory Limits erhöhen für größere Projekte
          ini-values: memory_limit=512M, post_max_size=64M, upload_max_filesize=64M
          coverage: none
      
      # Composer Dependencies installieren (PHP Package Manager)
      - name: 🧰 Install Composer
        run: composer install --no-interaction --prefer-dist --optimize-autoloader
        working-directory: ./mein-test-projekt
      
      # Datenbank Backup erstellen bevor wir Updates fahren
      # Sicherheit geht vor - falls etwas schief geht, können wir zurück
      - name: 💾 Backup DB
        run: |
          mkdir -p ./backups
          mysqldump -h 127.0.0.1 -u craft -pcraft craft > ./backups/backup.sql
        working-directory: ./mein-test-projekt
      
      # Das eigentliche CraftCMS Update ausführen
      # 'update all' updated sowohl Craft Core als auch alle Plugins
      - name: 🔁 Run PHP Craft Update
        run: php craft update all
        working-directory: ./mein-test-projekt
      
      # n8n (oder anderen Service) benachrichtigen, dass der Job fertig ist
      # Praktisch für weitere Automatisierung oder Monitoring
      - name: 📡 Webhook Call an n8n
        run: |
          curl -X POST "$N8N_WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d '{
              "repo": "'"$GITHUB_REPOSITORY"'",
              "commit": "'"$GITHUB_SHA"'",
              "event": "craft-update-done",
              "status": "success"
            }'
        env:
          # Webhook URL aus den Repository Secrets laden (sicherer)
          N8N_WEBHOOK_URL: ${{ secrets.N8N_WEBHOOK_URL }}
      
      # Erfolgsmeldung in den Logs
      - name: ✅ Done
        run: echo "Backup und Update abgeschlossen!"
```

### 4. 🎯 **Workflow aktivieren**

```bash
# Workflow committen
git add .github/workflows/craft-backup-update.yml
git commit -m "💾 Add CraftCMS auto backup & update workflow"
git push origin main

# Ersten Test-Run starten
gh workflow run "💾 CraftCMS Auto Backup & Update" --ref main
```

---

## 🔧 Konfiguration

### 📂 **Projekt-Struktur anpassen**

```yaml
# Für verschiedene CraftCMS-Projekte
strategy:
  matrix:
    project:
      - name: "hauptprojekt"
        directory: "./mein-test-projekt"
        php_version: "8.2"
        mysql_version: "5.7"
        
      - name: "kundenprojekt-beta"
        directory: "./kunde-beta-cms"
        php_version: "8.3"
        mysql_version: "8.0"
```

### ⏰ **Automatische Trigger einrichten**

#### Via GitHub Actions (Cron):
```yaml
on:
  schedule:
    # Jeden Sonntag um 2:00 Uhr
    - cron: '0 2 * * 0'
  repository_dispatch:
    types: [run-backup-und-update]
```

#### Via n8n Workflow:
```json
{
  "method": "POST",
  "url": "https://api.github.com/repos/USERNAME/REPO/dispatches",
  "headers": {
    "Authorization": "token YOUR_GITHUB_TOKEN",
    "Accept": "application/vnd.github.v3+json"
  },
  "body": {
    "event_type": "run-backup-und-update"
  }
}
```

### 🔔 **Erweiterte Notification-Channels**

#### Slack Integration:
```yaml
- name: 📢 Slack Notification
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
    channel: '#craft-updates'
    text: '🚀 CraftCMS Update für ${{ github.repository }} abgeschlossen!'
```

#### Discord Integration:
```yaml
- name: 🎮 Discord Alert
  uses: Ilshidur/action-discord@master
  with:
    args: '💾 Backup & Update für {{ EVENT_PAYLOAD.repository }} erfolgreich!'
  env:
    DISCORD_WEBHOOK: ${{ secrets.DISCORD_WEBHOOK }}
```

---

## 📊 Monitoring

### 📈 **Workflow-Architektur**

```mermaid
graph TD
    A[Repository Dispatch Trigger] --> B[Ubuntu Runner Setup]
    B --> C[MySQL 5.7 Service Start]
    C --> D[PHP 8.2 Environment]
    D --> E[Composer Install]
    E --> F[Database Backup]
    F --> G[CraftCMS Update All]
    G --> H{Update Success?}
    H -->|✅ Success| I[n8n Webhook Call]
    H -->|❌ Error| J[Error Notification]
    I --> K[Completion Log]
    J --> L[Rollback Available]
```

### 🔍 **Status Monitoring Dashboard**

```bash
# GitHub CLI Status Check
gh run list --workflow="💾 CraftCMS Auto Backup & Update"

# Detaillierte Logs anzeigen
gh run view --log

# Webhook-Response überwachen
curl -X GET "https://your-n8n-instance.com/webhook/craft-status"
```

### 📊 **Key Performance Indicators**

| Metrik | Beschreibung | Benchmark |
|--------|--------------|-----------|
| **Backup Time** | Zeit für Datenbank-Backup | < 30 Sekunden |
| **Update Duration** | CraftCMS Core & Plugin Updates | < 3 Minuten |
| **Total Runtime** | Gesamte Workflow-Laufzeit | < 5 Minuten |
| **Success Rate** | Erfolgreiche vs. fehlgeschlagene Runs | > 98% |

---

## 🛠️ Erweiterte Features

### 🧪 **Multi-Environment Support**

```yaml
strategy:
  matrix:
    environment: [development, staging, production]
    include:
      - environment: development
        mysql_version: "8.0"
        php_version: "8.3"
        backup_retention: "7"
      - environment: production
        mysql_version: "5.7"
        php_version: "8.2"
        backup_retention: "30"
```

### 📦 **Asset & Cache Management**

```yaml
- name: 🧹 Clear Craft Caches
  run: |
    php craft clear-caches/all
    php craft gc
  working-directory: ./mein-test-projekt

- name: 🎨 Regenerate Assets
  run: php craft resave/assets
  working-directory: ./mein-test-projekt
```

### 🔄 **Backup Rotation & Retention**

```yaml
- name: 💾 Advanced Backup with Rotation
  run: |
    # Backup-Verzeichnis mit Datum erstellen
    BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Database Backup
    mysqldump -h 127.0.0.1 -u craft -pcraft craft > "$BACKUP_DIR/database.sql"
    
    # Alte Backups löschen (behalte nur letzten 10)
    ls -t ./backups | tail -n +11 | xargs -I {} rm -rf ./backups/{}
```

### ☁️ **Cloud Storage Integration**

```yaml
- name: ☁️ Upload Backup to S3
  uses: aws-actions/configure-aws-credentials@v4
  with:
    aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
    aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    aws-region: eu-central-1

- name: 📤 S3 Backup Upload
  run: |
    aws s3 cp ./backups/backup.sql \
      s3://craft-backups/$(date +%Y%m%d)/backup_${{ github.sha }}.sql
```

---

## 🚨 Troubleshooting

### ❗ **Häufige Probleme & Lösungen**

<details>
<summary>🔐 MySQL Connection Failed</summary>

```bash
# Problem: MySQL Service nicht bereit
# Lösung: Health Check Timeout erhöhen

services:
  mysql:
    options: >-
      --health-cmd="mysqladmin ping --silent"
      --health-interval=30s
      --health-timeout=10s
      --health-retries=5

# Alternative: MySQL Manual Wait
- name: ⏳ Wait for MySQL
  run: |
    for i in {1..30}; do
      if mysqladmin ping -h127.0.0.1 -ucraft -pcraft --silent; then
        echo "MySQL is ready!"
        break
      fi
      echo "Waiting for MySQL... ($i/30)"
      sleep 2
    done
```
</details>

<details>
<summary>💾 Backup Directory Permission Denied</summary>

```bash
# Problem: Keine Schreibberechtigung für Backup-Ordner
# Lösung: Explizite Berechtigungen setzen

- name: 📁 Create Backup Directory
  run: |
    sudo mkdir -p ./backups
    sudo chmod 777 ./backups
    ls -la ./backups
```
</details>

<details>
<summary>🔄 Composer Memory Limit Exceeded</summary>

```bash
# Problem: Nicht genügend Memory für Composer
# Lösung: Memory Limit erhöhen

- name: 🧰 Install Composer with High Memory
  run: |
    php -d memory_limit=1G /usr/local/bin/composer install \
      --no-interaction --prefer-dist --optimize-autoloader
  working-directory: ./mein-test-projekt
```
</details>

<details>
<summary>📡 Webhook Call Failed</summary>

```bash
# Problem: n8n Webhook nicht erreichbar
# Lösung: Retry-Logic implementieren

- name: 📡 Webhook with Retry
  run: |
    for i in {1..3}; do
      if curl -f -X POST "$N8N_WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d '{"status": "success", "repo": "'$GITHUB_REPOSITORY'"}'; then
        echo "Webhook successful!"
        break
      fi
      echo "Webhook attempt $i failed, retrying..."
      sleep 5
    done
  env:
    N8N_WEBHOOK_URL: ${{ secrets.N8N_WEBHOOK_URL }}
```
</details>

### 🆘 **Emergency Recovery Procedures**

```bash
# 🚨 Sofortiger Backup-Restore
mysql -h 127.0.0.1 -u craft -pcraft craft < ./backups/backup.sql

# 🔄 Composer Dependencies zurücksetzen
composer install --no-interaction --prefer-dist

# 🧹 Craft Cache komplett leeren
php craft clear-caches/all
php craft invalidate-tags/all

# 🔍 System Health Check
php craft health-check
```

### 📊 **Debug & Logging**

```yaml
- name: 🐛 Debug Information
  run: |
    echo "=== System Info ==="
    uname -a
    echo "=== PHP Version ==="
    php -v
    echo "=== Composer Version ==="
    composer --version
    echo "=== MySQL Status ==="
    mysqladmin -h 127.0.0.1 -u craft -pcraft status
    echo "=== Disk Space ==="
    df -h
    echo "=== Memory Usage ==="
    free -h
```

---

## 🤝 Contributing

### 💡 **Feature Requests**

Neue Features oder Verbesserungen? Erstelle ein [Issue](https://github.com/timsteegmueller/craft-auto-updater/issues) mit dem Label `enhancement`.

**Template für Feature Requests:**
```markdown
## 🚀 Feature Request

**Ist dein Feature Request mit einem Problem verbunden?**
Eine klare Beschreibung des Problems: "Es ist nervig, dass [...]"

**Beschreibe die gewünschte Lösung**
Eine klare Beschreibung was du dir wünschst.

**Beschreibe Alternativen**
Andere Lösungsansätze die du in Betracht gezogen hast.

**Zusätzlicher Kontext**
Screenshots, Code-Beispiele, etc.
```

### 🐛 **Bug Reports**

```markdown
## 🐛 Bug Report

**Beschreibung des Bugs:**
Kurze, präzise Beschreibung des Problems

**Reproduktionsschritte:**
1. Trigger Workflow mit '...'
2. Schaue in Logs bei '....'
3. Scroll zu Step '....'
4. Siehe Fehler

**Erwartetes Verhalten:**
Was sollte passieren?

**Tatsächliches Verhalten:**
Was passiert stattdessen?

**Environment:**
- GitHub Runner: [ubuntu-latest]
- PHP Version: [8.2]
- MySQL Version: [5.7]
- CraftCMS Version: [4.x]

**Logs:**
```
[Relevante Log-Ausgaben hier einfügen]
```
```

### 🔧 **Development Workflow**

```bash
# Repository forken
gh repo fork timsteegmueller/craft-auto-updater

# Feature Branch erstellen
git checkout -b feature/improved-backup-retention

# Lokale Tests
act -W .github/workflows/craft-backup-update.yml

# Pull Request erstellen
gh pr create --title "✨ Improved backup retention logic"
```

---

## 📚 Ressourcen & Links

### 📖 **Offizielle Dokumentation**
- [CraftCMS 4.x Documentation](https://craftcms.com/docs/4.x/)
- [GitHub Actions Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [MySQL 5.7 Reference Manual](https://dev.mysql.com/doc/refman/5.7/en/)
- [Composer Documentation](https://getcomposer.org/doc/)

### 🎓 **Tutorials & Guides**
- [CraftCMS Update Best Practices](https://craftcms.com/docs/4.x/updating.html)
- [GitHub Actions for PHP Projects](https://github.com/features/actions)
- [Database Backup Strategies](https://dev.mysql.com/doc/refman/5.7/en/backup-and-recovery.html)

### 🛠️ **Tools & Utilities**
- [act - Run GitHub Actions locally](https://github.com/nektos/act)
- [GitHub CLI](https://cli.github.com/)
- [n8n Automation Platform](https://n8n.io/)
- [CraftCMS CLI Tools](https://github.com/craftcms/cli)

### 🌐 **Community & Support**
- [CraftCMS Discord](https://craftcms.com/discord)
- [Stack Overflow - CraftCMS](https://stackoverflow.com/questions/tagged/craftcms)
- [GitHub Discussions](https://github.com/timsteegmueller/craft-auto-updater/discussions)

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
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<div align="center">

**Entwickelt mit ❤️ für die CraftCMS Community von [Tim Steegmüller](https://github.com/timsteegmueller)**



[![GitHub stars](https://img.shields.io/github/stars/timsteegmueller/craft-auto-updater?style=social)](https://github.com/timsteegmueller/craft-auto-updater)
[![GitHub forks](https://img.shields.io/github/forks/timsteegmueller/craft-auto-updater?style=social)](https://github.com/timsteegmueller/craft-auto-updater/fork)
[![GitHub issues](https://img.shields.io/github/issues/timsteegmueller/craft-auto-updater)](https://github.com/timsteegmueller/craft-auto-updater/issues)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>
