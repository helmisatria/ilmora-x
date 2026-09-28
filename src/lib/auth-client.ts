type AuthFetchResult =
  | {
      ok: true;
      redirectTo?: string;
    }
  | {
      ok: false;
    };

export async function signInWithGoogle(callbackURL: string): Promise<AuthFetchResult> {
  const response = await fetch("/api/auth/sign-in/social", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      provider: "google",
      callbackURL,
    }),
  });

  if (!response.ok) {
    return { ok: false };
  }

  const data = await response.json().catch(() => null);

  if (data?.url) {
    return {
      ok: true,
      redirectTo: data.url,
    };
  }

  return { ok: true };
}

export async function signInWithEmail(email: string, password: string): Promise<AuthFetchResult> {
  const response = await fetch("/api/auth/sign-in/email", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  return { ok: response.ok };
}

export async function signUpWithEmail(name: string, email: string, password: string): Promise<AuthFetchResult> {
  const response = await fetch("/api/auth/sign-up/email", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  return { ok: response.ok };
}

export async function signOut(): Promise<AuthFetchResult> {
  const response = await fetch("/api/auth/sign-out", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({}),
  });

  return {
    ok: response.ok,
  };
}
