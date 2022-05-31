This is a sketch of a new ORM.

It uses code generation to create TypeScript classes that represent
database tables. Code generation is used because, while TypeScript types
aid implementation, refactoring, and correctness, there are issues with
run-time access to type information being poor, only being available
through non-javascript decorators, and writing sufficiently general
parametrized types for methods gets very convoluted.

## Design

  - A builder API describes models
  - A built ModelDescription:
       - can create a .ts file for the model
       - saves state for computing migrations
       - can generate SQL to create the table

## Details

Workflow will be:
  - Create/edit model description
  - Run code generator to
      - create/update generated class
      - generate migration by comparing generated schema from current
        model description against resulting schema of previous migrations
  - Run migrate to update db
