import { addDays, eachDayOfInterval, format, startOfDay } from 'date-fns'
import { useSupabaseAdmin } from './supabase'

type MemberRow = {
  id: string
  name: string
  starting_aura: number
  created_at: string
  updated_at: string
}

type MemberScoreRow = MemberRow & {
  current_aura: number
  delta_total: number
}

type EventRow = {
  id: string
  member_id: string
  delta: number
  reason: string
  occurred_at: string
  created_at: string
}

type EventWithMemberRow = EventRow & {
  aura_members: {
    name: string
  } | null
}

function getSupabase() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return useSupabaseAdmin() as any
}

export type AuraMemberStats = {
  id: string
  name: string
  startingAura: number
  currentAura: number
  deltaTotal: number
  deltaToday: number
  createdAt: string
  updatedAt: string
}

export type AuraEventItem = {
  id: string
  memberId: string
  memberName: string
  delta: number
  reason: string
  occurredAt: string
  createdAt: string
}

export type AuraTimelinePoint = {
  date: string
  values: Record<string, number>
  teamTotal: number
}

function throwSupabaseError(error: { message: string } | null, action: string): never | void {
  if (!error) {
    return
  }

  throw createError({
    statusCode: 500,
    statusMessage: `Supabase error during "${action}": ${error.message}`
  })
}

function toMemberStats(row: MemberScoreRow, deltaToday = 0): AuraMemberStats {
  return {
    id: row.id,
    name: row.name,
    startingAura: row.starting_aura,
    currentAura: row.current_aura,
    deltaTotal: row.delta_total,
    deltaToday,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

function toAuraEvent(row: EventWithMemberRow): AuraEventItem {
  return {
    id: row.id,
    memberId: row.member_id,
    memberName: row.aura_members?.name ?? 'Unknown member',
    delta: row.delta,
    reason: row.reason,
    occurredAt: row.occurred_at,
    createdAt: row.created_at
  }
}

async function getTodayDeltas(memberIds: string[]) {
  if (!memberIds.length) {
    return new Map<string, number>()
  }

  const supabase = getSupabase()
  const dayStart = startOfDay(new Date())
  const dayEnd = addDays(dayStart, 1)

  const { data, error } = await supabase
    .from('aura_events')
    .select('member_id, delta')
    .in('member_id', memberIds)
    .gte('occurred_at', dayStart.toISOString())
    .lt('occurred_at', dayEnd.toISOString())

  throwSupabaseError(error, 'getTodayDeltas')

  const deltas = new Map<string, number>()
  for (const event of data ?? []) {
    const delta = Number(event.delta) || 0
    const previous = deltas.get(event.member_id) ?? 0
    deltas.set(event.member_id, previous + delta)
  }

  return deltas
}

export async function listMembersWithStats(): Promise<AuraMemberStats[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('aura_member_scores')
    .select('*')
    .order('current_aura', { ascending: false })

  throwSupabaseError(error, 'listMembersWithStats')

  const rows = (data ?? []) as MemberScoreRow[]
  const todayDeltas = await getTodayDeltas(rows.map(member => member.id))

  return rows.map(member => toMemberStats(member, todayDeltas.get(member.id) ?? 0))
}

export async function createMember(input: { name: string, startingAura: number }): Promise<AuraMemberStats> {
  const supabase = getSupabase()

  const { error } = await supabase
    .from('aura_members')
    .insert({
      name: input.name,
      starting_aura: input.startingAura
    })

  if (error?.code === '23505') {
    throw createError({
      statusCode: 409,
      statusMessage: 'A member with this name already exists.'
    })
  }

  throwSupabaseError(error, 'createMember')

  const members = await listMembersWithStats()
  const createdMember = members.find(member => member.name.toLowerCase() === input.name.toLowerCase())

  if (!createdMember) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Member was created but could not be loaded.'
    })
  }

  return createdMember
}

export async function updateMember(
  id: string,
  input: { name?: string, startingAura?: number }
): Promise<AuraMemberStats> {
  const supabase = getSupabase()

  const updates: Record<string, unknown> = {}
  if (input.name !== undefined) {
    updates.name = input.name
  }

  if (input.startingAura !== undefined) {
    updates.starting_aura = input.startingAura
  }

  const { error } = await supabase
    .from('aura_members')
    .update(updates)
    .eq('id', id)

  if (error?.code === '23505') {
    throw createError({
      statusCode: 409,
      statusMessage: 'A member with this name already exists.'
    })
  }

  throwSupabaseError(error, 'updateMember')

  const members = await listMembersWithStats()
  const updatedMember = members.find(member => member.id === id)

  if (!updatedMember) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Member not found.'
    })
  }

  return updatedMember
}

export async function deleteMember(id: string) {
  const supabase = getSupabase()
  const { error } = await supabase
    .from('aura_members')
    .delete()
    .eq('id', id)

  throwSupabaseError(error, 'deleteMember')
}

export async function createAuraEvent(input: {
  memberId: string
  delta: number
  reason: string
  occurredAt?: string
}): Promise<AuraEventItem> {
  const supabase = getSupabase()

  const { error } = await supabase
    .from('aura_events')
    .insert({
      member_id: input.memberId,
      delta: input.delta,
      reason: input.reason,
      occurred_at: input.occurredAt ?? new Date().toISOString()
    })

  throwSupabaseError(error, 'createAuraEvent')

  const recentEvents = await listRecentEvents(1)
  const lastEvent = recentEvents[0]

  if (!lastEvent) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Aura event was created but could not be loaded.'
    })
  }

  return lastEvent
}

export async function listRecentEvents(limit = 15): Promise<AuraEventItem[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('aura_events')
    .select(`
      id,
      member_id,
      delta,
      reason,
      occurred_at,
      created_at,
      aura_members (
        name
      )
    `)
    .order('occurred_at', { ascending: false })
    .limit(limit)

  throwSupabaseError(error, 'listRecentEvents')

  return ((data ?? []) as EventWithMemberRow[]).map(toAuraEvent)
}

export async function getAuraOverview(rangeStart?: Date, rangeEnd?: Date) {
  const [members, recentEvents] = await Promise.all([
    listMembersWithStats(),
    listRecentEvents(20)
  ])

  const teamAura = members.reduce((sum, member) => sum + member.currentAura, 0)
  const teamDeltaToday = members.reduce((sum, member) => sum + member.deltaToday, 0)

  let rangeDelta = 0

  if (rangeStart && rangeEnd) {
    const supabase = getSupabase()
    const normalizedStart = startOfDay(rangeStart)
    const normalizedEnd = addDays(startOfDay(rangeEnd), 1)

    const { data, error } = await supabase
      .from('aura_events')
      .select('delta')
      .gte('occurred_at', normalizedStart.toISOString())
      .lt('occurred_at', normalizedEnd.toISOString())

    throwSupabaseError(error, 'getAuraOverview(rangeDelta)')
    rangeDelta = (data ?? []).reduce((sum: number, event: { delta: number }) => sum + (Number(event.delta) || 0), 0)
  }

  return {
    members,
    recentEvents,
    teamAura,
    teamDeltaToday,
    rangeDelta
  }
}

export async function getAuraTimeline(start: Date, end: Date) {
  const supabase = getSupabase()
  const startDay = startOfDay(start)
  const endDay = startOfDay(end)
  const dayAfterEnd = addDays(endDay, 1)

  const { data: membersData, error: membersError } = await supabase
    .from('aura_members')
    .select('id, name, starting_aura, created_at, updated_at')
    .order('name', { ascending: true })

  throwSupabaseError(membersError, 'getAuraTimeline(members)')

  const members = (membersData ?? []) as MemberRow[]

  if (!members.length) {
    return {
      members: [] as Array<{ id: string, name: string }>,
      points: [] as AuraTimelinePoint[]
    }
  }

  const memberIds = members.map(member => member.id)

  const [{ data: previousEvents, error: previousEventsError }, { data: rangeEvents, error: rangeEventsError }] = await Promise.all([
    supabase
      .from('aura_events')
      .select('member_id, delta, occurred_at')
      .in('member_id', memberIds)
      .lt('occurred_at', startDay.toISOString()),
    supabase
      .from('aura_events')
      .select('member_id, delta, occurred_at')
      .in('member_id', memberIds)
      .gte('occurred_at', startDay.toISOString())
      .lt('occurred_at', dayAfterEnd.toISOString())
  ])

  throwSupabaseError(previousEventsError, 'getAuraTimeline(previousEvents)')
  throwSupabaseError(rangeEventsError, 'getAuraTimeline(rangeEvents)')

  const runningAura = new Map<string, number>(
    members.map(member => [member.id, member.starting_aura])
  )

  for (const event of previousEvents ?? []) {
    const delta = Number(event.delta) || 0
    const previousValue = runningAura.get(event.member_id) ?? 0
    runningAura.set(event.member_id, previousValue + delta)
  }

  const deltaByDay = new Map<string, Map<string, number>>()

  for (const event of rangeEvents ?? []) {
    const dayKey = format(new Date(event.occurred_at), 'yyyy-MM-dd')
    if (!deltaByDay.has(dayKey)) {
      deltaByDay.set(dayKey, new Map())
    }

    const memberDeltas = deltaByDay.get(dayKey)!
    const delta = Number(event.delta) || 0
    const previousValue = memberDeltas.get(event.member_id) ?? 0
    memberDeltas.set(event.member_id, previousValue + delta)
  }

  const points: AuraTimelinePoint[] = []
  for (const date of eachDayOfInterval({ start: startDay, end: endDay })) {
    const dayKey = format(date, 'yyyy-MM-dd')
    const dayMemberDeltas = deltaByDay.get(dayKey)

    for (const member of members) {
      const previousValue = runningAura.get(member.id) ?? member.starting_aura
      const memberDelta = dayMemberDeltas?.get(member.id) ?? 0
      runningAura.set(member.id, previousValue + memberDelta)
    }

    const values = Object.fromEntries(
      members.map(member => [member.id, runningAura.get(member.id) ?? member.starting_aura])
    )

    const teamTotal = members.reduce((sum, member) => sum + (values[member.id] ?? member.starting_aura), 0)

    points.push({
      date: dayKey,
      values,
      teamTotal
    })
  }

  return {
    members: members.map(member => ({
      id: member.id,
      name: member.name
    })),
    points
  }
}
