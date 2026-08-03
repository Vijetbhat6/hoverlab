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
  return key
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
          'Email and password sign-in is not enabled for this Firebase project.',
        status: 503,
      }
    default:
      return {
        message: 'Sign in could not be completed. Please try again.',
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
  path: 'signUp' | 'signInWithPassword' | 'sendOobCode' | 'update',
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
