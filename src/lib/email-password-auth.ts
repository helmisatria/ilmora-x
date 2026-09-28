export function isEmailPasswordAuthEnabled(env: NodeJS.ProcessEnv = process.env) {
  if (env.RAILWAY_ENVIRONMENT_NAME) {
    return env.RAILWAY_ENVIRONMENT_NAME === "staging";
  }

  return env.NODE_ENV === "development";
}
