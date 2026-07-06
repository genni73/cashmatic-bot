'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Globe, Send, Mail } from 'lucide-react'
import GlitchText from '@/components/GlitchText'

const Scene = dynamic(() => import('@/components/Scene'), { ssr: false })

const PROJECTS = [
  {
    index: '01',
    title: 'Aurora Commerce',
    tag: 'E-commerce · WebGL',
    gradient: 'from-orange-500/40 via-rose-500/20 to-transparent',
  },
  {
    index: '02',
    title: 'Wavelength Studio',
    tag: 'Brand · Motion',
    gradient: 'from-cyan-400/40 via-blue-500/20 to-transparent',
  },
  {
    index: '03',
    title: 'Fractal Labs',
    tag: 'Product · 3D',
    gradient: 'from-violet-500/40 via-fuchsia-500/20 to-transparent',
  },
  {
    index: '04',
    title: 'Northline',
    tag: 'Portfolio · Interactive',
    gradient: 'from-emerald-400/40 via-teal-500/20 to-transparent',
  },
]

function useScrolled(threshold: number) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > threshold)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])
  return scrolled
}

function useRevealOnScroll() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true)
      },
      { threshold: 0.2 }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return { ref, visible }
}

function Reveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { ref, visible } = useRevealOnScroll()
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      } ${className}`}
    >
      {children}
    </div>
  )
}

export default function Home() {
  const scrolled = useScrolled(60)

  return (
    <>
      <div className="noise-overlay" />

      {/* Nav */}
      <nav
        className={`fixed top-0 inset-x-0 z-30 flex items-center justify-between px-4 md:px-10 py-4 md:py-5 transition-colors duration-300 ${
          scrolled ? 'bg-black/70 backdrop-blur-md border-b border-white/10' : 'bg-transparent'
        }`}
      >
        <a href="#top" className="flex items-center gap-2 font-semibold tracking-tight text-base md:text-lg shrink-0">
          <span className="inline-block w-2 h-2 rounded-full bg-[var(--accent)]" />
          NOVA
        </a>
        <div className="flex items-center gap-0 md:gap-1 font-mono text-[10px] md:text-xs tracking-widest text-white/70 whitespace-nowrap">
          <a href="#top" className="px-1.5 md:px-3 py-2 hover:text-white transition-colors">
            [ HOME ]
          </a>
          <a href="#work" className="px-1.5 md:px-3 py-2 hover:text-white transition-colors">
            [ WORK ]
          </a>
          <a href="#contact" className="px-1.5 md:px-3 py-2 hover:text-white transition-colors">
            [ CONTACT ]
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section id="top" className="relative h-screen w-full overflow-hidden">
        <div className="absolute inset-0">
          <Scene />
        </div>

        <div className="relative z-10 h-full w-full flex flex-col items-center justify-center px-6 text-center pointer-events-none">
          <p className="font-mono text-xs md:text-sm tracking-[0.3em] text-[var(--accent)] mb-6">
            DIGITAL EXPERIENCES STUDIO
          </p>
          <h1 className="font-sans text-5xl sm:text-6xl md:text-8xl font-medium leading-[0.95] tracking-tight">
            <GlitchText text="WE CRAFT" />
            <br />
            <GlitchText text="IMMERSIVE" />
            <br />
            <GlitchText text="REALITIES" />
          </h1>
          <p className="mt-8 max-w-md text-white/60 text-sm md:text-base">
            Siti interattivi, esperienze 3D e brand digitali che restano impressi. Questa è una
            pagina dimostrativa con contenuti segnaposto.
          </p>
          <a
            href="#work"
            className="pointer-events-auto mt-10 inline-flex items-center gap-2 border border-white/20 rounded-full px-6 py-3 text-sm font-mono tracking-wide hover:bg-white hover:text-black transition-colors"
          >
            VIEW OUR WORK
            <ArrowUpRight size={16} />
          </a>
        </div>

        <div className="absolute bottom-8 inset-x-0 flex flex-col items-center gap-2 text-white/40 font-mono text-[10px] tracking-[0.3em] z-10">
          SCROLL
          <span className="w-px h-10 bg-gradient-to-b from-white/40 to-transparent" />
        </div>
      </section>

      {/* Work */}
      <section id="work" className="relative bg-black px-6 md:px-10 py-28 md:py-36">
        <Reveal>
          <div className="flex items-end justify-between mb-16 flex-wrap gap-4">
            <h2 className="font-sans text-3xl md:text-5xl font-medium tracking-tight">
              Selected Work
            </h2>
            <p className="font-mono text-xs tracking-widest text-white/40">
              (04) PROGETTI SEGNAPOSTO
            </p>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-6">
          {PROJECTS.map((project) => (
            <Reveal key={project.index}>
              <a
                href="#contact"
                className="group relative block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-8 h-64 transition-colors hover:border-white/25"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${project.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                />
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="flex items-start justify-between">
                    <span className="font-mono text-xs text-white/40">{project.index}</span>
                    <ArrowUpRight
                      size={20}
                      className="text-white/40 group-hover:text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-all"
                    />
                  </div>
                  <div>
                    <h3 className="text-2xl font-medium mb-1">{project.title}</h3>
                    <p className="font-mono text-xs tracking-widest text-white/40">
                      {project.tag}
                    </p>
                  </div>
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="relative bg-black px-6 md:px-10 py-28 md:py-40 border-t border-white/10">
        <Reveal className="max-w-3xl">
          <p className="font-mono text-xs tracking-[0.3em] text-[var(--accent)] mb-6">
            HAI UN PROGETTO IN MENTE?
          </p>
          <h2 className="font-sans text-4xl md:text-6xl font-medium tracking-tight mb-10">
            <GlitchText text="LET'S BUILD" />
            <br />
            <GlitchText text="SOMETHING GREAT" />
          </h2>
          <a
            href="mailto:hello@nova.studio"
            className="inline-flex items-center gap-3 text-xl md:text-2xl border-b border-white/30 pb-2 hover:border-white transition-colors"
          >
            hello@nova.studio
            <ArrowUpRight size={22} />
          </a>

          <div className="flex items-center gap-5 mt-12 text-white/50">
            <a href="#" className="hover:text-white transition-colors" aria-label="Email">
              <Mail size={18} />
            </a>
            <a href="#" className="hover:text-white transition-colors" aria-label="Sito web">
              <Globe size={18} />
            </a>
            <a href="#" className="hover:text-white transition-colors" aria-label="Invia messaggio">
              <Send size={18} />
            </a>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-white/10 px-6 md:px-10 py-8 flex flex-wrap items-center justify-between gap-4 font-mono text-[11px] tracking-widest text-white/30">
        <span>© {new Date().getFullYear()} NOVA STUDIO — DEMO</span>
        <a href="#top" className="hover:text-white transition-colors">
          BACK TO TOP ↑
        </a>
      </footer>
    </>
  )
}
