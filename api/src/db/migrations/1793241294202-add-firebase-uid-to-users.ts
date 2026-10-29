import { Kysely, sql, type SqlBool } from 'kysely'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('users')
    .addColumn('firebase_uid', 'varchar(255)')
    .execute()

  // unique among live Users, like the other soft-deleted natural keys
  await db.schema
    .createIndex('users_firebase_uid_unique')
    .on('users')
    .column('firebase_uid')
    .unique()
    .where(sql<SqlBool>`deleted_at IS NULL`)
    .execute()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('users_firebase_uid_unique').execute()

  await db.schema
    .alterTable('users')
    .dropColumn('firebase_uid')
    .execute()
}
