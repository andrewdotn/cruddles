// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import yargs from "yargs";
import { namedTypes } from "ast-types";
import type { NodePath } from "ast-types/lib/node-path";
import { readFile, writeFile } from "fs-extra";
import { parse, print, visit, types } from "recast";
import { format } from "prettier";
import { ok, strictEqual } from "assert";
import sqlFormatter from "@sqltools/formatter";

const b = types.builders;

function ensureMigrationHelperImport(ast: namedTypes.File) {
  let helperSeen = false;
  let maxImportIndex = -1;
  visit(ast, {
    visitImportDeclaration(path: NodePath<namedTypes.ImportDeclaration>): any {
      const index = path.parent.value.body.indexOf(path.value);
      maxImportIndex = Math.max(index, maxImportIndex);

      if (path.node.source.value === "../migration-helpers") {
        helperSeen = true;
      }

      this.traverse(path);
    },
  });

  if (!helperSeen) {
    ast.program.body.splice(
      maxImportIndex + 1,
      0,
      b.importDeclaration(
        [b.importSpecifier(b.identifier("sqliteAlterTableForeignKeysHelper"))],
        b.stringLiteral("../migration-helpers")
      )
    );
  }
}

function ensureMigrationHelperCalled(ast: namedTypes.File) {
  visit(ast, {
    visitClassMethod(path: NodePath<namedTypes.ClassMethod>): any {
      ok(path.node.key.type === "Identifier");
      if (path.node.key.name === "up" || path.node.key.name === "down") {
        if (path.node.body.body.length !== 1) {
          const existingBody = path.node.body.body;
          path.node.body.body = [
            b.expressionStatement(
              b.awaitExpression(
                b.callExpression(
                  b.identifier("sqliteAlterTableForeignKeysHelper"),
                  [
                    b.identifier("queryRunner"),
                    b.arrowFunctionExpression.from({
                      params: [],
                      body: b.blockStatement(existingBody),
                      async: true,
                    }),
                  ]
                )
              )
            ),
          ];
        }
      }
      this.traverse(path);
    },
  });
}

type TemplateCallExpression = namedTypes.CallExpression & {
  arguments: [namedTypes.TemplateLiteral];
};

function extractSqls(ast: namedTypes.File) {
  const seenSqls: TemplateCallExpression[] = [];
  visit(ast, {
    // ts-ignore: `import type { NodePath } from 'ast-types'`
    visitCallExpression(path: NodePath<namedTypes.CallExpression>): any {
      if (
        path.node.callee.type === "MemberExpression" &&
        path.node.callee.object.type === "Identifier" &&
        path.node.callee.object.name === "queryRunner" &&
        path.node.callee.property.type === "Identifier" &&
        path.node.callee.property.name === "query"
      ) {
        const arg0 = path.node.arguments[0];
        ok(arg0.type === "TemplateLiteral");
        if (arg0.quasis.length !== 1) {
          throw new Error("cannot handle interpolation");
        }
        seenSqls.push(path.node as TemplateCallExpression);

        // A template literal has a ‘raw’ and ‘cooked’ value. The `raw` value
        // has not had backslash escape sequences interpreted. The `cooked`
        // value is the interpreted value of `raw`, and may be undefined if
        // `raw` value has invalid backslash escape sequences.
        //
        // We read the `cooked` value for convenience, but recast only looks at
        // `raw` when outputting. If the migration SQL had backslash escapes
        // `that are invalid according to the JS spec, we’d have to revisit
        // `this.
        const cooked = arg0.quasis[0].value.cooked;
        ok(cooked);

        let formatted = sqlFormatter.format(cooked);
        // This is a very partial implementation of uncooking, with some
        // formatting adjustments mixed in.
        formatted = formatted
          .replace(/"/g, "`")
          .replace(/\\/g, "\\\\")
          .replace(/`/g, "\\`")
          .replace(/\n/g, "\n         ");

        path.node.arguments[0] = b.templateLiteral(
          [b.templateElement({ raw: formatted, cooked: null }, true)],
          []
        );
      }
      this.traverse(path);
    },
  });

  strictEqual(seenSqls.length, 8);

  // this should be gated by making sure we’re in the down method
  const downSqls = seenSqls.slice(4, 8);

  let match;

  const createRe = /^CREATE TABLE \\`([^`]*)\\`(.*)/s;
  const createExpr = downSqls.find((e) =>
    createRe.test(e.arguments[0].quasis[0].value.raw)
  );
  if (!createExpr) {
    throw new Error();
  }
  ok(createExpr);
  let createStmt = createExpr.arguments[0].quasis[0].value.raw;
  ok((match = createRe.exec(createStmt)));
  let tempTableName = match[1];

  const insertRe = /^INSERT INTO \\`([^`]*)\\`(.*)FROM \\`([^`]*)\\`/s;
  const insertExpr = downSqls.find((e) =>
    insertRe.test(e.arguments[0].quasis[0].value.raw)
  );
  ok(insertExpr);
  let insertStmt = insertExpr.arguments[0].quasis[0].value.raw;
  ok((match = insertRe.exec(insertStmt)));
  ok(match[1] === tempTableName);
  let sourceTableName = match[3];

  const dropRe = /^DROP TABLE \\`([^`]*)\\`/;
  const dropExpr = downSqls.find((e) =>
    dropRe.test(e.arguments[0].quasis[0].value.raw)
  );
  ok(dropExpr);
  let dropStmt = dropExpr.arguments[0].quasis[0].value.raw;
  ok((match = dropRe.exec(dropStmt)));
  ok(match[1] === sourceTableName);

  const alterRe = /^ALTER TABLE \\`([^`]*)\\`\s+RENAME TO \\`([^`]*)\\`(.*)/s;
  const alterExpr = downSqls.find((e) =>
    alterRe.test(e.arguments[0].quasis[0].value.raw)
  );
  ok(alterExpr);
  let alterStmt = alterExpr.arguments[0].quasis[0].value.raw;
  ok((match = alterRe.exec(alterStmt)));
  ok(match[1] === tempTableName);
  ok((match[2] = sourceTableName));

  if (sourceTableName === "temporary_" + tempTableName) {
    // This is backwards, need to flip.
    [sourceTableName, tempTableName] = [tempTableName, sourceTableName];

    ok((match = createRe.exec(createStmt)));
    createStmt = `CREATE TABLE \\\`${tempTableName}\\\`${match[2]}`;

    dropStmt = `DROP TABLE \\\`${sourceTableName}\\\``;
    alterStmt = `ALTER TABLE \\\`${tempTableName}\\\`
           RENAME TO \\\`${sourceTableName}\\\``;
    ok((match = insertRe.exec(insertStmt)));
    insertStmt = `INSERT INTO \\\`${tempTableName}\\\`${match[2]}FROM \\\`${sourceTableName}\\\``;
  }

  downSqls[0].arguments[0].quasis[0].value.raw = createStmt;
  downSqls[1].arguments[0].quasis[0].value.raw = insertStmt;
  downSqls[2].arguments[0].quasis[0].value.raw = dropStmt;
  downSqls[3].arguments[0].quasis[0].value.raw = alterStmt;
}

export function cleanup(migrationSource: string) {
  const ast = parse(migrationSource, {
    parser: require("recast/parsers/typescript"),
  });

  ensureMigrationHelperImport(ast);
  ensureMigrationHelperCalled(ast);

  extractSqls(ast);

  let updatedSource = print(ast).code;
  updatedSource = updatedSource.replace(/\n\nimport/, "\nimport");
  const prettified = format(updatedSource, { parser: "babel-ts" });
  return prettified;
}

async function main() {
  const argv = (yargs
    .strict()
    .demandCommand(0, 0)
    .command("$0 [options] <file>", "Cleanup migration file", (yargs) => {
      yargs
        .option("write", {
          description: "update the file in place",
          type: "boolean",
        })
        .positional("file", { describe: "the migration file to update" });
    }).argv as unknown) as { file: string; write: boolean };

  const fileName = argv.file;
  const originalSource = (await readFile(fileName)).toString();
  const cleaned = cleanup(originalSource);

  if (argv.write) {
    await writeFile(fileName, cleaned);
  } else {
    console.log(cleaned);
  }
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
