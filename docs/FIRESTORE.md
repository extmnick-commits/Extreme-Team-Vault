# Firestore for member presence and history

Member heartbeats and playback history live in Cloud Firestore. Admin upload staging still uses Vercel Blob. Media stays on Bunny.

## Database

- Edition: Enterprise, native Firestore access (MongoDB-compatible API off)
- Database id: `vault` (Enterprise cannot use `(default)`)
- Proposed location: `nam5` (US multi-region). Location cannot be changed after creation.
- Collections:
  - `vaultPresence` — one document per member, overwritten about every 45 seconds
  - `vaultMemberHistory` — one document per member, `updatedAt` plus a JSON `body`

Client apps cannot read or write these collections. `firestore.rules` denies every client request. The Next.js server uses the Firebase Admin SDK, which bypasses security rules.

## Server credentials

Set one of these on Vercel for Production and Preview. Do not commit them and do not paste the JSON into chat.

- `FIREBASE_SERVICE_ACCOUNT_JSON` — full service-account JSON, or
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`

Optional: `FIREBASE_FIRESTORE_DATABASE_ID` (defaults to `vault`).

`BLOB_READ_WRITE_TOKEN` stays for admin upload staging.

## Deploy rules and indexes

```bash
copy .firebaserc.example .firebaserc
npx -y firebase-tools@latest use <project-id>
npm run firestore:deploy
```

`npm run firestore:deploy` runs `firebase deploy --only firestore`.
