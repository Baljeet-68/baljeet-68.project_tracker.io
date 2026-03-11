# Orphaned Utility Scripts

These scripts are **NOT used by the main application** and should be moved to an archive folder or deleted after ensuring their data has been persisted.

## Migration Scripts (One-Time Use)
These were used to set up the initial database schema and data. They can be safely archived after initial setup:

- `migrate_bugs_attachments.js` - Added attachments column to bugs table
- `migrate_bugs_deadline.js` - Added deadline column to bugs table  
- `migrate_careers.js` - Migrated career/jobs data
- `migrate_data.js` - Initial data migration
- `migrate_jobs_expiry.js` - Added job expiry logic
- `migrate_leaves.js` - Migrated leave data
- `migrate_milestones.js` - Migrated milestone data
- `migrate_project_documents.js` - Migrated project documents
- `migrate_projects.js` - Migrated projects table

## Utility Scripts (For Debugging)
These were used for one-time debugging/setup tasks:

- `check_bugs_table.js` - Schema inspection
- `check_db.js` - Database connectivity check
- `create_admin.js` - Initial admin user creation
- `create_notifications_table.js` - Manual table creation
- `debug_login.js` - Auth debugging
- `fix_milestones.js` - Data repair script
- `import_sql.js` - SQL file importer
- `insert_projects_to_supabase.js` - Legacy Supabase integration (no longer used)
- `test_api.js` - Manual endpoint testing

## Recommendation

1. **Archive immediately:** Move all these to `server/scripts/archived/` or a separate repo
2. **Document:** Keep a copy of this ORPHANED_SCRIPTS.md with version control
3. **For future migrations:** Use proper database migration tools like:
   - Flyway (Java)
   - Liquibase (Multi-language)
   - Migrate (Go-based, works with Node.js projects)
   - Manual timestamped scripts in `server/migrations/` folder

## Archive Command

```bash
# Create archive directory
mkdir -p server/scripts/archived

# Move all orphaned scripts
mv server/migrate_*.js server/scripts/archived/
mv server/check_*.js server/scripts/archived/
mv server/create_*.js server/scripts/archived/
mv server/debug_*.js server/scripts/archived/
mv server/fix_*.js server/scripts/archived/
mv server/import_*.js server/scripts/archived/
mv server/insert_*.js server/scripts/archived/
mv server/test_api.js server/scripts/archived/

# Commit to git
git add server/scripts/archived/
git commit -m "Archive orphaned utility and migration scripts"
```
