import { Kysely, sql } from 'kysely'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('bookings')
    .addColumn('id', 'uuid', col => col.primaryKey().defaultTo(sql`uuidv7()`))
    .addColumn('guest_id', 'uuid', col => col.references('guests.id').onDelete('restrict').notNull())
    .addColumn('place_id', 'uuid', col => col.references('places.id').onDelete('restrict').notNull())
    .addColumn('starts_on', 'date', col => col.notNull())
    .addColumn('ends_on', 'date', col => col.notNull())
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .addColumn('deleted_at', 'timestamp')
    .execute()

  await db.schema.createIndex('bookings_guest_id').on('bookings').column('guest_id').execute()

  await db.schema.createIndex('bookings_place_id').on('bookings').column('place_id').execute()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('bookings_guest_id').execute()
  await db.schema.dropIndex('bookings_place_id').execute()
  await db.schema.dropTable('bookings').execute()
}
