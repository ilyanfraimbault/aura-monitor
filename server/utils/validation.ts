import type { ZodError, ZodTypeAny } from 'zod'

function getFirstIssueMessage(error: ZodError): string {
  return error.issues[0]?.message || 'Invalid request payload.'
}

export async function parseBodyWithSchema<TSchema extends ZodTypeAny>(
  event: Parameters<typeof readBody>[0],
  schema: TSchema
): Promise<TSchema['_output']> {
  const body = await readBody(event)
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: getFirstIssueMessage(parsed.error)
    })
  }

  return parsed.data
}

export function parseQueryWithSchema<TSchema extends ZodTypeAny>(
  event: Parameters<typeof getQuery>[0],
  schema: TSchema
): TSchema['_output'] {
  const query = getQuery(event)
  const normalized = Object.fromEntries(
    Object.entries(query).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])
  )
  const parsed = schema.safeParse(normalized)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: getFirstIssueMessage(parsed.error)
    })
  }

  return parsed.data
}
