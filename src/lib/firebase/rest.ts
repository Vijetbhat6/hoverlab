import 'server-only'

/**
 * Firebase Auth over its REST API, called from the server.
 *
 * Why not the client SDK, which is the documented path:
 *
 * The SDK runs in the browser and talks directly to
 * identitytoolkit.googleapis.com. That puts a third-party domain on the
 * critical path of signing in, and anything that blocks it — an ad blocker,
 * a privacy extension, corporate DNS filtering, a firewall — breaks sign-up
 * and sign-in with `auth/network-request-failed` before the app is involved
 * at all. It is invisible in testing, because a clean automated browser has
 * no extensions, and it is unfixable from the app's side.
 *
 * Calling the same API from the server removes the failure mode entirely:
 * the browser only ever talks to this origin, and this origin talks to
 * Google. It also keeps the Firebase SDK out of the client bundle.
 *
 * The password reaches our server, which the client SDK avoided. That is the
 * same shape as the bcrypt implementation this replaced, over HTTPS, and the
 * server immediately forwards it to Google without storing it.
 */

/**
 * The Web API key. Public by design — it identifies the project and is
 * useless without credentials — so falling back to the NEXT_PUBLIC_ copy is
 * safe, and means one variable instead of two in every environment.
 */
function apiKey(): string {
  const key =
    process.env.FIREBASE_API_KEY ?? process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  if (!key) {
    throw new Error(
      'FIREBASE_API_KEY is not set — the server cannot reach Firebase Auth.',
    )
  }
  // Trimmed because environment variables collect trailing whitespace with
  // depressing ease — a newline picked up while being piped into a hosting
  // provider's CLI travels into the query string and Google answers "API key
  // not valid", which looks nothing like the cause.
  return key.trim()
}

const ENDPOINT = 'https://identitytoolkit.googleapis.com/v1/accounts'

export interface AuthFailure {
  /** Safe to show a person verbatim. */
  message: string
  /** HTTP status the route should answer with. */
  status: number
}

export class FirebaseAuthError extends Error {
  readonly status: number
  constructor({ message, status }: AuthFailure) {
    super(message)
    this.name = 'FirebaseAuthError'
    this.status = status
  }
}

/**
 * Firebase's REST errors are SHOUTING_SNAKE_CASE strings, sometimes with a
 * trailing explanation (`WEAK_PASSWORD : Password should be...`). They are
 * not fit to show anyone, so each is mapped deliberately.
 *
 * INVALID_LOGIN_CREDENTIALS covers both "no such account" and "wrong
 * password" — Firebase declines to say which, and neither do we, because the
 * difference is exactly what account enumeration is looking for.
 */
function describe(code: string): AuthFailure {
  const bare = code.split(':')[0]!.trim()
  switch (bare) {
    case 'INVALID_LOGIN_CREDENTIALS':
    case 'INVALID_PASSWORD':
    case 'EMAIL_NOT_FOUND':
      return { message: 'Invalid email or password.', status: 401 }
    case 'EMAIL_EXISTS':
      return { message: 'An account with that email already exists.', status: 409 }
    case 'INVALID_EMAIL':
      return { message: 'That email address does not look right.', status: 400 }
    case 'WEAK_PASSWORD':
      return { message: 'Password must be at least 6 characters long.', status: 400 }
    case 'MISSING_PASSWORD':
      return { message: 'Enter a password.', status: 400 }
    case 'USER_DISABLED':
      return { message: 'That account has been disabled.', status: 403 }
    case 'TOO_MANY_ATTEMPTS_TRY_LATER':
      return {
        message: 'Too many attempts. Wait a few minutes and try again.',
        status: 429,
      }
    case 'OPERATION_NOT_ALLOWED':
    case 'PASSWORD_LOGIN_DISABLED':
      return {
        message:
          'That sign-in method is not enabled for this Firebase project ' +
          '(Authentication → Sign-in method).',
        status: 503,
      }
    case 'INVALID_IDP_RESPONSE':
      // The Google ID token this server forwarded was rejected — expired,
      // meant for a different OAuth client, or otherwise not what Firebase
      // expected. Not a password problem, so it gets its own sentence.
      return {
        message: 'Google sign-in could not be verified. Please try again.',
        status: 401,
      }
    case 'ADMIN_ONLY_OPERATION':
      return {
        message:
          'Creating accounts is disabled for this Firebase project (Authentication ' +
          '→ Settings → User actions).',
        status: 503,
      }
    case 'PASSWORD_DOES_NOT_MEET_REQUIREMENTS':
      return {
        message: 'That password does not meet the project’s password policy.',
        status: 400,
      }
    case 'INVALID_CUSTOM_TOKEN':
    case 'CREDENTIAL_MISMATCH':
      // Only reachable from passkey sign-in, and never because of anything
      // the person did: the server signed a token Firebase rejected, which
      // means the service account and the API key belong to different
      // projects — the one misconfiguration that looks exactly like a
      // working setup until someone tries to sign in.
      return {
        message:
          'The server could not complete sign-in. Its Firebase service account ' +
          'and API key do not appear to be from the same project — check ' +
          '/api/health/auth.',
        status: 503,
      }
    case 'API key not valid. Please pass a valid API key.':
    case 'INVALID_API_KEY':
    case 'API_KEY_INVALID':
      return {
        message:
          'The server’s Firebase API key was rejected. This is a configuration ' +
          'problem, not your password — check /api/health/auth.',
        status: 503,
      }
    default:
      // Logged and echoed, because an unrecognised code used to vanish here:
      // the user saw a generic sentence, the logs said nothing, and the one
      // piece of information that would have explained the failure — the code
      // Google actually returned — was discarded. The code is Google's own
      // identifier, not user data, so it is safe to show.
      console.error(`[firebase-auth] unmapped error code: ${code || '(empty)'}`)
      return {
        message: `Sign-in could not be completed (${bare || 'unknown error'}).`,
        status: 502,
      }
  }
}

export interface AuthResult {
  idToken: string
  localId: string
  email: string
}

async function call(
  path:
    | 'signUp'
    | 'signInWithPassword'
    | 'signInWithCustomToken'
    | 'signInWithIdp'
    | 'sendOobCode'
    | 'update',
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  let res: Response
  try {
    res = await fetch(`${ENDPOINT}:${path}?key=${apiKey()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    })
  } catch {
    // The server could not reach Google. Distinct from bad credentials, and
    // worth saying so rather than blaming the password.
    throw new FirebaseAuthError({
      message:
        'Could not reach the authentication service. Please try again in a moment.',
      status: 503,
    })
  }

  const data = (await res.json().catch(() => ({}))) as {
    error?: { message?: string }
  } & Record<string, unknown>

  if (!res.ok) {
    throw new FirebaseAuthError(describe(data.error?.message ?? ''))
  }
  return data
}

export async function signUpWithPassword(
  email: string,
  password: string,
): Promise<AuthResult> {
  const data = await call('signUp', { email, password, returnSecureToken: true })
  return {
    idToken: String(data.idToken ?? ''),
    localId: String(data.localId ?? ''),
    email: String(data.email ?? email),
  }
}

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<AuthResult> {
  const data = await call('signInWithPassword', {
    email,
    password,
    returnSecureToken: true,
  })
  return {
    idToken: String(data.idToken ?? ''),
    localId: String(data.localId ?? ''),
    email: String(data.email ?? email),
  }
}

/**
 * Exchange an Admin-SDK custom token for an ID token.
 *
 * The detour exists because `createSessionCookie` accepts only an ID token,
 * and an ID token is only ever minted by Google. Passkey sign-in verifies
 * the assertion itself — Firebase has no idea what WebAuthn is — so the
 * server vouches for the account with a custom token it signs with the
 * service account key, trades it here for the real thing, and mints the
 * session cookie from that. The round trip is what keeps every session in
 * this app the same kind of cookie regardless of how it was earned.
 */
export async function signInWithCustomToken(token: string): Promise<AuthResult> {
  const data = await call('signInWithCustomToken', {
    token,
    returnSecureToken: true,
  })
  return {
    idToken: String(data.idToken ?? ''),
    localId: String(data.localId ?? ''),
    email: '',
  }
}

/**
 * Exchange a Google ID token for a Firebase account.
 *
 * The token is minted by Google Identity Services running in the browser —
 * OAuth consent has no server-side substitute, so that one hop to
 * accounts.google.com is unavoidable. Firebase is not part of that hop: the
 * credential lands here, on the server, and this is the code that calls
 * identitytoolkit.googleapis.com with it, same as every other sign-in in
 * this file. `requestUri` does not need to be reachable — Firebase only uses
 * it to decide which project's redirect-domain allowlist applies — so the
 * canonical site URL is enough.
 *
 * A first-time Google sign-in creates the Firebase user as a side effect;
 * the caller still runs `ensureUserProfile` afterwards, same as sign-up.
 */
export async function signInWithGoogleIdToken(
  googleIdToken: string,
  requestUri: string,
): Promise<AuthResult> {
  const data = await call('signInWithIdp', {
    postBody: `id_token=${encodeURIComponent(googleIdToken)}&providerId=google.com`,
    requestUri,
    returnSecureToken: true,
  })
  return {
    idToken: String(data.idToken ?? ''),
    localId: String(data.localId ?? ''),
    email: String(data.email ?? ''),
  }
}

/** Set the display name on a freshly created account. */
export async function setDisplayName(
  idToken: string,
  displayName: string,
): Promise<void> {
  await call('update', { idToken, displayName, returnSecureToken: false })
}

/**
 * Ask Firebase to send its own password reset email.
 *
 * Google owns the message, the link and its expiry — the reason this app has
 * no reset tokens, no mail provider and no reset page of its own.
 */
export async function sendPasswordResetEmail(email: string): Promise<void> {
  await call('sendOobCode', { requestType: 'PASSWORD_RESET', email })
}
