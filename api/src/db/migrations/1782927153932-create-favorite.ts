import { Kysely, sql, type SqlBool } from 'kysely'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('favorites')
    .addColumn('id', 'uuid', col =>
      col
        .primaryKey()
        .defaultTo(sql`uuidv7()`),
    )
    .addColumn('guest_id', 'uuid', col => col.references('guests.id').onDelete('restrict').notNull())
    .addColumn('place_id', 'uuid', col => col.references('places.id').onDelete('restrict').notNull())
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .addColumn('deleted_at', 'timestamp')
    .execute()

  await db.schema
    .createIndex('favorites_guest_id')
    .on('favorites')
    .column('guest_id')
    .execute()

  await db.schema
    .createIndex('favorites_place_id')
    .on('favorites')
    .column('place_id')
    .execute()

  await db.schema
    .createIndex('favorites_deleted_at')
    .on('favorites')
    .column('deleted_at')
    .execute()

  await db.schema
    .createIndex('favorites_guest_id_place_id_unique')
    .on('favorites')
    .columns(['guest_id', 'place_id'])
    .unique()
    .where(sql<SqlBool>`deleted_at IS NULL`)
    .execute()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('favorites').execute()
}
