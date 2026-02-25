import { listMembersWithStats } from '../../utils/auraRepository'

export default eventHandler(async () => {
  return await listMembersWithStats()
})
