'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Music2,
  Volume2,
  VolumeX,
  Search,
  Plus,
  Home,
  Compass,
  User,
  X,
  Send,
  Link2,
  MessageSquareText,
  MoreHorizontal,
} from 'lucide-react'

interface CommentEntry {
  id: string
  user: string
  text: string
  likes: number
  time: string
}

interface FeedPost {
  id: string
  user: string
  avatarColor: string
  caption: string
  song: string
  videoUrl: string
  likes: number
  shares: number
  liked: boolean
  following: boolean
  bookmarked: boolean
  comments: CommentEntry[]
}

const INITIAL_POSTS: FeedPost[] = [
  {
    id: 'p1',
    user: 'marco.codes',
    avatarColor: '#f43f5e',
    caption: 'Quando il deploy passa al primo colpo 😮‍💨 #dev #fyp',
    song: 'suono originale - marco.codes',
    videoUrl: 'https://download.samplelib.com/mp4/sample-10s.mp4',
    likes: 128400,
    shares: 2310,
    liked: false,
    following: false,
    bookmarked: false,
    comments: [
      { id: 'c1', user: 'giulia.dev', text: 'la faccia dice tutto 😂', likes: 812, time: '2h' },
      { id: 'c2', user: 'lorenzo_t', text: 'noi tutti dopo un merge senza conflitti', likes: 340, time: '1h' },
    ],
  },
  {
    id: 'p2',
    user: 'chiara.travel',
    avatarColor: '#22d3ee',
    caption: 'Alba pazzesca stamattina 🌅 dove la fareste voi? #viaggi',
    song: 'suono originale - chiara.travel',
    videoUrl: 'https://download.samplelib.com/mp4/sample-15s.mp4',
    likes: 84200,
    shares: 1590,
    liked: false,
    following: true,
    bookmarked: false,
    comments: [
      { id: 'c1', user: 'ale.ph', text: 'posto stupendo!', likes: 120, time: '5h' },
    ],
  },
  {
    id: 'p3',
    user: 'foodwithlu',
    avatarColor: '#f59e0b',
    caption: 'Ricetta pronta in 5 minuti 🍝 salvatela per dopo!',
    song: 'suono virale - remix cucina',
    videoUrl: 'https://download.samplelib.com/mp4/sample-20s.mp4',
    likes: 342100,
    shares: 9820,
    liked: true,
    following: false,
    bookmarked: true,
    comments: [
      { id: 'c1', user: 'martina.k', text: 'la provo stasera!', likes: 55, time: '30m' },
      { id: 'c2', user: 'davide__r', text: 'manca il parmigiano 😭', likes: 210, time: '20m' },
      { id: 'c3', user: 'foodwithlu', text: '@davide__r a piacere!', likes: 40, time: '10m' },
    ],
  },
  {
    id: 'p4',
    user: 'studio.beats',
    avatarColor: '#a855f7',
    caption: 'Nuovo beat, ditemi cosa ne pensate 🎧',
    song: 'studio.beats - draft 3',
    videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    likes: 51200,
    shares: 640,
    liked: false,
    following: false,
    bookmarked: false,
    comments: [
      { id: 'c1', user: 'nico.beats', text: 'il drop è fortissimo', likes: 88, time: '3h' },
    ],
  },
]

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return `${n}`
}

export default function TikTokFeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>(INITIAL_POSTS)
  const [muted, setMuted] = useState(true)
  const [activeSheet, setActiveSheet] = useState<{ type: 'comments' | 'share'; postId: string } | null>(null)
  const [commentDraft, setCommentDraft] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [burst, setBurst] = useState<string | null>(null)
  const [loadedVideos, setLoadedVideos] = useState<Record<string, boolean>>({})

  const containerRef = useRef<HTMLDivElement>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const burstTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const videos = Array.from(container.querySelectorAll('video'))
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const video = entry.target as HTMLVideoElement
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
            video.play().catch(() => {})
          } else {
            video.pause()
          }
        }
      },
      { threshold: [0, 0.6, 1] }
    )

    videos.forEach((video) => observer.observe(video))
    return () => observer.disconnect()
  }, [])

  function showToast(message: string) {
    setToast(message)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 1800)
  }

  function toggleLike(id: string) {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === id
          ? { ...post, liked: !post.liked, likes: post.likes + (post.liked ? -1 : 1) }
          : post
      )
    )
  }

  function likeOnDoubleTap(id: string) {
    setPosts((prev) =>
      prev.map((post) => (post.id === id && !post.liked ? { ...post, liked: true, likes: post.likes + 1 } : post))
    )
    setBurst(id)
    if (burstTimer.current) clearTimeout(burstTimer.current)
    burstTimer.current = setTimeout(() => setBurst(null), 700)
  }

  function toggleFollow(id: string) {
    setPosts((prev) =>
      prev.map((post) => (post.id === id ? { ...post, following: !post.following } : post))
    )
  }

  function toggleBookmark(id: string) {
    setPosts((prev) =>
      prev.map((post) => (post.id === id ? { ...post, bookmarked: !post.bookmarked } : post))
    )
    showToast('Aggiunto ai preferiti')
  }

  function togglePlayPause(video: HTMLVideoElement) {
    if (video.paused) video.play().catch(() => {})
    else video.pause()
  }

  function addComment(id: string) {
    const text = commentDraft.trim()
    if (!text) return
    setPosts((prev) =>
      prev.map((post) =>
        post.id === id
          ? {
              ...post,
              comments: [{ id: `local-${Date.now()}`, user: 'tu', text, likes: 0, time: 'ora' }, ...post.comments],
            }
          : post
      )
    )
    setCommentDraft('')
  }

  function share(id: string, channel: string) {
    if (channel === 'copy') {
      const url = typeof window !== 'undefined' ? `${window.location.origin}/tiktok?v=${id}` : `/tiktok?v=${id}`
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(url).catch(() => {})
      }
      showToast('Link copiato')
    } else {
      showToast(`Condivisione su ${channel} (demo)`)
    }
    setPosts((prev) => prev.map((post) => (post.id === id ? { ...post, shares: post.shares + 1 } : post)))
    setActiveSheet(null)
  }

  const activePost = activeSheet ? posts.find((post) => post.id === activeSheet.postId) ?? null : null

  return (
    <div className="min-h-screen w-full bg-black flex justify-center">
      <div className="relative w-full max-w-[480px] h-screen bg-black overflow-hidden text-white">
        {/* Top bar */}
        <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-center gap-6 pt-4 pb-3 bg-gradient-to-b from-black/60 to-transparent">
          <button
            onClick={() => showToast('Segui utenti per vedere questa scheda')}
            className="text-sm text-white/60 font-medium"
          >
            Following
          </button>
          <button className="text-sm font-semibold border-b-2 border-white pb-1">Per te</button>
          <button
            onClick={() => showToast('Ricerca non disponibile in questa demo')}
            className="absolute right-4"
            aria-label="Cerca"
          >
            <Search size={22} />
          </button>
        </div>

        {/* Global mute toggle */}
        <button
          onClick={() => setMuted((m) => !m)}
          className="absolute top-14 right-3 z-20 bg-black/40 rounded-full p-2"
          aria-label={muted ? 'Attiva audio' : 'Disattiva audio'}
        >
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>

        {/* Feed */}
        <div
          ref={containerRef}
          className="h-full w-full overflow-y-scroll snap-y snap-mandatory [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none' }}
        >
          {posts.map((post) => (
            <section key={post.id} className="relative h-full w-full snap-start snap-always flex items-center justify-center bg-black">
              <div
                className="absolute inset-0"
                style={{ background: `radial-gradient(circle at 50% 35%, ${post.avatarColor}55, #000 75%)` }}
              />
              <video
                src={post.videoUrl}
                muted={muted}
                loop
                playsInline
                disablePictureInPicture
                preload="metadata"
                className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
                style={{ opacity: loadedVideos[post.id] ? 1 : 0 }}
                onLoadedData={() => setLoadedVideos((prev) => ({ ...prev, [post.id]: true }))}
                onClick={(e) => togglePlayPause(e.currentTarget)}
                onDoubleClick={() => likeOnDoubleTap(post.id)}
              />

              {burst === post.id && (
                <Heart
                  size={110}
                  className="absolute text-white pointer-events-none animate-ping fill-[#fe2c55] text-[#fe2c55]"
                  style={{ animationDuration: '650ms', animationIterationCount: 1 }}
                />
              )}

              <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

              {/* Caption block */}
              <div className="absolute left-3 bottom-20 z-10 max-w-[72%] space-y-2">
                <p className="font-semibold">@{post.user}</p>
                <p className="text-sm leading-snug">{post.caption}</p>
                <div className="flex items-center gap-2 text-sm text-white/90">
                  <Music2 size={14} />
                  <span className="truncate">{post.song}</span>
                </div>
              </div>

              {/* Action rail */}
              <div className="absolute right-2 bottom-20 z-10 flex flex-col items-center gap-5">
                <div className="relative">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center border-2 border-white text-sm font-bold"
                    style={{ backgroundColor: post.avatarColor }}
                  >
                    {post.user.slice(0, 2).toUpperCase()}
                  </div>
                  {!post.following && (
                    <button
                      onClick={() => toggleFollow(post.id)}
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#fe2c55] rounded-full w-5 h-5 flex items-center justify-center"
                      aria-label="Segui"
                    >
                      <Plus size={12} strokeWidth={3} />
                    </button>
                  )}
                </div>

                <button onClick={() => toggleLike(post.id)} className="flex flex-col items-center gap-1">
                  <Heart size={32} className={post.liked ? 'fill-[#fe2c55] text-[#fe2c55]' : 'text-white'} />
                  <span className="text-xs font-semibold">{formatCount(post.likes)}</span>
                </button>

                <button
                  onClick={() => setActiveSheet({ type: 'comments', postId: post.id })}
                  className="flex flex-col items-center gap-1"
                >
                  <MessageCircle size={30} />
                  <span className="text-xs font-semibold">{formatCount(post.comments.length)}</span>
                </button>

                <button onClick={() => toggleBookmark(post.id)} className="flex flex-col items-center gap-1">
                  <Bookmark size={28} className={post.bookmarked ? 'fill-yellow-400 text-yellow-400' : 'text-white'} />
                </button>

                <button
                  onClick={() => setActiveSheet({ type: 'share', postId: post.id })}
                  className="flex flex-col items-center gap-1"
                >
                  <Share2 size={28} />
                  <span className="text-xs font-semibold">{formatCount(post.shares)}</span>
                </button>

                <div
                  className="w-9 h-9 rounded-full border-2 border-white/70 flex items-center justify-center bg-neutral-800 animate-spin"
                  style={{ animationDuration: '3s' }}
                >
                  <Music2 size={14} />
                </div>
              </div>
            </section>
          ))}
        </div>

        {/* Bottom nav */}
        <div className="absolute bottom-0 inset-x-0 z-20 flex items-center justify-between px-6 py-3 bg-black/70 backdrop-blur-sm border-t border-white/10">
          <button className="flex flex-col items-center gap-0.5 text-white">
            <Home size={22} />
            <span className="text-[10px]">Home</span>
          </button>
          <button
            onClick={() => showToast('Sezione demo non disponibile')}
            className="flex flex-col items-center gap-0.5 text-white/60"
          >
            <Compass size={22} />
            <span className="text-[10px]">Esplora</span>
          </button>
          <button
            onClick={() => showToast('Caricamento non disponibile in questa demo')}
            className="bg-white rounded-lg px-4 py-1.5"
          >
            <Plus size={18} className="text-black" strokeWidth={3} />
          </button>
          <button
            onClick={() => showToast('Messaggi demo non disponibili')}
            className="flex flex-col items-center gap-0.5 text-white/60"
          >
            <Send size={22} />
            <span className="text-[10px]">Inbox</span>
          </button>
          <button
            onClick={() => showToast('Profilo demo non disponibile')}
            className="flex flex-col items-center gap-0.5 text-white/60"
          >
            <User size={22} />
            <span className="text-[10px]">Profilo</span>
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 bg-neutral-800/95 text-white text-sm px-4 py-2 rounded-full">
            {toast}
          </div>
        )}

        {/* Comments sheet */}
        {activeSheet?.type === 'comments' && activePost && (
          <div className="absolute inset-0 z-40 flex items-end justify-center bg-black/60" onClick={() => setActiveSheet(null)}>
            <div
              className="w-full max-w-[480px] h-[70%] bg-[#1c1c1e] rounded-t-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <p className="font-semibold">{activePost.comments.length} commenti</p>
                <button onClick={() => setActiveSheet(null)} aria-label="Chiudi">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
                {activePost.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-neutral-600 flex items-center justify-center text-xs font-bold shrink-0">
                      {comment.user.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-white/50">{comment.user} · {comment.time}</p>
                      <p className="text-sm">{comment.text}</p>
                    </div>
                    <div className="flex flex-col items-center gap-1 pt-1">
                      <Heart size={14} className="text-white/60" />
                      <span className="text-[10px] text-white/50">{comment.likes}</span>
                    </div>
                  </div>
                ))}
                {activePost.comments.length === 0 && (
                  <p className="text-sm text-white/50 text-center pt-8">Nessun commento ancora. Scrivi il primo!</p>
                )}
              </div>
              <div className="flex items-center gap-2 px-4 py-3 border-t border-white/10">
                <input
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addComment(activePost.id)
                  }}
                  placeholder="Aggiungi un commento..."
                  className="flex-1 bg-neutral-800 rounded-full px-4 py-2 text-sm outline-none placeholder:text-white/40"
                />
                <button
                  onClick={() => addComment(activePost.id)}
                  disabled={!commentDraft.trim()}
                  className="text-[#fe2c55] disabled:text-white/30"
                  aria-label="Invia commento"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Share sheet */}
        {activeSheet?.type === 'share' && activePost && (
          <div className="absolute inset-0 z-40 flex items-end justify-center bg-black/60" onClick={() => setActiveSheet(null)}>
            <div
              className="w-full max-w-[480px] bg-[#1c1c1e] rounded-t-2xl p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                <p className="font-semibold">Invia a</p>
                <button onClick={() => setActiveSheet(null)} aria-label="Chiudi">
                  <X size={20} />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-4 text-center">
                {[
                  { key: 'copy', label: 'Copia link', icon: Link2 },
                  { key: 'WhatsApp', label: 'WhatsApp', icon: MessageSquareText },
                  { key: 'Telegram', label: 'Telegram', icon: Send },
                  { key: 'Altro', label: 'Altro', icon: MoreHorizontal },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => share(activePost.id, key)}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="w-12 h-12 rounded-full bg-neutral-700 flex items-center justify-center">
                      <Icon size={20} />
                    </div>
                    <span className="text-xs text-white/80">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
