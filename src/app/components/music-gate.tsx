import React from 'react'

const TRACK_SRC = '/music.mp3'

export function MusicGate() {
  const [entered, setEntered] = React.useState(false)
  const [closing, setClosing] = React.useState(false)
  const [muted, setMuted] = React.useState(false)
  const audioRef = React.useRef<HTMLAudioElement>(null)

  React.useEffect(() => {
    document.body.style.overflow = entered ? '' : 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [entered])

  const handleEnter = () => {
    const audio = audioRef.current
    if (audio) {
      audio.volume = 0.55
      audio.play().catch(() => {
        // Browser masih nolak — biarkan, user bisa toggle manual lewat tombol speaker
      })
    }
    setClosing(true)
    setTimeout(() => setEntered(true), 320)
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return
    audio.muted = !audio.muted
    setMuted(audio.muted)
  }

  return (
    <>
      <audio ref={audioRef} src={TRACK_SRC} loop preload="auto" />

      {!entered && (
        <div
          className={`fixed inset-0 z-[9999] flex items-center justify-center px-6 bg-black/70 backdrop-blur-md transition-opacity duration-300 ease-out ${
            closing ? 'opacity-0' : 'opacity-100'
          }`}>
          {/* "window" */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Click to enter"
            onClick={handleEnter}
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleEnter()}
            className={`w-full max-w-[300px] rounded-lg overflow-hidden border border-[#262626] bg-[#101010] shadow-2xl shadow-black/60 cursor-pointer select-none transition-transform duration-150 active:scale-[0.97] ${
              closing ? 'scale-95' : 'scale-100'
            }`}>
            {/* title bar */}
            <div className="h-8 flex items-center justify-between px-3 border-b border-[#1f1f1f] bg-[#161616]">
              <span className="font-mono text-[10px] text-[#666] tracking-[0.08em]">welcome.exe</span>
              <div className="flex items-center gap-[5px]">
                <span className="w-[7px] h-[7px] rounded-full bg-[#333]" />
                <span className="w-[7px] h-[7px] rounded-full bg-[#333]" />
                <span className="w-[7px] h-[7px] rounded-full bg-[#3a2222]" />
              </div>
            </div>

            {/* body */}
            <div className="flex flex-col items-center gap-4 px-8 py-9">
              <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                <span
                  className="absolute inset-0 rounded-full"
                  style={{animation: 'gate-ping 2.4s cubic-bezier(0.2,0.6,0.4,1) infinite'}}
                />
                <div
                  className="relative w-10 h-10 rounded-full flex items-center justify-center text-white text-[16px] font-medium"
                  style={{background: 'linear-gradient(135deg, #4a9eff, #7c6ff7)'}}>
                  ♪
                </div>
              </div>

              <div className="flex flex-col items-center gap-1">
                <span className="font-display text-2xl text-[#f0f0f0] tracking-[-0.01em]">enter</span>
                <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-[#555]">click anywhere · sound on</span>
              </div>
            </div>
          </div>

          <style dangerouslySetInnerHTML={{__html: `
            @keyframes gate-ping {
              0% { box-shadow: 0 0 0 0 rgba(74,158,255,0.4); opacity: 1; }
              100% { box-shadow: 0 0 0 16px rgba(74,158,255,0); opacity: 0; }
            }
          `}} />
        </div>
      )}

      {entered && (
        <button
          onClick={toggleMute}
          aria-label={muted ? 'Unmute music' : 'Mute music'}
          className="fixed bottom-4 right-4 z-[100] w-9 h-9 rounded-md flex items-center justify-center text-[14px] bg-[#141414] border border-[#262626] hover:border-[#4a9eff] transition-colors">
          {muted ? '🔇' : '🔊'}
        </button>
      )}
    </>
  )
}
