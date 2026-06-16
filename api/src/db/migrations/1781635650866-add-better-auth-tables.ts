import { Kysely, sql } from 'kysely'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('users')
    .addColumn('name', 'varchar(255)', col => col.notNull().defaultTo(''))
    .addColumn('email_verified', 'boolean', col => col.notNull().defaultTo(false))
    .addColumn('image', 'text')
    .alterColumn('encrypted_phone', col => col.dropNotNull())
    .execute()

  await db.schema
    .createTable('auth_sessions')
    .addColumn('id', 'uuid', col => col.primaryKey().defaultTo(sql`uuidv7()`))
    .addColumn('user_id', 'uuid', col => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('token', 'text', col => col.notNull().unique())
    .addColumn('expires_at', 'timestamp', col => col.notNull())
    .addColumn('ip_address', 'text')
    .addColumn('user_agent', 'text')
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()

  await db.schema.createIndex('auth_sessions_user_id_idx').on('auth_sessions').column('user_id').execute()

  await db.schema
    .createTable('auth_accounts')
    .addColumn('id', 'uuid', col => col.primaryKey().defaultTo(sql`uuidv7()`))
    .addColumn('user_id', 'uuid', col => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('account_id', 'text', col => col.notNull())
    .addColumn('provider_id', 'text', col => col.notNull())
    .addColumn('access_token', 'text')
    .addColumn('refresh_token', 'text')
    .addColumn('access_token_expires_at', 'timestamp')
    .addColumn('refresh_token_expires_at', 'timestamp')
    .addColumn('scope', 'text')
    .addColumn('id_token', 'text')
    .addColumn('password', 'text')
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()

  await db.schema.createIndex('auth_accounts_user_id_idx').on('auth_accounts').column('user_id').execute()
  await db.schema
    .createIndex('auth_accounts_provider_account_idx')
    .on('auth_accounts')
    .columns(['provider_id', 'account_id'])
    .unique()
    .execute()

  await db.schema
    .createTable('auth_verifications')
    .addColumn('id', 'uuid', col => col.primaryKey().defaultTo(sql`uuidv7()`))
    .addColumn('identifier', 'text', col => col.notNull())
    .addColumn('value', 'text', col => col.notNull())
    .addColumn('expires_at', 'timestamp', col => col.notNull())
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()

  await db.schema
    .createIndex('auth_verifications_identifier_idx')
    .on('auth_verifications')
    .column('identifier')
    .execute()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('auth_verifications').execute()
  await db.schema.dropTable('auth_accounts').execute()
  await db.schema.dropTable('auth_sessions').execute()

  await db.schema
    .alterTable('users')
    .dropColumn('image')
    .dropColumn('email_verified')
    .dropColumn('name')
    .alterColumn('encrypted_phone', col => col.setNotNull())
    .execute()
}
