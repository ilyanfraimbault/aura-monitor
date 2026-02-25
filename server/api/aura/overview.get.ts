import { subDays } from 'date-fns'
import { z } from 'zod'
import { getAuraOverview } from '../../utils/auraRepository'
import { parseQueryWithSchema } from '../../utils/validation'

const querySchema = z.object({
  start: z.string().datetime().optional(),
  end: z.string().datetime().optional()
})

export default eventHandler(async (event) => {
  const query = parseQueryWithSchema(event, querySchema)
  const end = query.end ? new Date(query.end) : new Date()
  const start = query.start ? new Date(query.start) : subDays(end, 14)

  if (start > end) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Start date must be before end date.'
    })
  }

  return await getAuraOverview(start, end)
})
