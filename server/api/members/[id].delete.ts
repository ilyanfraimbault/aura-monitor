import { deleteMember } from '../../utils/auraRepository'

export default eventHandler(async (event) => {
  const memberId = getRouterParam(event, 'id')

  if (!memberId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Member id is required.'
    })
  }

  await deleteMember(memberId)

  return {
    success: true
  }
})
