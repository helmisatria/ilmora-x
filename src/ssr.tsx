// @ts-nocheck
import {
  createStartHandler,
  defaultStreamHandler,
  type RequestHandler,
} from "@tanstack/react-start/server";
import { createRouter } from "./router";
import { observeRequest } from "./lib/observability";

const handler = createStartHandler({
  createRouter,
});

const startHandler = handler(defaultStreamHandler) as RequestHandler<unknown>;

export default function handleRequest(request: Request, options?: unknown) {
  return observeRequest(request, () => {
    return Promise.resolve(startHandler(request, options));
  });
}
