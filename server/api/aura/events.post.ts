import { z } from 'zod'
import { createAuraEvent } from '../../utils/auraRepository'
import { parseBodyWithSchema } from '../../utils/validation'

const createAuraEventSchema = z.object({
  memberId: z.string().uuid('Invalid member identifier.'),
  delta: z.coerce.number().int().min(-1000, 'Delta is too low.').max(1000, 'Delta is too high.').refine(value => value !== 0, {
    message: 'Delta cannot be 0.'
  }),
  reason: z.string().trim().min(3, 'Reason must have at least 3 characters.').max(280, 'Reason is too long.'),
  occurredAt: z.string().datetime().optional()
})

export default eventHandler(async (event) => {
  const body = await parseBodyWithSchema(event, createAuraEventSchema)
  return await createAuraEvent(body)
})
