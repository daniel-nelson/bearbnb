import { DreamMigrationHelpers } from '@rvoh/dream/db'
import { Kysely, sql, type SqlBool } from 'kysely'

// Users, Guests and Hosts are soft-deleted, which leaves their rows in the table.
// A plain unique constraint would keep reserving a soft-deleted row's email or
// user, so each is replaced by a unique index that only constrains live rows.
const NATURAL_KEYS = [
  { table: 'users', column: 'email', constraint: 'users_email_key', index: 'users_email_unique' },
  { table: 'guests', column: 'user_id', constraint: 'guests_user_id_key', index: 'guests_user_id_unique' },
  { table: 'hosts', column: 'user_id', constraint: 'hosts_user_id_key', index: 'hosts_user_id_unique' },
] as const

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  for (const { table, column, constraint, index } of NATURAL_KEYS) {
    await DreamMigrationHelpers.dropConstraint(db, constraint, { table })

    await db.schema
      .createIndex(index)
      .on(table)
      .column(column)
      .unique()
      .where(sql<SqlBool>`deleted_at IS NULL`)
      .execute()
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  for (const { table, column, constraint, index } of NATURAL_KEYS) {
    await db.schema.dropIndex(index).execute()

    await db.schema
      .alterTable(table)
      .addUniqueConstraint(constraint, [column])
      .execute()
  }
}
