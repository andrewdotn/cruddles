Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

This is a proof of concept demonstrating the feasibility of extracting a
general crud framework from a full-stack typescript app I once wrote.

The cool thing is the way the server-side state is embedded in the
response for hydration so that you get react-driven live-editable fields
that don’t reload the page, without any extra round trips.

In addition to a much richer data model with relations and domain-specific
business logic, the original also included stuff like:

  - complex filters and sorting on list pages, preserved in query strings

  - management of users with different permission levels

The code for that could be extracted as well.
