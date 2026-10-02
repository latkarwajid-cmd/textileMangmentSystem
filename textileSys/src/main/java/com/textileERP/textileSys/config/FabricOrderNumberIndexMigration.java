package com.textileERP.textileSys.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.LinkedHashMap;
import java.util.Map;

/** Removes the legacy unique index so an archived fabric order number can be reused. */
@Component
public class FabricOrderNumberIndexMigration implements ApplicationRunner {
    private final DataSource dataSource;

    public FabricOrderNumberIndexMigration(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metadata = connection.getMetaData();
            Map<String, IndexColumns> indexes = new LinkedHashMap<>();
            try (ResultSet rows = metadata.getIndexInfo(connection.getCatalog(), null, "fabric_orders", true, false)) {
                while (rows.next()) {
                    String indexName = rows.getString("INDEX_NAME");
                    String columnName = rows.getString("COLUMN_NAME");
                    if (indexName == null || columnName == null) continue;
                    IndexColumns index = indexes.computeIfAbsent(indexName, ignored -> new IndexColumns());
                    index.unique = !rows.getBoolean("NON_UNIQUE");
                    index.columns++;
                    index.onlyOrderNo &= "order_no".equalsIgnoreCase(columnName);
                }
            }

            for (Map.Entry<String, IndexColumns> entry : indexes.entrySet()) {
                IndexColumns index = entry.getValue();
                if (index.unique && index.columns == 1 && index.onlyOrderNo) {
                    String safeIndexName = entry.getKey().replace("`", "``");
                    try (Statement statement = connection.createStatement()) {
                        statement.execute("ALTER TABLE `fabric_orders` DROP INDEX `" + safeIndexName + "`");
                    }
                }
            }
        }
    }

    private static final class IndexColumns {
        private boolean unique;
        private int columns;
        private boolean onlyOrderNo = true;
    }
}
