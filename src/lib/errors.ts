import { GraphQLError } from "graphql";

export class AppError extends GraphQLError {
  constructor(
    message: string,
    code: "BAD_USER_INPUT" | "NOT_FOUND"
  ) {
    super(message, {
      extensions: {
        code,
      },
    });

    this.name = "AppError";
  }
}