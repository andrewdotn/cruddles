// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import { QueryRunner } from "typeorm";

// This skips anything to do with views and indexes.
//
// You may also need to reorder the generated migrations, especially the `down`
// bit, to follow the required order from the sqlite manual:
//
// 1. Create new table		  1. Rename old table
// 2. Copy data			          2. Create new table
// 3. Drop old table		      3. Copy data
// 4. Rename new into old	  4. Drop old table
//
// ↑ Correct			               ↑ Incorrect
export async function sqliteAlterTableForeignKeysHelper(
  queryRunner: QueryRunner,
  dbOperations: () => Promise<void>
) {
  // Skipping the view/index steps from https://www.sqlite.org/lang_altertable.html#making_other_kinds_of_table_schema_changes :

  // https://www.sqlite.org/pragma.html#pragma_foreign_keys says, “This pragma
  // is a no-op within a transaction; foreign key constraint enforcement may
  // only be enabled or disabled when there is no pending BEGIN or SAVEPOINT.”
  //
  // But typeorm gives us a connection in which a transaction has already
  // started, so we need to roll back, and hope no important queries had yet
  // been issued in that transaction.
  await queryRunner.rollbackTransaction();
  //  1. If foreign key constraints are enabled, disable them
  //     using PRAGMA foreign_keys=OFF.
  await queryRunner.query(`PRAGMA foreign_keys=OFF`);
  try {
    //  2. Start a transaction.
    await queryRunner.startTransaction();

    //  4. Use CREATE TABLE to construct a new table "new_X" that is in the
    //     desired revised format of table X. Make sure that the name
    //     "new_X" does not collide with any existing table name, of
    //     course.
    //
    //  5. Transfer content from X into new_X using a statement like:
    //     INSERT INTO new_X SELECT ... FROM X.
    //
    //  6. Drop the old table X:  DROP TABLE X.
    //
    //  7. Change the name of new_X to X using: ALTER TABLE new_X RENAME TO
    //     X.
    await dbOperations();

    // 10. If foreign key constraints were originally enabled then
    //     run `PRAGMA foreign_key_check` to verify that the schema change
    //     did not break any foreign key constraints.
    const badRows = await queryRunner.query(`PRAGMA foreign_key_check`);
    if (badRows.length !== 0) {
      await queryRunner.rollbackTransaction();
      throw new Error(
        `migration results in ${badRows.length} broken foreign key constraints`
      );
    }

    // 11. Commit the transaction started in step 2.
    await queryRunner.commitTransaction();

    // Start a new transaction so that the surrounding typeorm machinery is able
    // to immediately resume querying
    await queryRunner.startTransaction();
  } finally {
    // 12. If foreign keys constraints were originally enabled, reenable
    // them now.
    await queryRunner.query(`PRAGMA foreign_keys=ON`);
  }
}
