# Database Migration Strategy

## Overview
This project uses Sequelize ORM with a **manual migration approach** to ensure production database stability.

## Current Status
- **Database Sync**: DISABLED globally via `src/disable-all-sync.js`
- **Schema Management**: Manual migration files only
- **Environment**: PostgreSQL via Replit's managed database

## Migration Process

### Development
1. Create migration files in `src/migrations/`
2. Use Sequelize CLI or manual SQL scripts
3. Test migrations on development database first

### Production
1. **NEVER** enable automatic sync in production
2. Run migrations manually using SQL scripts
3. Backup database before any schema changes

## Migration File Naming
- Format: `YYYYMMDD_HHMMSS_description.sql`
- Example: `20250118_143000_add_user_preferences.sql`

## Commands
```bash
# Create new migration (manual)
npm run migration:create -- --name add_new_column

# Run migrations (manual via SQL tool)
# Use execute_sql_tool or database pane
```

## Safety Rules
1. Always backup before migrations
2. Test schema changes on development first
3. Use transactions for complex migrations
4. Document all schema changes in this directory

## Current Schema Status
All tables are managed through existing Sequelize models:
- Users, Shops, Orders, Messages, Notifications, etc.
- Schema is stable and production-ready