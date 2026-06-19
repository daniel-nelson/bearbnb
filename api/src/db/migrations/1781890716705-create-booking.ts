import { DreamMigrationHelpers } from '@rvoh/dream/db'
import { Kysely, sql } from 'kysely'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await DreamMigrationHelpers.createExtension(db, 'btree_gist')

  await db.schema
    .createTable('bookings')
    .addColumn('id', 'uuid', col =>
      col
        .primaryKey()
        .defaultTo(sql`uuidv7()`),
    )
    .addColumn('guest_id', 'uuid', col => col.references('guests.id').onDelete('restrict').notNull())
    .addColumn('place_id', 'uuid', col => col.references('places.id').onDelete('restrict').notNull())
    .addColumn('starts_on', 'date', col => col.notNull())
    .addColumn('ends_on', 'date', col => col.notNull())
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .addColumn('deleted_at', 'timestamp')
    .addCheckConstraint('bookings_checkout_after_start', sql`ends_on > starts_on`)
    .execute()

  await db.schema
    .createIndex('bookings_guest_id')
    .on('bookings')
    .column('guest_id')
    .execute()

  await db.schema
    .createIndex('bookings_place_id')
    .on('bookings')
    .column('place_id')
    .execute()

  await sql`
    ALTER TABLE bookings
    ADD CONSTRAINT bookings_no_overlapping_occupied_nights
    EXCLUDE USING gist (
      place_id WITH =,
      daterange(starts_on, ends_on, '[)') WITH &&
    )
    WHERE (deleted_at IS NULL)
  `.execute(db)

  await sql`
    COMMENT ON CONSTRAINT bookings_no_overlapping_occupied_nights ON bookings
    IS 'Booking ends_on is the checkout date, so occupied nights are [starts_on, ends_on) and same-day turnover is allowed.'
  `.execute(db)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await DreamMigrationHelpers.dropConstraint(db, 'bookings_no_overlapping_occupied_nights', { table: 'bookings' })
  await db.schema.dropIndex('bookings_guest_id').execute()
  await db.schema.dropIndex('bookings_place_id').execute()
  await db.schema.dropTable('bookings').execute()
}
