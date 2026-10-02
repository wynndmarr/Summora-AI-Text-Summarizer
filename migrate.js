const mysql = require("mysql2/promise");
const { Pool } = require("pg");

const mariadb = mysql.createPool({
    host: "localhost",
    port: 3306,
    user: "summora_migrate",
    password: "migrate123",
    database: "summora_db"
});

const postgres = new Pool({
    host: "localhost",
    port: 5432,
    user: "summora_user",
    password: "summoraadmin",
    database: "summora_db"
});

async function migrate() {
    let mariaConnection;
    let pgClient;

    try {
        console.log("=================================");
        console.log(" MIGRASI MARIADB -> POSTGRESQL");
        console.log("=================================");

        mariaConnection =
            await mariadb.getConnection();

        pgClient =
            await postgres.connect();

        console.log("✓ Terhubung ke MariaDB");
        console.log("✓ Terhubung ke PostgreSQL");

        await pgClient.query("BEGIN");

        /*
         * =========================================
         * USERS
         * =========================================
         */

        const [users] =
            await mariaConnection.query(`
                SELECT
                    id,
                    name,
                    email,
                    password_hash,
                    created_at,
                    is_verified,
                    updated_at
                FROM users
                ORDER BY id
            `);

        console.log(`\nUsers ditemukan: ${users.length}`);

        for (const user of users) {

            await pgClient.query(
                `
                INSERT INTO users (
                    id,
                    name,
                    email,
                    password_hash,
                    created_at,
                    is_verified,
                    updated_at
                )
                VALUES ($1,$2,$3,$4,$5,$6,$7)
                ON CONFLICT (id)
                DO UPDATE SET
                    name = EXCLUDED.name,
                    email = EXCLUDED.email,
                    password_hash = EXCLUDED.password_hash,
                    created_at = EXCLUDED.created_at,
                    is_verified = EXCLUDED.is_verified,
                    updated_at = EXCLUDED.updated_at
                `,
                [
                    user.id,
                    user.name,
                    user.email,
                    user.password_hash,
                    user.created_at,
                    Boolean(user.is_verified),
                    user.updated_at
                ]
            );
        }

        console.log("✓ Users berhasil dimigrasikan");


        /*
         * =========================================
         * SUMMARIES
         * =========================================
         */

        const [summaries] =
            await mariaConnection.query(`
                SELECT
                    id,
                    user_id,
                    original_text,
                    main_idea,
                    summary_points,
                    created_at
                FROM summaries
                ORDER BY id
            `);

        console.log(
            `Summaries ditemukan: ${summaries.length}`
        );

        for (const summary of summaries) {

            await pgClient.query(
                `
                INSERT INTO summaries (
                    id,
                    user_id,
                    original_text,
                    main_idea,
                    summary_points,
                    created_at
                )
                VALUES ($1,$2,$3,$4,$5,$6)
                ON CONFLICT (id)
                DO UPDATE SET
                    user_id = EXCLUDED.user_id,
                    original_text = EXCLUDED.original_text,
                    main_idea = EXCLUDED.main_idea,
                    summary_points = EXCLUDED.summary_points,
                    created_at = EXCLUDED.created_at
                `,
                [
                    summary.id,
                    summary.user_id,
                    summary.original_text,
                    summary.main_idea,
                    summary.summary_points,
                    summary.created_at
                ]
            );
        }

        console.log(
            "✓ Summaries berhasil dimigrasikan"
        );


        /*
         * =========================================
         * RESET SEQUENCE
         * =========================================
         */

        await pgClient.query(`
            SELECT setval(
                pg_get_serial_sequence(
                    'users',
                    'id'
                ),
                COALESCE(
                    (SELECT MAX(id) FROM users),
                    1
                ),
                true
            )
        `);

        await pgClient.query(`
            SELECT setval(
                pg_get_serial_sequence(
                    'summaries',
                    'id'
                ),
                COALESCE(
                    (SELECT MAX(id) FROM summaries),
                    1
                ),
                true
            )
        `);

        await pgClient.query("COMMIT");

        console.log("\n=================================");
        console.log(" MIGRASI BERHASIL");
        console.log("=================================");

        const usersCheck =
            await pgClient.query(
                "SELECT COUNT(*) FROM users"
            );

        const summariesCheck =
            await pgClient.query(
                "SELECT COUNT(*) FROM summaries"
            );

        console.log(
            `Users PostgreSQL: ${usersCheck.rows[0].count}`
        );

        console.log(
            `Summaries PostgreSQL: ${summariesCheck.rows[0].count}`
        );

    } catch (error) {

        if (pgClient) {
            await pgClient.query("ROLLBACK");
        }

        console.error("\n❌ MIGRASI GAGAL:");
        console.error(error);

        process.exitCode = 1;

    } finally {

        if (mariaConnection) {
            mariaConnection.release();
        }

        if (pgClient) {
            pgClient.release();
        }

        await mariadb.end();
        await postgres.end();
    }
}

migrate();
