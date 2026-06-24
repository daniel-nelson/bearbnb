import { Kysely, sql } from 'kysely'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('users')
    .alterColumn('encrypted_phone', col => col.dropNotNull())
    .execute()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  const result = await sql<{ count: string }>`SELECT COUNT(*) AS count FROM users WHERE encrypted_phone IS NULL`.execute(
    db,
  )
  if (Number(result.rows[0]?.count ?? 0) > 0) {
    throw new Error('Cannot safely restore users.encrypted_phone NOT NULL after Firebase users have been created')
  }

  await db.schema
    .alterTable('users')
    .alterColumn('encrypted_phone', col => col.setNotNull())
    .execute()
}
