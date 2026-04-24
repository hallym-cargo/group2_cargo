package com.logistics.app.config;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class RoundsLiteSchemaInitializer {

    @Bean
    public ApplicationRunner ensureRoundsLiteSchema(JdbcTemplate jdbcTemplate) {
        return args -> {
            ensureColumn(
                    jdbcTemplate,
                    "matchmaking_room",
                    "ALTER TABLE rounds_lite_room ADD COLUMN matchmaking_room boolean NOT NULL DEFAULT false"
            );
            ensureColumn(
                    jdbcTemplate,
                    "current_map_key",
                    "ALTER TABLE rounds_lite_room ADD COLUMN current_map_key varchar(64) DEFAULT 'sky-bridges'"
            );
        };
    }

    private void ensureColumn(JdbcTemplate jdbcTemplate, String columnName, String alterSql) {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM information_schema.columns
                WHERE table_name = 'rounds_lite_room'
                  AND column_name = ?
                """,
                Integer.class,
                columnName
        );

        if (count == null || count == 0) {
            jdbcTemplate.execute(alterSql);
        }
    }
}
