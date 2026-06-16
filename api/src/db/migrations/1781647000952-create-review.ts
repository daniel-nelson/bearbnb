import { Kysely, sql } from 'kysely'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('reviews')
    .addColumn('id', 'uuid', col => col.primaryKey().defaultTo(sql`uuidv7()`))
    .addColumn('guest_id', 'uuid', col => col.references('guests.id').onDelete('restrict').notNull())
    .addColumn('booking_id', 'uuid', col => col.references('bookings.id').onDelete('restrict').notNull())
    .addColumn('place_id', 'uuid', col => col.references('places.id').onDelete('restrict').notNull())
    .addColumn('rating', 'integer', col => col.notNull())
    .addColumn('body', 'text', col => col.notNull())
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .addColumn('deleted_at', 'timestamp')
    .execute()

  await db.schema.createIndex('reviews_guest_id').on('reviews').column('guest_id').execute()

  await db.schema.createIndex('reviews_booking_id').on('reviews').column('booking_id').execute()

  await db.schema.createIndex('reviews_place_id').on('reviews').column('place_id').execute()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('reviews_guest_id').execute()
  await db.schema.dropIndex('reviews_booking_id').execute()
  await db.schema.dropIndex('reviews_place_id').execute()
  await db.schema.dropTable('reviews').execute()
}
