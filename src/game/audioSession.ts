/**
 * Sound effects through the Ring/Silent switch on iPhone.
 *
 * iOS treats Web Audio as "ambient" sound by default, which the Ring/Silent switch mutes,
 * while <audio> and <video> elements play as media. That is why the owner heard the film
 * and Roboptimus's greeting but no fight sounds in the arcade (2026-11-11: "the sound in
 * the fighting arcade is not working"): the arcade and the game's effects use Web Audio.
 * WebKit's Audio Session API lets a page ask to be treated as media playback, so its Web
 * Audio plays like a video does. Other browsers do not have the API and are unaffected.
 */
interface AudioSessionNavigator {
  audioSession?: { type: string }
}

/** Ask for the media-playback audio session. Safe to call before any sound and more than once. */
export function preferPlaybackAudioSession(nav: object = navigator): boolean {
  const session = (nav as AudioSessionNavigator).audioSession
  if (!session) return false
  try {
    if (session.type !== 'playback') session.type = 'playback'
    return session.type === 'playback'
  } catch {
    return false
  }
}
