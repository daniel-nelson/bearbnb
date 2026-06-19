import { Kysely, sql } from 'kysely'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('reviews')
    .addColumn('id', 'uuid', col =>
      col
        .primaryKey()
        .defaultTo(sql`uuidv7()`),
    )
    .addColumn('booking_id', 'uuid', col => col.references('bookings.id').onDelete('restrict').notNull())
    .addColumn('rating', 'integer', col => col.notNull())
    .addColumn('body', 'text', col => col.notNull())
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .addColumn('deleted_at', 'timestamp')
    .addCheckConstraint('reviews_rating_between_one_and_five', sql`rating >= 1 AND rating <= 5`)
    .execute()

  await sql`
    CREATE UNIQUE INDEX reviews_booking_id_unique
    ON reviews (booking_id)
    WHERE deleted_at IS NULL
  `.execute(db)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('reviews_booking_id_unique').execute()
  await db.schema.dropTable('reviews').execute()
}
