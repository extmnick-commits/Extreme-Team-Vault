'use server'

import { redirect } from 'next/navigation'
import { createSession, deleteSession } from '@/app/lib/session'

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

  if (password !== teamPassword) {
    return { error: 'Incorrect password. Please try again.' }
  }

  await createSession()
  redirect('/portal')
}

export async function logout(): Promise<void> {
  await deleteSession()
  redirect('/')
}
