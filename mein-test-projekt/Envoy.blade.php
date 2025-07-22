@servers(['production' => 'user@your-server.com', 'local' => 'localhost'])

@setup
    $repository = 'https://github.com/timsteegmuller/craft-automation.git';
    $releases_dir = '/var/www/releases';
    $app_dir = '/var/www/craft-automation';
    $shared_dir = '/var/www/shared';
    $release = date('YmdHis');
    $new_release_dir = $releases_dir .'/'. $release;
    $branch = $branch ?? 'main';
@endsetup

@story('deploy')
    prepare_deployment
    clone_repository  
    run_composer
    create_symlinks
    migrate_database
    optimize_application
    update_current_release
    cleanup_old_releases
    backup_database
    notify_success
@endstory

@story('rollback')
    rollback_release
@endstory

@task('prepare_deployment')
    echo "🚀 Starting deployment of {{ $branch }} branch"
    echo "📁 Creating directories if they don't exist"
    [ -d {{ $releases_dir }} ] || mkdir -p {{ $releases_dir }}
    [ -d {{ $shared_dir }} ] || mkdir -p {{ $shared_dir }}
    [ -d {{ $shared_dir }}/storage ] || mkdir -p {{ $shared_dir }}/storage
    [ -d {{ $shared_dir }}/backups ] || mkdir -p {{ $shared_dir }}/backups
@endtask

@task('clone_repository')
    echo "📥 Cloning repository into {{ $new_release_dir }}"
    git clone --depth 1 --branch {{ $branch }} {{ $repository }} {{ $new_release_dir }}
    cd {{ $new_release_dir }}
    echo "✅ Repository cloned successfully"
@endtask

@task('run_composer')
    echo "📦 Installing Composer dependencies"
    cd {{ $new_release_dir }}
    composer install --prefer-dist --no-scripts --no-dev --optimize-autoloader --quiet
    echo "✅ Composer dependencies installed"
@endtask

@task('create_symlinks')
    echo "🔗 Creating symbolic links"
    cd {{ $new_release_dir }}
    
    # Remove current storage and link to shared
    rm -rf storage
    ln -nfs {{ $shared_dir }}/storage storage
    
    # Link .env file
    ln -nfs {{ $shared_dir }}/.env .env
    
    # Link backup directory
    ln -nfs {{ $shared_dir }}/backups backups
    
    echo "✅ Symbolic links created"
@endtask

@task('migrate_database')
    echo "🗃️ Running database migrations"
    cd {{ $new_release_dir }}
    
    # Check if this is a Craft CMS project
    if [ -f "craft" ]; then
        php craft migrate/all --interactive=0
        echo "✅ Craft migrations completed"
    else
        echo "ℹ️ No Craft binary found, skipping migrations"
    fi
@endtask

@task('optimize_application')
    echo "⚡ Optimizing application"
    cd {{ $new_release_dir }}
    
    if [ -f "craft" ]; then
        php craft clear-caches/all
        php craft cache/flush-all
        echo "✅ Craft caches cleared"
    fi
@endtask

@task('update_current_release')
    echo "🔄 Updating current release symlink"
    ln -nfs {{ $new_release_dir }} {{ $app_dir }}/current
    echo "✅ Current release updated to {{ $release }}"
@endtask

@task('cleanup_old_releases')
    echo "🧹 Cleaning up old releases (keeping last 3)"
    cd {{ $releases_dir }}
    ls -t | tail -n +4 | xargs -r rm -rf
    echo "✅ Old releases cleaned up"
@endtask

@task('backup_database')
    echo "💾 Creating database backup"
    cd {{ $shared_dir }}/backups
    
    # Create backup with timestamp
    BACKUP_FILE="backup-{{ $release }}.sql"
    docker exec craft-automation-db-1 mysqldump -u craftuser -p'craftpass123' craft_db > $BACKUP_FILE
    
    if [ -s $BACKUP_FILE ]; then
        echo "✅ Database backup created: $BACKUP_FILE"
    else
        echo "❌ Database backup failed"
    fi
@endtask

@task('rollback_release')
    echo "🔄 Rolling back to previous release"
    cd {{ $releases_dir }}
    PREVIOUS_RELEASE=$(ls -t | head -n 2 | tail -n 1)
    
    if [ -n "$PREVIOUS_RELEASE" ]; then
        ln -nfs {{ $releases_dir }}/$PREVIOUS_RELEASE {{ $app_dir }}/current
        echo "✅ Rolled back to release: $PREVIOUS_RELEASE"
    else
        echo "❌ No previous release found"
    fi
@endtask

@task('notify_success')
    echo "🎉 Deployment completed successfully!"
    echo "📍 Release: {{ $release }}"
    echo "🌐 Branch: {{ $branch }}"
    echo "⏰ Time: $(date)"
@endtask

@error
    echo "❌ Deployment failed in task: {{ $task }}"
    echo "🔄 Consider running: envoy run rollback"
@enderror