import { DreamMigrationHelpers } from '@rvoh/dream/db'
import { Kysely, sql } from 'kysely'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await DreamMigrationHelpers.createExtension(db, 'citext')

  await db.schema
    .alterTable('hosts')
    .addColumn('legal_name', sql`citext`, col => col.notNull())
    .addColumn('signed_host_agreement_at', 'timestamp', col => col.notNull())
    .execute()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('hosts')
    .dropColumn('legal_name')
    .dropColumn('signed_host_agreement_at')
    .execute()
}