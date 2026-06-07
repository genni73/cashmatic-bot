import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  sequence,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

/* ─── Brand colours ─────────────────────────────────────── */
const NAVY   = "#0d1b3e";
const CYAN   = "#00ccff";
const WHITE  = "#ffffff";
const GOLD   = "#f5c842";

/* ─── Helpers ────────────────────────────────────────────── */
function useFade(startFrame: number, endFrame: number) {
  const frame = useCurrentFrame();
  return interpolate(frame, [startFrame, startFrame + 15, endFrame - 10, endFrame], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

function useSlideUp(startFrame: number) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame: frame - startFrame, fps, config: { damping: 18, stiffness: 120 } });
  const translateY = interpolate(progress, [0, 1], [80, 0]);
  const opacity = interpolate(progress, [0, 0.4], [0, 1], { extrapolateRight: "clamp" });
  return { translateY, opacity };
}

function useScaleIn(startFrame: number) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame: frame - startFrame, fps, config: { damping: 14, stiffness: 100 } });
  const scale = interpolate(progress, [0, 1], [0.3, 1]);
  const opacity = interpolate(progress, [0, 0.3], [0, 1], { extrapolateRight: "clamp" });
  return { scale, opacity };
}

/* ─── GF Logo with neon glow ─────────────────────────────── */
const LogoReveal: React.FC<{ startFrame: number }> = ({ startFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { scale, opacity } = useScaleIn(startFrame);
  const pulse = Math.sin((frame / fps) * 2 * Math.PI) * 0.5 + 0.5;
  const glowSize = interpolate(pulse, [0, 1], [20, 45]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `scale(${scale})`,
        opacity,
      }}
    >
      <Img
        src={staticFile("logo-gf.png")}
        style={{
          width: 320,
          height: 320,
          borderRadius: "50%",
          filter: `drop-shadow(0 0 ${glowSize}px ${CYAN}) drop-shadow(0 0 ${glowSize * 0.5}px ${CYAN})`,
        }}
      />
    </div>
  );
};

/* ─── Animated text line ─────────────────────────────────── */
const TextLine: React.FC<{
  text: string;
  fontSize?: number;
  color?: string;
  bold?: boolean;
  emoji?: string;
  startFrame?: number;
}> = ({ text, fontSize = 62, color = WHITE, bold = false, emoji, startFrame = 0 }) => {
  const { translateY, opacity } = useSlideUp(startFrame);
  return (
    <div
      style={{
        transform: `translateY(${translateY}px)`,
        opacity,
        display: "flex",
        alignItems: "center",
        gap: 16,
        justifyContent: "center",
      }}
    >
      {emoji && <span style={{ fontSize: fontSize * 1.1 }}>{emoji}</span>}
      <span
        style={{
          fontSize,
          color,
          fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
          fontWeight: bold ? 900 : 600,
          textAlign: "center",
          textShadow: `0 2px 20px rgba(0,0,0,0.8)`,
          lineHeight: 1.2,
        }}
      >
        {text}
      </span>
    </div>
  );
};

/* ─── Vantaggio card ─────────────────────────────────────── */
const VantaggioCard: React.FC<{
  emoji: string;
  titolo: string;
  sottotitolo: string;
  startFrame: number;
  accentColor?: string;
}> = ({ emoji, titolo, sottotitolo, startFrame, accentColor = CYAN }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame: frame - startFrame, fps, config: { damping: 16, stiffness: 110 } });
  const translateX = interpolate(progress, [0, 1], [-120, 0]);
  const opacity = interpolate(progress, [0, 0.3], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        transform: `translateX(${translateX}px)`,
        opacity,
        background: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(10px)",
        border: `2px solid ${accentColor}40`,
        borderLeft: `6px solid ${accentColor}`,
        borderRadius: 24,
        padding: "36px 44px",
        width: "100%",
        maxWidth: 880,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 12 }}>
        <span style={{ fontSize: 72 }}>{emoji}</span>
        <span
          style={{
            fontSize: 52,
            fontWeight: 900,
            color: WHITE,
            fontFamily: "'Inter', sans-serif",
            lineHeight: 1.1,
          }}
        >
          {titolo}
        </span>
      </div>
      <p
        style={{
          fontSize: 40,
          color: accentColor,
          fontFamily: "'Inter', sans-serif",
          fontWeight: 600,
          margin: 0,
          paddingLeft: 96,
        }}
      >
        {sottotitolo}
      </p>
    </div>
  );
};

/* ─── Scene counter bar (progress indicator) ─────────────── */
const ProgressBar: React.FC<{ total: number }> = ({ total }) => {
  const frame = useCurrentFrame();
  const progress = frame / total;
  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        height: 8,
        width: `${progress * 100}%`,
        background: `linear-gradient(90deg, ${CYAN}, ${GOLD})`,
        borderRadius: "0 4px 4px 0",
        zIndex: 100,
      }}
    />
  );
};

/* ─── Particle dots background ───────────────────────────── */
const ParticleBg: React.FC = () => {
  const frame = useCurrentFrame();
  const dots = Array.from({ length: 18 }, (_, i) => ({
    x: ((i * 137.5) % 100),
    y: ((i * 73.1) % 100),
    size: 3 + (i % 4),
    speed: 0.3 + (i % 3) * 0.2,
    delay: i * 15,
  }));

  return (
    <AbsoluteFill style={{ overflow: "hidden", pointerEvents: "none" }}>
      {dots.map((d, i) => {
        const opacity = Math.sin((frame * d.speed + d.delay) * 0.04) * 0.4 + 0.2;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${d.x}%`,
              top: `${d.y}%`,
              width: d.size,
              height: d.size,
              borderRadius: "50%",
              background: CYAN,
              opacity,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/* ─── Main composition ───────────────────────────────────── */
export const CashmaticTikTok: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  /* Scene timing (frames @ 30fps) */
  const S = {
    logoIn:       0,    // 0s  – GF logo reveal
    hookIn:       80,   // 2.7s – hook testo
    productIn:    170,  // 5.7s – selfpay reveal
    v1In:         320,  // 10.7s – vantaggio 1
    v2In:         460,  // 15.3s – vantaggio 2
    v3In:         600,  // 20s   – vantaggio 3
    v4In:         740,  // 24.7s – vantaggio 4
    ctaIn:        880,  // 29.3s – CTA
    outroIn:      1050, // 35s   – outro logo
  };

  /* Background gradient that subtly shifts */
  const gradAngle = interpolate(frame, [0, durationInFrames], [135, 200]);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${gradAngle}deg, #040e22 0%, #0d1b3e 50%, #071428 100%)`,
        fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
        overflow: "hidden",
      }}
    >
      <ParticleBg />
      <ProgressBar total={durationInFrames} />

      {/* ── SCENE 1: Logo GF reveal ── */}
      <Sequence from={S.logoIn} durationInFrames={S.productIn - S.logoIn + 30}>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 40 }}>
          <LogoReveal startFrame={0} />
          <Sequence from={40}>
            <TextLine text="CASSE AUTOMATICHE" fontSize={52} color={CYAN} bold startFrame={0} />
          </Sequence>
          <Sequence from={70}>
            <TextLine text="perIlDenaro.it" fontSize={40} color={`${WHITE}99`} startFrame={0} />
          </Sequence>
        </AbsoluteFill>
      </Sequence>

      {/* ── SCENE 2: Hook ── */}
      <Sequence from={S.hookIn} durationInFrames={S.productIn - S.hookIn + 20}>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 32, padding: "0 80px" }}>
          <TextLine text="Stai ancora" fontSize={70} color={`${WHITE}bb`} startFrame={0} />
          <TextLine text="contando i soldi" fontSize={70} color={`${WHITE}bb`} bold startFrame={8} />
          <TextLine text="a mano? 😰" fontSize={80} color={GOLD} bold startFrame={16} />
        </AbsoluteFill>
      </Sequence>

      {/* ── SCENE 3: Selfpay 1060 reveal ── */}
      <Sequence from={S.productIn} durationInFrames={S.v1In - S.productIn + 30}>
        <AbsoluteFill style={{ flexDirection: "column" }}>
          {/* top label */}
          <div style={{ padding: "120px 60px 0", textAlign: "center" }}>
            <TextLine text="Ecco la soluzione 👇" fontSize={56} color={CYAN} startFrame={0} />
          </div>
          {/* product image */}
          {(() => {
            const prog = spring({ frame: frame - S.productIn - 20, fps, config: { damping: 14, stiffness: 90 } });
            const scale = interpolate(prog, [0, 1], [0.5, 1]);
            const opacity = interpolate(prog, [0, 0.3], [0, 1], { extrapolateRight: "clamp" });
            return (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${scale})`, opacity }}>
                <Img
                  src={staticFile("selfpay-1060.jpeg")}
                  style={{
                    width: 720,
                    height: 720,
                    objectFit: "contain",
                    filter: `drop-shadow(0 0 60px ${CYAN}55) drop-shadow(0 30px 40px rgba(0,0,0,0.6))`,
                    borderRadius: 32,
                  }}
                />
              </div>
            );
          })()}
          {/* product name */}
          <div style={{ padding: "0 60px 80px", textAlign: "center" }}>
            <TextLine text="CASHMATIC" fontSize={72} color={WHITE} bold startFrame={30} />
            <TextLine text="Selfpay 1060" fontSize={58} color={CYAN} startFrame={40} />
            <TextLine text="La più veloce sul mercato 🏆" fontSize={44} color={GOLD} startFrame={50} />
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* ── SCENE 4–7: Vantaggi ── */}
      <Sequence from={S.v1In} durationInFrames={S.ctaIn - S.v1In + 30}>
        <AbsoluteFill style={{ flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 32, padding: "0 60px" }}>
          <TextLine text="I vantaggi?" fontSize={68} color={WHITE} bold startFrame={0} />
          <TextLine text="Eccoli 👇" fontSize={56} color={CYAN} startFrame={10} />
        </AbsoluteFill>
      </Sequence>

      <Sequence from={S.v1In + 60} durationInFrames={S.ctaIn - S.v1In}>
        <AbsoluteFill style={{ flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 36, padding: "0 60px" }}>
          <VantaggioCard
            emoji="⚡"
            titolo="Velocissima"
            sottotitolo="Processa banconote in meno di 1 secondo"
            startFrame={0}
            accentColor={GOLD}
          />
          <Sequence from={S.v2In - S.v1In - 60}>
            <VantaggioCard
              emoji="💰"
              titolo="100% Automatica"
              sottotitolo="Conta e gestisce banconote e monete"
              startFrame={0}
              accentColor={CYAN}
            />
          </Sequence>
          <Sequence from={S.v3In - S.v1In - 60}>
            <VantaggioCard
              emoji="✅"
              titolo="Zero Errori"
              sottotitolo="Addio ammanchi e differenze di cassa"
              startFrame={0}
              accentColor="#4ade80"
            />
          </Sequence>
          <Sequence from={S.v4In - S.v1In - 60}>
            <VantaggioCard
              emoji="🔒"
              titolo="Sicurezza H24"
              sottotitolo="Il denaro è sempre protetto e contato"
              startFrame={0}
              accentColor="#f87171"
            />
          </Sequence>
        </AbsoluteFill>
      </Sequence>

      {/* ── SCENE 8: CTA ── */}
      <Sequence from={S.ctaIn} durationInFrames={S.outroIn - S.ctaIn + 30}>
        <AbsoluteFill style={{ flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 40, padding: "0 80px" }}>
          {(() => {
            const prog = spring({ frame: frame - S.ctaIn, fps, config: { damping: 12, stiffness: 80 } });
            const scale = interpolate(prog, [0, 1], [0.7, 1]);
            const opacity = interpolate(prog, [0, 0.3], [0, 1], { extrapolateRight: "clamp" });
            return (
              <div style={{ transform: `scale(${scale})`, opacity, textAlign: "center" }}>
                <div style={{
                  background: `linear-gradient(135deg, ${CYAN}22, ${NAVY}88)`,
                  border: `3px solid ${CYAN}`,
                  borderRadius: 32,
                  padding: "60px 80px",
                }}>
                  <TextLine text="Vuoi saperne di più?" fontSize={62} color={WHITE} bold startFrame={0} />
                  <div style={{ height: 24 }} />
                  <TextLine text="📞 Chiamaci ora" fontSize={52} color={GOLD} bold startFrame={20} />
                  <div style={{ height: 16 }} />
                  <TextLine text="🌐 perIlDenaro.it" fontSize={52} color={CYAN} bold startFrame={30} />
                  <div style={{ height: 40 }} />
                  <div style={{ display: "flex", justifyContent: "center", gap: 24 }}>
                    {["Assistenza", "Vendita", "Noleggio"].map((s, i) => (
                      <div key={s} style={{
                        background: `${CYAN}22`,
                        border: `2px solid ${CYAN}66`,
                        borderRadius: 40,
                        padding: "12px 32px",
                        fontSize: 38,
                        color: WHITE,
                        fontWeight: 700,
                        fontFamily: "'Inter', sans-serif",
                      }}>
                        {s}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </AbsoluteFill>
      </Sequence>

      {/* ── SCENE 9: Outro logo ── */}
      <Sequence from={S.outroIn} durationInFrames={durationInFrames - S.outroIn}>
        <AbsoluteFill style={{ flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 48 }}>
          {(() => {
            const relFrame = frame - S.outroIn;
            const pulse = Math.sin(relFrame * 0.08) * 0.5 + 0.5;
            const glow = interpolate(pulse, [0, 1], [30, 60]);
            const prog = spring({ frame: relFrame, fps, config: { damping: 14, stiffness: 100 } });
            const scale = interpolate(prog, [0, 1], [0.6, 1]);
            const opacity = interpolate(prog, [0, 0.3], [0, 1], { extrapolateRight: "clamp" });
            return (
              <>
                <div style={{ transform: `scale(${scale})`, opacity }}>
                  <Img
                    src={staticFile("logo-gf.png")}
                    style={{
                      width: 360,
                      height: 360,
                      borderRadius: "50%",
                      filter: `drop-shadow(0 0 ${glow}px ${CYAN})`,
                    }}
                  />
                </div>
                <Sequence from={20}>
                  <div style={{ textAlign: "center" }}>
                    <TextLine text="GF Casse Automatiche" fontSize={54} color={WHITE} bold startFrame={0} />
                    <TextLine text="perIlDenaro.it" fontSize={46} color={CYAN} startFrame={15} />
                    <TextLine text="📍 Seguici su TikTok!" fontSize={42} color={GOLD} startFrame={30} />
                  </div>
                </Sequence>
              </>
            );
          })()}
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
