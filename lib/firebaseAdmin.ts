import 'server-only'
import { cert, getApps, initializeApp, type App, type ServiceAccount } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'

/** Named Enterprise database. `(default)` is not valid for Enterprise edition. */
export const VAULT_FIRESTORE_DATABASE_ID =
  process.env.FIREBASE_FIRESTORE_DATABASE_ID?.trim() || 'vault'

function privateKey(value: string): string {
  return value.replace(/\\n/g, '\n')
}

function serviceAccountFromEnv(): ServiceAccount {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()
  if (raw) {
    const parsed = JSON.parse(raw) as {
      project_id?: string
      client_email?: string
      private_key?: string
    }
    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
      throw new Error(
        'FIREBASE_SERVICE_ACCOUNT_JSON is missing project_id, client_email, or private_key',
      )
    }
    return {
      projectId: parsed.project_id,
      clientEmail: parsed.client_email,
      privateKey: privateKey(parsed.private_key),
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID?.trim()
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim()
  const key = process.env.FIREBASE_PRIVATE_KEY
  if (!projectId || !clientEmail || !key) {
    throw new Error(
      'Firebase Admin is not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.',
    )
  }
  return {
    projectId,
    clientEmail,
    privateKey: privateKey(key),
  }
}

function adminApp(): App {
  const existing = getApps()[0]
  if (existing) return existing
  const account = serviceAccountFromEnv()
  return initializeApp({
    credential: cert(account),
    projectId: account.projectId,
  })
}

export function getVaultFirestore(): Firestore {
  const app = adminApp()
  const databaseId = VAULT_FIRESTORE_DATABASE_ID
  if (databaseId === '(default)') return getFirestore(app)
  return getFirestore(app, databaseId)
}
