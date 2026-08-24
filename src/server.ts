import { createYoga } from "graphql-yoga";
import { serve } from "bun";
import { schema } from "./graphql/schema";

const yoga = createYoga({
  schema,
  graphqlEndpoint: "/graphql",
  maskedErrors: false,
});

serve({
  fetch: yoga,
  port: 4000,
});

console.log(
  "Bookmark Manager API running at http://localhost:4000/graphql"
);