/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
    pgm.sql(`
        CREATE TABLE documents (
            id SERIAL PRIMARY KEY,
            filename TEXT NOT NULL,
            file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'docx')),
            status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'failed')),
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE TABLE sections (
            id SERIAL PRIMARY KEY,
            document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
            order_index INTEGER NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            is_read BOOLEAN NOT NULL DEFAULT false
        );    
    `);
}

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.sql(`
        DROP TABLE IF EXISTS sections;
        DROP TABLE IF EXISTS documents;
  `);
}
