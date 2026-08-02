'use client'

/**
 * Firebase client SDK — browser side.
 *
 * These values are public by design: they identify the project, they do not
 * grant access to it. Access is controlled by Firebase Auth and Firestore
 * security rules, which is why they ship as NEXT_PUBLIC_* variables. The
 * service account key (see admin.ts) is the secret, and it never comes near
 * this file.
 *
 * Initialised lazily so that importing this module during a build — where no
 * configuration is present and no browser exists — cannot throw.
 */

import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

export function isFirebaseConfigured(): boolean {
  return Boolean(config.apiKey && config.authDomain && config.projectId)
}

function firebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    throw new Error(
      'Firebase is not configured in this environment. Set the ' +
        'NEXT_PUBLIC_FIREBASE_* variables — see .env.example.',
    )
  }
  return getApps().length ? getApp() : initializeApp(config)
}

export function firebaseAuth(): Auth {
  return getAuth(firebaseApp())
}
