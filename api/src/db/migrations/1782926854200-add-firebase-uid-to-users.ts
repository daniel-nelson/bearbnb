import { Kysely } from 'kysely'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('users')
    .addColumn('firebase_uid', 'varchar(255)')
    .execute()
  await db.schema.createIndex('users_firebase_uid_unique').on('users').column('firebase_uid').unique().execute()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('users_firebase_uid_unique').execute()
  await db.schema
    .alterTable('users')
    .dropColumn('firebase_uid')
    .execute()
}
