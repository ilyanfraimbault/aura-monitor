import { z } from 'zod'
import { updateMember } from '../../utils/auraRepository'
import { parseBodyWithSchema } from '../../utils/validation'

const updateMemberSchema = z.object({
  name: z.string().trim().min(2, 'Member name must have at least 2 characters.').max(60, 'Member name is too long.').optional(),
  startingAura: z.coerce.number().int().min(-1000, 'Starting aura is too low.').max(1000, 'Starting aura is too high.').optional()
}).refine(value => value.name !== undefined || value.startingAura !== undefined, {
  message: 'At least one field must be provided.'
})

export default eventHandler(async (event) => {
  const memberId = getRouterParam(event, 'id')

  if (!memberId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Member id is required.'
    })
  }

  const body = await parseBodyWithSchema(event, updateMemberSchema)
  return await updateMember(memberId, body)
})
