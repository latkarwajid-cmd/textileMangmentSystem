-- Run once against the application database. Active set-number uniqueness is
-- enforced by SizingSetService; deleted rows remain for history but can reuse
-- their set numbers.
SET @drop_set_no_unique_indexes = (
    SELECT GROUP_CONCAT(
        CONCAT('DROP INDEX `', REPLACE(index_name, '`', '``'), '`')
        SEPARATOR ', '
    )
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'sizing_sets'
      AND column_name = 'set_no'
      AND non_unique = 0
      AND index_name <> 'PRIMARY'
);

SET @sizing_set_index_migration = IF(
    @drop_set_no_unique_indexes IS NULL,
    'SELECT 1',
    CONCAT('ALTER TABLE sizing_sets ', @drop_set_no_unique_indexes)
);

PREPARE sizing_set_index_statement FROM @sizing_set_index_migration;
EXECUTE sizing_set_index_statement;
DEALLOCATE PREPARE sizing_set_index_statement;
