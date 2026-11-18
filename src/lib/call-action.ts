import { getAuthToken } from 'deepspace'

/**
 * Call one of the server actions in src/actions.
 *
 * Actions are exposed at POST /api/actions/<name> and the worker verifies the
 * caller's token before the handler runs, so the only job here is attaching
 * that token and unwrapping the { success, data, error } envelope into
 * something a component can use with a plain try/catch.
 */
export async function callAction<T>(
  name: string,
  params: Record<string, unknown> = {},
): Promise<T> {
  const token = await getAuthToken()

  const response = await fetch(`/api/actions/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  })

  // A failed action still answers with a body, so read the envelope rather
  // than trusting the status code.
  const envelope = (await response.json()) as {
    success: boolean
    data?: T
    error?: string
  }

  if (!envelope.success) {
    throw new Error(envelope.error ?? 'The server did not say what went wrong.')
  }

  return envelope.data as T
}
