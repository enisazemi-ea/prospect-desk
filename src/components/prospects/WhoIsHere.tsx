import { useAuth, usePresenceRoom } from 'deepspace'

/**
 * The other people looking at this board right now.
 *
 * Two people working the same prospect list is the normal case, and the
 * expensive mistake is both of them reviewing and emailing the same site. The
 * row is small on purpose: it answers "am I alone in here" and nothing more.
 *
 * `peers` can be empty on the first render even when somebody else is
 * present, so this renders nothing rather than claiming the board is empty.
 *
 * It also drops the reader's own sessions. One person with the board open in
 * two tabs is a peer by the room's reckoning and not by any useful one, and
 * being told that you are on this board is worse than being told nothing.
 */
export function WhoIsHere({ campaignId }: { campaignId: string }) {
  const { userId } = useAuth()
  const { peers } = usePresenceRoom(`campaign:${campaignId}`)

  const names = [
    ...new Set(
      peers
        .filter((peer) => peer.userId !== userId)
        .map((peer) => peer.userName)
        .filter(Boolean),
    ),
  ]

  if (names.length === 0) return null

  return (
    <p className="text-sm text-muted-foreground">
      {names.length === 1
        ? `${names[0]} is on this board`
        : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]} are on this board`}
    </p>
  )
}
