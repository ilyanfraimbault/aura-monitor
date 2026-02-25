import { z } from 'zod'
import { createMember } from '../../utils/auraRepository'
import { parseBodyWithSchema } from '../../utils/validation'

const createMemberSchema = z.object({
  name: z.string().trim().min(2, 'Member name must have at least 2 characters.').max(60, 'Member name is too long.'),
  startingAura: z.coerce.number().int().min(-1000, 'Starting aura is too low.').max(1000, 'Starting aura is too high.').default(100)
})

export default eventHandler(async (event) => {
  const body = await parseBodyWithSchema(event, createMemberSchema)
  return await createMember(body)
})
