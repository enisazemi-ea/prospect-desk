import { usePresenceRoom } from 'deepspace'

/**
 * The other people looking at this board right now.
 *
 * Two people working the same prospect list is the normal case, and the
 * expensive mistake is both of them reviewing and emailing the same site. The
 * row is small on purpose: it answers "am I alone in here" and nothing more.
 *
 * `peers` excludes the current user and can be empty on the first render even
 * when somebody else is present, so this renders nothing rather than claiming
 * the board is empty.
 */
export function WhoIsHere({ campaignId }: { campaignId: string }) {
  const { peers } = usePresenceRoom(`campaign:${campaignId}`)

  if (peers.length === 0) return null

  const names = peers.map((peer) => peer.userName).filter(Boolean)

  return (
    <p className="text-sm text-muted-foreground">
      {names.length === 1
        ? `${names[0]} is on this board`
        : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]} are on this board`}
    </p>
  )
}
