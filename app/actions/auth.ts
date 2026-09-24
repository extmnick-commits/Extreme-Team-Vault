'use server'

import { timingSafeEqual } from 'node:crypto'
import { redirect } from 'next/navigation'
import {
  createSession,
  deleteSession,
  type SessionRole,
} from '@/app/lib/session'

export type LoginState =
  | { error: string }
  | { success: true }
  | undefined

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const password = formData.get('password')

  if (typeof password !== 'string' || password.trim() === '') {
    return { error: 'Password is required.' }
  }

  const teamPassword = process.env.TEAM_PASSWORD
  if (!teamPassword) {
    console.error('TEAM_PASSWORD environment variable is not set')
    return { error: 'Server configuration error. Please contact an admin.' }
  }

  const adminPassword = process.env.ADMIN_PASSWORD
  let role: SessionRole
  if (adminPassword && safeEqual(password, adminPassword)) {
    role = 'admin'
  } else if (safeEqual(password, teamPassword)) {
    role = 'member'
  } else {
    return { error: 'Incorrect password. Please try again.' }
  }

  await createSession(role)
  redirect('/portal')
}

function safeEqual(input: string, expected: string): boolean {
  const a = Buffer.from(input)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function logout(): Promise<void> {
  await deleteSession()
  redirect('/')
}
