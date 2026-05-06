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

export async function signOut(): Promise<AuthFetchResult> {
  const response = await fetch("/api/auth/sign-out", {
    method: "POST",
  });

  return {
    ok: response.ok,
  };
}
