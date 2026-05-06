import type { RequestLogger } from "evlog";

type OperationKind = "server_function" | "server_route";

type OperationContext = {
  operation: string;
  kind: OperationKind;
  method?: string;
  path?: string;
  requestId?: string;
};

type OperationLog = Pick<RequestLogger, "set" | "info" | "warn" | "error">;

let loggerInitialized = false;

async function loadEvlog() {
  const evlog = await import("evlog");

  if (loggerInitialized) {
    return evlog;
  }

  evlog.initLogger({
    env: {
      service: "ilmora-x",
      environment: process.env.NODE_ENV === "production" ? "production" : "development",
    },
  });

  loggerInitialized = true;

  return evlog;
}

function getDurationMs(startedAt: number) {
  return Math.round(performance.now() - startedAt);
}

function getRequestId(request: Request) {
  return request.headers.get("x-request-id") ?? crypto.randomUUID();
}

function getRequestPath(request: Request) {
  return new URL(request.url).pathname;
}

function captureError(logger: OperationLog, error: unknown) {
  if (error instanceof Error) {
    logger.error(error);
    return;
  }

  logger.error(String(error));
}

export async function observeServerOperation<T>(
  context: OperationContext,
  handler: (logger: OperationLog) => Promise<T>,
) {
  const { createLogger } = await loadEvlog();
  const logger = createLogger(context);
  const startedAt = performance.now();

  try {
    const result = await handler(logger);

    logger.set({
      outcome: "success",
      durationMs: getDurationMs(startedAt),
    });

    return result;
  } catch (error) {
    captureError(logger, error);
    logger.set({
      outcome: "error",
      durationMs: getDurationMs(startedAt),
    });

    throw error;
  } finally {
    logger.emit();
  }
}

export async function observeServerRoute(
  operation: string,
  request: Request,
  handler: (logger: OperationLog) => Promise<Response>,
) {
  const { createRequestLogger } = await loadEvlog();
  const logger = createRequestLogger({
    method: request.method,
    path: getRequestPath(request),
    requestId: getRequestId(request),
  });
  const startedAt = performance.now();

  logger.set({
    operation,
    kind: "server_route",
  });

  try {
    const response = await handler(logger);

    logger.set({
      status: response.status,
      outcome: response.ok ? "success" : "error",
      durationMs: getDurationMs(startedAt),
    });

    return response;
  } catch (error) {
    captureError(logger, error);
    logger.set({
      outcome: "error",
      durationMs: getDurationMs(startedAt),
    });

    throw error;
  } finally {
    logger.emit();
  }
}

export async function observeRequest(
  request: Request,
  handler: (logger: OperationLog) => Promise<Response>,
) {
  const { createRequestLogger } = await loadEvlog();
  const logger = createRequestLogger({
    method: request.method,
    path: getRequestPath(request),
    requestId: getRequestId(request),
  });
  const startedAt = performance.now();

  logger.set({ kind: "request" });

  try {
    const response = await handler(logger);

    logger.set({
      status: response.status,
      outcome: response.ok ? "success" : "error",
      durationMs: getDurationMs(startedAt),
    });

    return response;
  } catch (error) {
    captureError(logger, error);
    logger.set({ outcome: "error", durationMs: getDurationMs(startedAt) });

    throw error;
  } finally {
    logger.emit();
  }
}
