import { useEffect, useRef, useState } from 'react'
import { Camera, ChevronDown, Maximize2, Pause, PictureInPicture, Play, Volume2, VolumeX, X } from 'lucide-react'

const playbackRates = [0.5, 1, 1.25, 1.5, 2]

export default function CameraFeedModal({ camera, cameras = [], isOpen, onClose, onSelectCamera }) {
  const playerRef = useRef(null)
  const videoRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [volume, setVolume] = useState(1)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [canUsePictureInPicture, setCanUsePictureInPicture] = useState(false)

  useEffect(() => {
    if (!isOpen) return undefined
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen || !videoRef.current) return undefined
    const video = videoRef.current
    setProgress(0)
    setDuration(0)
    setLoadError(!camera?.videoUrl)
    setIsLoading(Boolean(camera?.videoUrl))
    setIsPlaying(false)
    setCanUsePictureInPicture(Boolean(document.pictureInPictureEnabled && video.requestPictureInPicture))
    video.muted = isMuted
    if (camera?.videoUrl) {
      const playPromise = video.play()
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true)
            setIsLoading(false)
          })
          .catch(() => {
            setIsPlaying(false)
          })
      }
    }
    return () => video.pause()
  }, [camera?.id, camera?.videoUrl, isOpen, isMuted])

  if (!isOpen || !camera) return null

  function togglePlayback() {
    const video = videoRef.current
    if (!video || loadError) return
    if (video.paused) video.play().then(() => setIsPlaying(true)).catch(() => undefined)
    else {
      video.pause()
      setIsPlaying(false)
    }
  }

  function toggleMute() {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setIsMuted(video.muted)
  }

  function updateVolume(event) {
    const nextVolume = Number(event.target.value)
    const video = videoRef.current
    if (!video) return
    video.volume = nextVolume
    video.muted = nextVolume === 0
    setVolume(nextVolume)
    setIsMuted(video.muted)
  }

  function seek(event) {
    const video = videoRef.current
    if (!video || !duration) return
    video.currentTime = Number(event.target.value)
    setProgress(video.currentTime)
  }

  function changeSpeed(event) {
    const nextRate = Number(event.target.value)
    if (videoRef.current) videoRef.current.playbackRate = nextRate
    setPlaybackRate(nextRate)
  }

  async function togglePictureInPicture() {
    const video = videoRef.current
    if (!video || !canUsePictureInPicture) return
    if (document.pictureInPictureElement) await document.exitPictureInPicture()
    else await video.requestPictureInPicture()
  }

  async function toggleFullscreen() {
    if (!playerRef.current) return
    if (document.fullscreenElement) await document.exitFullscreen()
    else await playerRef.current.requestFullscreen()
  }

  function handleVideoError() {
    setIsLoading(false)
    setLoadError(true)
    setIsPlaying(false)
  }

  function handleCameraChange(event) {
    const nextCamera = cameras.find((item) => item.id === event.target.value)
    if (nextCamera) onSelectCamera?.(nextCamera)
  }

  return (
    <div className="camera-feed-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose?.()}>
      <section aria-label="Camera feed player" className="camera-feed-modal" onMouseDown={(event) => event.stopPropagation()} ref={playerRef}>
        <header className="camera-feed-header">
          <div className="camera-feed-heading">
            <div className="camera-feed-icon"><Camera size={16} /></div>
            <div><p className="section-kicker">SIMULATED LIVE FEED</p><h2>{camera.name}</h2><span>{camera.location || 'NH-44 Corridor'}</span></div>
          </div>
          <div className="camera-feed-header-actions">
            <label className="camera-feed-select">Camera <ChevronDown size={13} /><select aria-label="Select camera" onChange={handleCameraChange} value={camera.id}>{cameras.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <span className="camera-live-indicator"><i /> LIVE</span>
            <button aria-label="Close camera feed" className="camera-feed-close" onClick={onClose} type="button"><X size={18} /></button>
          </div>
        </header>

        <div className="camera-feed-stage">
          <video
            autoPlay
            controls={false}
            crossOrigin="anonymous"
            defaultMuted
            key={camera.id}
            loop
            muted={isMuted}
            onCanPlay={() => setIsLoading(false)}
            onDurationChange={(event) => setDuration(event.currentTarget.duration || 0)}
            onError={handleVideoError}
            onLoadedData={() => setIsLoading(false)}
            onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
            onPlay={() => setIsPlaying(true)}
            onTimeUpdate={(event) => setProgress(event.currentTarget.currentTime)}
            playsInline
            ref={videoRef}
            src={camera.videoUrl}
          />
          {isLoading && !loadError && <div className="camera-feed-message"><span className="camera-loading-spinner" />Loading camera feed...</div>}
          {loadError && <div className="camera-feed-message camera-feed-error"><Camera size={25} /><strong>Unable to load camera feed</strong><span>Please check the camera stream.</span></div>}
          <span className="camera-feed-overlay-live"><i /> LIVE</span>
        </div>

        <div className="camera-feed-details"><span><strong>Camera ID</strong>{camera.id}</span><span><strong>Location</strong>{camera.location || 'NH-44 Corridor'}</span><span><strong>Status</strong><b>{camera.status || 'ACTIVE'}</b></span><span><strong>Records captured</strong>{Number(camera.value || 0).toLocaleString()}</span></div>

        <div className="camera-feed-controls">
          <button aria-label={isPlaying ? 'Pause video' : 'Play video'} className="camera-feed-control-button" disabled={loadError} onClick={togglePlayback} type="button">{isPlaying ? <Pause size={16} /> : <Play size={16} />}</button>
          <button aria-label={isMuted ? 'Unmute video' : 'Mute video'} className="camera-feed-control-button" disabled={loadError} onClick={toggleMute} type="button">{isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}</button>
          <input aria-label="Volume" className="camera-volume" max="1" min="0" onChange={updateVolume} step="0.05" type="range" value={isMuted ? 0 : volume} />
          <input aria-label="Video progress" className="camera-progress" max={duration || 0} min="0" onChange={seek} step="0.1" type="range" value={Math.min(progress, duration || 0)} />
          <select aria-label="Playback speed" className="camera-speed" onChange={changeSpeed} value={playbackRate}>{playbackRates.map((rate) => <option key={rate} value={rate}>{rate}x</option>)}</select>
          {canUsePictureInPicture && <button aria-label="Picture in picture" className="camera-feed-control-button" disabled={loadError} onClick={togglePictureInPicture} type="button"><PictureInPicture size={16} /></button>}
          <button aria-label="Fullscreen" className="camera-feed-control-button" disabled={loadError} onClick={toggleFullscreen} type="button"><Maximize2 size={16} /></button>
        </div>
      </section>
    </div>
  )
}
