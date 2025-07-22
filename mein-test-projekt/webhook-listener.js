// webhook-listener.js - Vollständige Version
const express = require('express');
const { exec } = require('child_process');
const app = express();

app.use(express.json());

// CORS Headers
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Repository-Konfiguration basierend auf deinem Setup
const REPO_CONFIGS = {
    'craft-projekte': {
        path: '~/dev/craft-automation',
        dockerContainer: 'craft-automation-web-1',
        database: 'craft_db'
    },
    'craft-test-repo': {
        path: '~/dev/craft-test-repo',
        dockerContainer: 'craft-automation-web-1',
        database: 'craft_test_db'
    }
};

// 🩺 Health Check Endpoint (das hat gefehlt!)
app.get('/status', (req, res) => {
    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        server: '192.168.1.22:3001',
        uptime: process.uptime(),
        docker_containers: 'craft-automation-db-1, craft-automation-web-1',
        available_endpoints: ['/status', '/backup', '/craft-update', '/composer-update']
    });
});

// 💾 Database Backup
app.post('/backup', (req, res) => {
    console.log('🔄 Backup request received:', req.body);
    
    const { source = 'manual', repos = ['craft-projekte'], database } = req.body;
    const repo = repos[0];
    const config = REPO_CONFIGS[repo] || REPO_CONFIGS['craft-projekte'];
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Docker mysqldump command (wie in deiner Spezifikation)
    const command = `docker exec craft-automation-db-1 mysqldump -u craftuser -p'craftpass123' ${database || config.database} > ${config.path}/backups/${repo}-${source}-${timestamp}.sql`;
    
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error('❌ Backup error:', error);
            return res.json({ 
                status: 'error', 
                message: error.message,
                repo,
                command: command.replace(/craftpass123/, '***')
            });
        }
        
        console.log('✅ Backup successful:', repo);
        res.json({ 
            status: 'success', 
            repo,
            timestamp,
            backup_file: `${repo}-${source}-${timestamp}.sql`,
            path: config.path
        });
    });
});

// 🚀 Craft CMS Update
app.post('/craft-update', (req, res) => {
    console.log('🚀 Craft update request:', req.body);
    
    const { repo = 'craft-projekte', branch = 'main', path } = req.body;
    const config = REPO_CONFIGS[repo] || REPO_CONFIGS['craft-projekte'];
    
    // Craft update command via Docker (wie in Spickzettel)
    const command = `docker exec craft-automation-web-1 php craft update all`;
    
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error('❌ Craft update error:', error);
            return res.json({ 
                status: 'error', 
                message: error.message,
                repo,
                output: stderr
            });
        }
        
        console.log('✅ Craft update successful:', repo);
        res.json({ 
            status: 'success', 
            repo,
            branch,
            output: stdout,
            action: 'craft-update'
        });
    });
});

// 📦 Composer Update
app.post('/composer-update', (req, res) => {
    console.log('📦 Composer update request:', req.body);
    
    const { repo = 'craft-projekte', branch = 'main' } = req.body;
    const config = REPO_CONFIGS[repo] || REPO_CONFIGS['craft-projekte'];
    
    // Composer update + Git commit + push (wie in Spickzettel)
    const command = `cd ${config.path} && docker exec craft-automation-web-1 sh -c 'composer update --no-interaction' && git add composer.lock && git commit -m "🤖 Auto-Update Dependencies $(date)" && git push origin ${branch}`;
    
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error('❌ Composer update error:', error);
            return res.json({ 
                status: 'error', 
                message: error.message,
                repo,
                output: stderr
            });
        }
        
        console.log('✅ Composer update successful:', repo);
        res.json({ 
            status: 'success', 
            repo,
            branch,
            output: stdout,
            action: 'composer-update',
            git_push: 'completed'
        });
    });
});

// 🧪 Test Endpoints
app.get('/test', (req, res) => {
    res.json({ 
        message: 'Craft Automation API Test OK',
        docker_status: 'checking...'
    });
    
    exec('docker ps --format "table {{.Names}}\t{{.Status}}"', (error, stdout) => {
        if (!error) {
            console.log('Docker containers:', stdout);
        }
    });
});

// Error Handler
app.use((error, req, res, next) => {
    console.error('💥 Server error:', error);
    res.status(500).json({
        status: 'server_error',
        message: error.message,
        timestamp: new Date().toISOString()
    });
});

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Craft CMS Automation API läuft auf 192.168.1.22:${PORT}`);
    console.log(`📍 Verfügbare Endpoints:`);
    console.log(`   GET  http://192.168.1.22:${PORT}/status`);
    console.log(`   GET  http://192.168.1.22:${PORT}/test`);
    console.log(`   POST http://192.168.1.22:${PORT}/backup`);
    console.log(`   POST http://192.168.1.22:${PORT}/craft-update`);
    console.log(`   POST http://192.168.1.22:${PORT}/composer-update`);
    console.log(`🧪 Test: curl http://192.168.1.22:${PORT}/status`);
});