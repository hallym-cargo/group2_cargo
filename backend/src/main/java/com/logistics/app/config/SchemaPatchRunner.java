package com.logistics.app.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class SchemaPatchRunner implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    public SchemaPatchRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        patchShipmentTable();
    }

    private void patchShipmentTable() {
        addColumnIfMissing("shipment", "accepted_offer_id", "bigint");
        addColumnIfMissing("shipment", "agreed_price", "integer");
        addColumnIfMissing("shipment", "paid", "boolean");
        addColumnIfMissing("shipment", "payment_completed_at", "timestamp");
        addColumnIfMissing("shipment", "scheduled_start_at", "timestamp");

        jdbcTemplate.execute("UPDATE shipment SET paid = false WHERE paid IS NULL");
        jdbcTemplate.execute("ALTER TABLE shipment ALTER COLUMN paid SET DEFAULT false");
        jdbcTemplate.execute("ALTER TABLE shipment ALTER COLUMN paid SET NOT NULL");
    }

    private void addColumnIfMissing(String tableName, String columnName, String columnDefinition) {
        Integer count = jdbcTemplate.queryForObject(
                "select count(*) from information_schema.columns where table_name = ? and column_name = ?",
                Integer.class,
                tableName,
                columnName
        );

        if (count == null || count == 0) {
            jdbcTemplate.execute("ALTER TABLE " + tableName + " ADD COLUMN " + columnName + " " + columnDefinition);
        }
    }
}
