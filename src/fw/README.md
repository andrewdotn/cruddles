Target: line of business applications

It’s nice if it’s scalable, but for the typical use case of personal
applications, or line-of-business apps for small businesses or small teams
within large businesses, where if it’s really successful a few dozen users might
use it a few times an hour, that’s really not necessary.

## What is a web framework?

Objects = data + behaviour

  - A network of relational models

        class User {
            username: string;
            hashedPassword: string;
        }

        class TodoList {
            user: User;
            title: string;
            items: TodoItem[];

            itemsDueInNextWeek(): TodoItem[];
        }

        class TodoItem {
            title: string;
            done: boolean;
            dueDate?: date;
        }

  - Persistence of those models into a database; this is serialization to/from
  database rows
  - Generation of HTML pages that list and detail model data; this is
  serialization to HTML
  - Generation of forms and handling of form input
    This is serialization to/from strings and multipart/form-data
  - Instantiation of models in the browser for interactive purposes; making HTML
  pages come alive with interactivity, sharing methods like
  `itemsDueInNextWeek()` between the client and server
  - API support; this is serialization to/from JSON

## TypeORM

Using it, but not committed to it

Issues:
  - no lazy relations, and `reload()` ignores relations
  - awkward to specify additional selectColumns with `BaseEntity.find()`
  - `reload()` forgets custom selectColumns
