import { DreamMigrationHelpers } from '@rvoh/dream/db'
import { Kysely, sql } from 'kysely'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await DreamMigrationHelpers.createExtension(db, 'btree_gist')

  await db.schema
    .alterTable('bookings')
    .addCheckConstraint('bookings_starts_on_lte_ends_on', sql`starts_on <= ends_on`)
    .execute()

  await sql`
    ALTER TABLE bookings
    ADD CONSTRAINT bookings_place_id_date_range_exclusion
    EXCLUDE USING gist (
      place_id WITH =,
      daterange(starts_on, ends_on, '[]') WITH &&
    )
    WHERE (deleted_at IS NULL)
  `.execute(db)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable('bookings').dropConstraint('bookings_place_id_date_range_exclusion').execute()
  await db.schema.alterTable('bookings').dropConstraint('bookings_starts_on_lte_ends_on').execute()
}
