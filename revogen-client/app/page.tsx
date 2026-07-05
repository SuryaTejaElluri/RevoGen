"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  useMotionValue,
  useSpring,
  AnimatePresence,
} from "framer-motion";

// ─── Fade / Slide helpers ────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.65, delay: i * 0.08, ease: [0.16, 0.84, 0.44, 1] } }),
};
const fadeIn = {
  hidden: { opacity: 0 },
  show: (i = 0) => ({ opacity: 1, transition: { duration: 0.6, delay: i * 0.07 } }),
};

function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} variants={fadeUp} initial="hidden" animate={inView ? "show" : "hidden"} custom={delay} className={className}>
      {children}
    </motion.div>
  );
}

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} variants={fadeIn} initial="hidden" animate={inView ? "show" : "hidden"} custom={delay} className={className}>
      {children}
    </motion.div>
  );
}

// ─── Count-up ────────────────────────────────────────────────────────────────
function CountUp({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / 60;
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(timer); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);
  return <span ref={ref}>{val}{suffix}</span>;
}

// ─── Space Canvas (stars + meteors) ─────────────────────────────────────────
function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    let W = window.innerWidth, H = window.innerHeight;
    type Star = { x:number;y:number;r:number;a:number;tw:number;sp:number };
    type Meteor = { x:number;y:number;vx:number;vy:number;len:number;life:number;max:number;alpha:number };
    let stars: Star[] = [], meteors: Meteor[] = [], last = 0, next = 4000 + Math.random()*4000;
    const setup = () => {
      W = window.innerWidth; H = window.innerHeight;
      const dpr = Math.min(devicePixelRatio||1,2);
      canvas.width = W*dpr; canvas.height = H*dpr;
      canvas.style.width = W+"px"; canvas.style.height = H+"px";
      ctx.setTransform(dpr,0,0,dpr,0,0);
      stars = Array.from({length:Math.min(Math.round(W*H/9000),220)},()=>({
        x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.3+0.3,
        a:Math.random()*0.6+0.25,tw:Math.random()*Math.PI*2,sp:Math.random()*0.012+0.004
      }));
    };
    const spawn = () => {
      const ang = (Math.PI/180)*(130+Math.random()*20), sp = 7+Math.random()*4;
      meteors.push({ x:Math.random()*W*0.8, y:-40, vx:-Math.cos(ang)*sp, vy:Math.sin(ang)*sp, len:90+Math.random()*70, life:0, max:60+Math.random()*20, alpha:1 });
    };
    const draw = (t:number) => {
      ctx.clearRect(0,0,W,H);
      for (const s of stars) {
        const a = s.a + Math.sin(t*s.sp+s.tw)*0.28;
        ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
        ctx.fillStyle = `rgba(244,246,255,${Math.max(0,Math.min(1,a))})`; ctx.fill();
      }
      if (t-last > next) { spawn(); last=t; next=5000+Math.random()*6000; }
      meteors = meteors.filter(m=>m.life<m.max);
      for (const m of meteors) {
        m.x+=m.vx; m.y+=m.vy; m.life++;
        const p=m.life/m.max; m.alpha=p<0.15?p/0.15:1-(p-0.15)/0.85;
        const tx=m.x-m.vx*(m.len/8), ty=m.y-m.vy*(m.len/8);
        const g=ctx.createLinearGradient(m.x,m.y,tx,ty);
        g.addColorStop(0,`rgba(255,255,255,${0.95*m.alpha})`);
        g.addColorStop(0.4,`rgba(167,139,250,${0.55*m.alpha})`);
        g.addColorStop(1,"rgba(167,139,250,0)");
        ctx.beginPath(); ctx.strokeStyle=g; ctx.lineWidth=2; ctx.lineCap="round";
        ctx.moveTo(m.x,m.y); ctx.lineTo(tx,ty); ctx.stroke();
        ctx.beginPath(); ctx.arc(m.x,m.y,1.6,0,Math.PI*2);
        ctx.fillStyle=`rgba(255,255,255,${m.alpha})`; ctx.fill();
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    setup(); rafRef.current = requestAnimationFrame(draw);
    window.addEventListener("resize",setup);
    return () => { window.removeEventListener("resize",setup); if(rafRef.current) cancelAnimationFrame(rafRef.current); };
  },[]);
  return (
    <>
      <div style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none"}}><canvas ref={canvasRef} style={{display:"block",width:"100%",height:"100%"}} /></div>
      <div style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",background:"radial-gradient(ellipse 900px 600px at 18% 8%,rgba(124,92,255,0.16),transparent 60%),radial-gradient(ellipse 700px 500px at 85% 18%,rgba(0,229,255,0.10),transparent 60%),radial-gradient(ellipse 800px 700px at 50% 95%,rgba(255,111,165,0.07),transparent 65%)"}} />
    </>
  );
}

// ─── Global CSS ──────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700;800;900&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --void:#03040A;--void2:#060814;
  --card:rgba(16,20,38,0.55);--card2:#0D1126;
  --border:rgba(124,92,255,0.18);--border2:rgba(255,255,255,0.06);
  --nebula:#7C5CFF;--nebula2:#A78BFA;
  --aqua:#00E5FF;--aqua2:#5EEAD4;
  --gold:#FFC857;--rose:#FF6FA5;--green:#34E89E;
  --text:#F4F6FF;--muted:#9AA3C7;--muted2:#5E6694;
  --display:'Space Grotesk',sans-serif;--body:'Inter',sans-serif;
}
html{scroll-behavior:smooth}
body{background:var(--void);color:var(--text);font-family:var(--body);line-height:1.6;overflow-x:hidden;-webkit-font-smoothing:antialiased}
::selection{background:rgba(124,92,255,0.4);color:#fff}
::-webkit-scrollbar{width:7px}
::-webkit-scrollbar-track{background:var(--void)}
::-webkit-scrollbar-thumb{background:linear-gradient(var(--nebula),var(--aqua));border-radius:4px}
a{color:inherit;text-decoration:none}
.page-wrap{position:relative;z-index:1}

/* NAV */
.lp-nav{position:fixed;top:0;left:0;right:0;z-index:200;transition:background .3s,border-color .3s,backdrop-filter .3s}
.lp-nav.sc{background:rgba(3,4,10,.82);backdrop-filter:blur(22px) saturate(140%);border-bottom:1px solid var(--border)}
.lp-nav-inner{max-width:1240px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;padding:0 24px;height:70px}
.lp-logo{font-family:var(--display);font-size:1.35rem;font-weight:700;letter-spacing:-.02em;background:linear-gradient(135deg,var(--nebula2),var(--aqua));-webkit-background-clip:text;-webkit-text-fill-color:transparent;display:flex;align-items:center;gap:10px}
.lp-nav-links{display:flex;align-items:center;gap:2px;list-style:none}
.lp-nav-links a{color:var(--muted);font-size:.875rem;font-weight:500;padding:8px 14px;border-radius:9px;transition:color .2s,background .2s}
.lp-nav-links a:hover{color:var(--text);background:rgba(255,255,255,.05)}
.lp-nav-actions{display:flex;align-items:center;gap:10px}
.btn-ghost{background:transparent;border:1px solid rgba(255,255,255,.14);color:var(--text);font-size:.875rem;font-weight:500;padding:8px 18px;border-radius:10px;cursor:pointer;transition:all .2s}
.btn-ghost:hover{border-color:var(--nebula);color:var(--nebula2);background:rgba(124,92,255,.06)}
.btn-primary{background:linear-gradient(135deg,var(--nebula),#5B3FD9);color:#fff;font-size:.875rem;font-weight:600;padding:9px 20px;border-radius:10px;cursor:pointer;border:none;box-shadow:0 4px 18px rgba(124,92,255,.45);transition:all .2s;white-space:nowrap}
.btn-primary:hover{transform:translateY(-1px);box-shadow:0 8px 28px rgba(124,92,255,.6)}
.lp-burger{display:none;flex-direction:column;gap:5px;background:transparent;border:1.5px solid rgba(255,255,255,.12);cursor:pointer;padding:8px;border-radius:10px;transition:border-color .15s}
.lp-burger:hover{border-color:rgba(124,92,255,.5)}
.lp-burger span{display:block;width:18px;height:1.5px;background:rgba(255,255,255,.6);border-radius:2px;transition:all .2s ease}
.lp-burger.open span:nth-child(1){transform:translateY(6.5px) rotate(45deg)}
.lp-burger.open span:nth-child(2){opacity:0}
.lp-burger.open span:nth-child(3){transform:translateY(-6.5px) rotate(-45deg)}
.lp-drawer{position:fixed;top:78px;left:16px;right:16px;z-index:199;background:#0D0F1A;border:1px solid rgba(124,92,255,.18);border-radius:18px;padding:10px;display:flex;flex-direction:column;gap:2px;box-shadow:0 20px 60px rgba(0,0,0,.6)}
.lp-drawer a{color:rgba(255,255,255,.62);font-size:.9rem;font-weight:500;padding:12px 16px;border-radius:11px;transition:all .15s}
.lp-drawer a:hover{background:rgba(255,255,255,.06);color:rgba(255,255,255,.92)}
.lp-drawer-sep{height:1px;background:rgba(255,255,255,.06);margin:6px 4px}
.lp-drawer-btns{display:flex;gap:8px;padding:4px}
.lp-drawer-btns a{flex:1;text-align:center;display:block;border-radius:11px;padding:11px;font-size:.875rem;font-weight:600}

/* SECTION SHARED */
.section{padding:110px 24px;position:relative}
.s-inner{max-width:1200px;margin:0 auto}
.s-label{display:inline-flex;align-items:center;gap:9px;color:var(--nebula2);font-size:.78rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;margin-bottom:18px;font-family:var(--display)}
.s-label::before{content:'';width:22px;height:2px;background:linear-gradient(90deg,var(--nebula),var(--aqua));border-radius:1px}
.s-h2{font-family:var(--display);font-size:clamp(1.8rem,4vw,3rem);font-weight:700;letter-spacing:-.025em;line-height:1.15;margin-bottom:18px}
.s-sub{color:var(--muted);font-size:1.05rem;line-height:1.75;max-width:600px}
.s-header{margin-bottom:60px}
.glass{background:var(--card);border:1px solid var(--border2);backdrop-filter:blur(18px)}

/* HERO */
.hero{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;overflow:hidden;padding:130px 24px 90px;text-align:center}
.hero-badge{display:inline-flex;align-items:center;gap:9px;background:rgba(124,92,255,.1);border:1px solid rgba(124,92,255,.32);padding:7px 18px;border-radius:100px;font-size:.8rem;font-weight:600;color:var(--nebula2);margin-bottom:30px;letter-spacing:.02em;backdrop-filter:blur(6px)}
.hero-badge-dot{width:6px;height:6px;border-radius:50%;background:var(--aqua);animation:pulse-glow 2s ease-in-out infinite;box-shadow:0 0 8px var(--aqua)}
@keyframes pulse-glow{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.06)}}
.hero-h1{font-family:var(--display);font-size:clamp(2.4rem,6vw,5.2rem);font-weight:700;letter-spacing:-.03em;line-height:1.08;max-width:920px;margin:0 auto 26px}
.grad{background:linear-gradient(120deg,var(--nebula2) 0%,var(--aqua) 45%,var(--rose) 75%,var(--nebula2) 100%);background-size:250%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:shimmer 6s linear infinite}
@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
.hero-sub{font-size:clamp(1rem,2vw,1.2rem);color:var(--muted);max-width:640px;margin:0 auto 42px;font-weight:400;line-height:1.75}
.hero-ctas{display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap;margin-bottom:64px}
.btn-hero-primary{background:linear-gradient(135deg,var(--nebula),#5B3FD9);color:#fff;font-size:1rem;font-weight:700;padding:15px 34px;border-radius:13px;cursor:pointer;border:none;box-shadow:0 10px 36px rgba(124,92,255,.5);transition:all .25s;display:flex;align-items:center;gap:9px}
.btn-hero-primary:hover{transform:translateY(-2px);box-shadow:0 14px 46px rgba(124,92,255,.65)}
.btn-hero-secondary{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.14);color:var(--text);font-size:1rem;font-weight:600;padding:15px 34px;border-radius:13px;cursor:pointer;display:flex;align-items:center;gap:9px;backdrop-filter:blur(10px);transition:all .25s}
.btn-hero-secondary:hover{background:rgba(255,255,255,.08);border-color:var(--nebula)}
.hero-trusted{display:flex;align-items:center;gap:13px;justify-content:center;flex-wrap:wrap}
.hero-avatars{display:flex}
.hero-avatar{width:32px;height:32px;border-radius:50%;border:2px solid var(--void);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;margin-left:-8px}
.hero-floating{position:absolute;border-radius:50%;pointer-events:none;filter:blur(1px)}
.hero-ring{position:absolute;border:1px solid rgba(124,92,255,.18);border-radius:50%;pointer-events:none}
`;

const CSS2 = `
/* TRUSTED BY */
.trusted-band{padding:56px 24px;background:linear-gradient(135deg,rgba(124,92,255,.07),rgba(0,229,255,.04));border-top:1px solid var(--border2);border-bottom:1px solid var(--border2)}
.trusted-inner{max-width:1100px;margin:0 auto}
.trusted-label{text-align:center;color:var(--muted2);font-size:.78rem;font-weight:600;letter-spacing:.12em;text-transform:uppercase;margin-bottom:32px}
.trusted-logos{display:flex;align-items:center;justify-content:center;gap:32px;flex-wrap:wrap}
.trusted-logo{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:12px 28px;font-size:.85rem;font-weight:700;color:var(--muted2);letter-spacing:.04em;transition:all .25s;cursor:default}
.trusted-logo:hover{border-color:rgba(124,92,255,.3);color:var(--nebula2);background:rgba(124,92,255,.07)}

/* STATS */
.stats-band{background:linear-gradient(135deg,rgba(124,92,255,.07),rgba(0,229,255,.04));border-top:1px solid var(--border2);border-bottom:1px solid var(--border2);padding:68px 24px;position:relative}
.stats-grid{max-width:1000px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr);gap:32px;text-align:center}
.stat-num{font-family:var(--display);font-size:2.9rem;font-weight:700;letter-spacing:-.04em;background:linear-gradient(135deg,var(--nebula2),var(--aqua));-webkit-background-clip:text;-webkit-text-fill-color:transparent;line-height:1}
.stat-label{color:var(--muted);font-size:.875rem;margin-top:10px}

/* WHY REVOGEN */
.why-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.why-card{background:var(--card);border:1px solid var(--border2);border-radius:22px;padding:30px;position:relative;overflow:hidden;backdrop-filter:blur(16px);transition:all .32s}
.why-card:hover{border-color:var(--border);transform:translateY(-5px);box-shadow:0 24px 56px rgba(0,0,0,.45)}
.why-card-icon{width:52px;height:52px;border-radius:15px;margin-bottom:18px;display:flex;align-items:center;justify-content:center;font-size:24px;background:var(--icon-bg,rgba(124,92,255,.15));border:1px solid var(--icon-bdr,rgba(124,92,255,.22))}
.why-card h3{font-family:var(--display);font-size:1.05rem;font-weight:700;margin-bottom:10px}
.why-card p{color:var(--muted);font-size:.875rem;line-height:1.7}

/* FEATURES BENTO */
.features-bento{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.feat-card{background:var(--card);border:1px solid var(--border2);border-radius:22px;padding:30px;transition:all .35s;position:relative;overflow:hidden;cursor:default;backdrop-filter:blur(16px)}
.feat-card::before{content:'';position:absolute;inset:0;background:var(--card-grad,linear-gradient(135deg,rgba(124,92,255,.05),transparent));opacity:0;transition:opacity .35s}
.feat-card:hover{border-color:var(--border);transform:translateY(-5px);box-shadow:0 24px 56px rgba(0,0,0,.45)}
.feat-card:hover::before{opacity:1}
.feat-icon{width:54px;height:54px;border-radius:15px;margin-bottom:22px;display:flex;align-items:center;justify-content:center;font-size:25px;background:var(--icon-bg,rgba(124,92,255,.22));border:1px solid var(--icon-bdr,rgba(124,92,255,.22));position:relative;z-index:1}
.feat-card h3{font-family:var(--display);font-size:1.08rem;font-weight:700;margin-bottom:11px;position:relative;z-index:1}
.feat-card p{color:var(--muted);font-size:.875rem;line-height:1.7;margin-bottom:18px;position:relative;z-index:1}
.feat-bullets{list-style:none;display:flex;flex-direction:column;gap:7px;position:relative;z-index:1}
.feat-bullets li{color:var(--muted);font-size:.8rem;display:flex;align-items:flex-start;gap:8px}
.feat-bullets li::before{content:'✓';color:var(--green);font-weight:700;flex-shrink:0;margin-top:1px}
.feat-card.large{grid-column:span 2}

/* PLATFORM PREVIEW */
.mockups-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.mockup-card{background:var(--card);border:1px solid var(--border2);border-radius:22px;overflow:hidden;transition:all .35s;backdrop-filter:blur(16px)}
.mockup-card:hover{transform:translateY(-7px);box-shadow:0 30px 64px rgba(0,0,0,.5);border-color:var(--border)}
.mockup-topbar{background:rgba(255,255,255,.02);padding:13px 16px;display:flex;align-items:center;gap:8px;border-bottom:1px solid var(--border2)}
.mockup-dot{width:10px;height:10px;border-radius:50%}
.mockup-title-bar{flex:1;background:rgba(0,0,0,.25);border-radius:6px;height:21px;margin:0 8px;font-size:.7rem;color:var(--muted2);display:flex;align-items:center;padding:0 10px}
.mockup-body{padding:20px;min-height:200px}
.mockup-card-label{padding:17px 20px;border-top:1px solid var(--border2);display:flex;align-items:center;justify-content:space-between}
.mockup-label-name{font-family:var(--display);font-size:.875rem;font-weight:600}
.mockup-label-badge{font-size:.7rem;font-weight:600;color:var(--nebula2);background:rgba(124,92,255,.13);border:1px solid rgba(124,92,255,.24);padding:3px 11px;border-radius:100px}

/* ASSESSMENT PROCESS */
.workflow-steps{display:flex;align-items:flex-start;justify-content:center;gap:0;flex-wrap:wrap;position:relative}
.workflow-step{display:flex;flex-direction:column;align-items:center;text-align:center;gap:14px;flex:1;min-width:120px;max-width:160px;position:relative}
.workflow-connector{flex:1;display:flex;align-items:flex-start;justify-content:center;padding-top:31px;min-width:40px;max-width:80px;position:relative;overflow:hidden}
.connector-line{width:100%;height:2px;background:linear-gradient(90deg,var(--nebula),var(--aqua));position:relative;border-radius:1px}
.connector-dot{position:absolute;top:50%;left:0;transform:translateY(-50%);width:8px;height:8px;border-radius:50%;background:var(--aqua);animation:flow-dot 3s ease-in-out infinite;box-shadow:0 0 10px var(--aqua)}
@keyframes flow-dot{0%{transform:translateX(0) translateY(-50%);opacity:0}10%{opacity:1}90%{opacity:1}100%{transform:translateX(80px) translateY(-50%);opacity:0}}
.workflow-icon-wrap{width:62px;height:62px;border-radius:19px;background:linear-gradient(135deg,var(--nebula),#5B3FD9);display:flex;align-items:center;justify-content:center;font-size:27px;box-shadow:0 10px 28px rgba(124,92,255,.4),0 0 0 1px rgba(255,255,255,.08) inset}
.workflow-step-label{color:var(--muted);font-size:.8rem;font-weight:600;line-height:1.4}
.workflow-step-num{font-family:var(--display);font-size:.7rem;color:var(--nebula2);font-weight:700;letter-spacing:.06em}
`;

const CSS3 = `
/* RESUME AI */
.resume-flow{display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center}
.resume-pipeline{display:flex;flex-direction:column;gap:0}
.resume-step{display:flex;align-items:flex-start;gap:18px;position:relative;padding-bottom:28px}
.resume-step:last-child{padding-bottom:0}
.resume-step-line{position:absolute;left:23px;top:48px;bottom:0;width:2px;background:linear-gradient(to bottom,var(--nebula),rgba(124,92,255,0))}
.resume-step:last-child .resume-step-line{display:none}
.resume-step-icon{width:46px;height:46px;border-radius:14px;background:var(--card);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;position:relative;z-index:1}
.resume-step-num{font-size:.7rem;font-weight:700;color:var(--nebula2);letter-spacing:.06em;margin-bottom:4px;font-family:var(--display)}
.resume-step-title{font-family:var(--display);font-size:.95rem;font-weight:700;margin-bottom:6px}
.resume-step-desc{font-size:.82rem;color:var(--muted);line-height:1.55}
.resume-card{background:var(--card);border:1px solid var(--border2);border-radius:26px;padding:32px;backdrop-filter:blur(18px)}
.resume-score-ring{width:110px;height:110px;border-radius:50%;background:conic-gradient(var(--green) 82%,rgba(255,255,255,.06) 0);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.resume-score-inner{width:80px;height:80px;border-radius:50%;background:var(--card2);display:flex;flex-direction:column;align-items:center;justify-content:center}
.resume-score-num{font-family:var(--display);font-size:1.5rem;font-weight:800;color:var(--green)}
.resume-score-lbl{font-size:.6rem;color:var(--muted2)}
.resume-bar{flex:1;background:rgba(255,255,255,.06);border-radius:4px;height:5px;overflow:hidden}
.resume-bar-fill{height:100%;border-radius:4px}
.resume-missing{background:rgba(255,111,165,.06);border:1px solid rgba(255,111,165,.18);border-radius:12px;padding:14px;margin-top:14px}
.resume-missing-title{font-size:.75rem;font-weight:700;color:var(--rose);margin-bottom:8px}
.resume-tags{display:flex;flex-wrap:wrap;gap:6px}
.resume-tag{background:rgba(255,111,165,.1);border:1px solid rgba(255,111,165,.22);border-radius:100px;padding:3px 10px;font-size:.72rem;color:var(--rose)}

/* ANALYTICS */
.analytics-grid{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center}
.analytics-card{background:var(--card);border:1px solid var(--border2);border-radius:26px;padding:30px;backdrop-filter:blur(18px)}
.analytics-stat-row{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px}
.analytics-stat-box{background:rgba(0,0,0,.3);border-radius:10px;padding:14px;text-align:center}
.analytics-stat-val{font-family:var(--display);font-size:1.3rem;font-weight:700}
.analytics-stat-lbl{font-size:.62rem;color:var(--muted2);margin-top:3px}
.analytics-bar-chart{display:flex;align-items:flex-end;gap:6px;height:72px}
.analytics-bar{flex:1;background:linear-gradient(to top,var(--nebula),var(--aqua));border-radius:4px 4px 0 0;opacity:.78}
.analytics-features{display:flex;flex-direction:column;gap:14px}
.analytics-feat{display:flex;align-items:flex-start;gap:14px;background:var(--card);border:1px solid var(--border2);border-radius:16px;padding:18px;backdrop-filter:blur(12px);transition:all .25s}
.analytics-feat:hover{border-color:var(--border);transform:translateX(4px)}
.analytics-feat-icon{font-size:1.4rem;flex-shrink:0;margin-top:2px}
.analytics-feat-title{font-family:var(--display);font-size:.92rem;font-weight:700;margin-bottom:5px}
.analytics-feat-desc{font-size:.8rem;color:var(--muted);line-height:1.55}

/* TESTIMONIALS */
.testi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.testi-card{background:var(--card);border:1px solid var(--border2);border-radius:22px;padding:30px;transition:all .3s;display:flex;flex-direction:column;gap:17px;backdrop-filter:blur(16px)}
.testi-card:hover{border-color:var(--border);transform:translateY(-5px);box-shadow:0 20px 48px rgba(0,0,0,.4)}
.testi-stars{color:var(--gold);font-size:.9rem;letter-spacing:2px}
.testi-quote{color:var(--muted);font-size:.9rem;line-height:1.75;flex:1}
.testi-author{display:flex;align-items:center;gap:12px}
.testi-avatar{width:41px;height:41px;border-radius:50%;background:linear-gradient(135deg,var(--nebula),var(--aqua));display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;flex-shrink:0}
.testi-name{font-size:.875rem;font-weight:600}
.testi-role{font-size:.75rem;color:var(--muted2)}

/* FAQ */
.faq-section{background:var(--void2)}
.faq-list{display:flex;flex-direction:column;gap:12px;max-width:820px}
.faq-item{background:var(--card);border:1px solid var(--border2);border-radius:16px;overflow:hidden;backdrop-filter:blur(14px);transition:border-color .2s}
.faq-item:hover{border-color:rgba(124,92,255,.2)}
.faq-q{padding:20px 24px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:16px;font-size:.95rem;font-weight:600;list-style:none;user-select:none}
.faq-q::-webkit-details-marker{display:none}
.faq-chevron{font-size:.8rem;color:var(--muted2);transition:transform .22s;flex-shrink:0}
details[open] .faq-chevron{transform:rotate(180deg)}
.faq-a{padding:0 24px 20px;color:var(--muted);font-size:.875rem;line-height:1.78}

/* CTA BAND */
.cta-band{background:linear-gradient(135deg,rgba(124,92,255,.14),rgba(0,229,255,.06));border-top:1px solid rgba(124,92,255,.2);border-bottom:1px solid rgba(124,92,255,.2);padding:110px 24px;text-align:center;position:relative;overflow:hidden}
.cta-band h2{font-family:var(--display);font-size:clamp(2rem,4vw,3.2rem);font-weight:700;letter-spacing:-.025em;margin-bottom:18px}
.cta-band p{color:var(--muted);font-size:1.05rem;margin-bottom:42px;max-width:560px;margin-left:auto;margin-right:auto}
.cta-row{display:flex;gap:14px;justify-content:center;flex-wrap:wrap}

/* FOOTER */
.footer{background:var(--void2);border-top:1px solid var(--border2);padding:76px 24px 42px;position:relative}
.footer-inner{max-width:1200px;margin:0 auto}
.footer-top{display:grid;grid-template-columns:2.2fr 1fr 1fr 1fr 1fr;gap:40px;margin-bottom:58px}
.footer-brand-desc{color:var(--muted);font-size:.875rem;line-height:1.75;margin:16px 0 24px;max-width:260px}
.footer-socials{display:flex;gap:10px}
.footer-social{width:37px;height:37px;border-radius:11px;background:var(--card);border:1px solid var(--border2);display:flex;align-items:center;justify-content:center;font-size:16px;transition:all .2s}
.footer-social:hover{border-color:var(--nebula);background:rgba(124,92,255,.13)}
.footer-col h4{font-family:var(--display);font-size:.875rem;font-weight:700;margin-bottom:17px;color:var(--text)}
.footer-links{list-style:none;display:flex;flex-direction:column;gap:11px}
.footer-links a{color:var(--muted);font-size:.85rem;transition:color .2s}
.footer-links a:hover{color:var(--text)}
.footer-bottom{border-top:1px solid var(--border2);padding-top:30px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px}
.footer-copy{color:var(--muted2);font-size:.8rem}
.footer-legal{display:flex;gap:24px}
.footer-legal a{color:var(--muted2);font-size:.8rem}
.footer-legal a:hover{color:var(--muted)}

/* RESPONSIVE */
@media(max-width:1000px){.features-bento{grid-template-columns:repeat(2,1fr)}.feat-card.large{grid-column:span 1}.stats-grid{grid-template-columns:repeat(2,1fr)}.mockups-grid{grid-template-columns:1fr}.testi-grid{grid-template-columns:1fr}.why-grid{grid-template-columns:repeat(2,1fr)}.footer-top{grid-template-columns:1fr 1fr;gap:32px}.workflow-connector{display:none}.workflow-steps{gap:24px;justify-content:flex-start}.resume-flow{grid-template-columns:1fr;gap:40px}.analytics-grid{grid-template-columns:1fr;gap:40px}}
@media(max-width:700px){.features-bento{grid-template-columns:1fr}.why-grid{grid-template-columns:1fr}.lp-nav-links,.lp-nav-actions .btn-ghost,.lp-nav-actions .btn-primary{display:none}.lp-burger{display:flex}}
@media(max-width:480px){.stats-grid{grid-template-columns:repeat(2,1fr);gap:20px}.footer-top{grid-template-columns:1fr}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important}}
`;

// ─── Data ────────────────────────────────────────────────────────────────────
const TRUSTED = ["TechScale","InnovateCorp","DevSprint","ByteForge","NexGen Labs","CloudPeak","AlphaHire","SkillMatrix"];

const WHY = [
  { icon:"⚡", title:"10× Faster Screening", desc:"AI handles the grunt work — resume parsing, question generation, and initial evaluation — so you focus on the final 10%.", bg:"rgba(124,92,255,.15)", bdr:"rgba(124,92,255,.25)" },
  { icon:"🎯", title:"Bias-Free Assessments", desc:"Every candidate gets the same standardised test, the same AI evaluation, the same feedback. No gut-feel, no inconsistency.", bg:"rgba(0,229,255,.12)", bdr:"rgba(0,229,255,.22)" },
  { icon:"🔒", title:"Enterprise-Grade Security", desc:"Fullscreen lock, tab detection, clipboard block, webcam proctoring — every assessment is monitored end-to-end.", bg:"rgba(255,111,165,.12)", bdr:"rgba(255,111,165,.22)" },
];

const FEATURES = [
  { icon:"🧠", title:"AI MCQ Assessments", desc:"Generate intelligent multiple-choice tests tailored to any domain, difficulty, and role in seconds.", bullets:["Auto-generate with GPT-4","Role-based question banks","Randomise & anti-cheat","Instant analytics"], bg:"rgba(124,92,255,.22)", bdr:"rgba(124,92,255,.22)", grad:"linear-gradient(135deg,rgba(124,92,255,.07),transparent)" },
  { icon:"💻", title:"Coding Assessments", desc:"Full in-browser IDE with real-time execution, AI evaluation, and support for 10+ programming languages.", bullets:["Monaco editor experience","Custom test cases","Time & memory limits","AI code feedback"], bg:"rgba(0,229,255,.2)", bdr:"rgba(0,229,255,.22)", grad:"linear-gradient(135deg,rgba(0,229,255,.07),transparent)" },
  { icon:"📄", title:"Resume ATS Analysis", desc:"Upload resumes and get ATS scores, skill gap reports, and AI-written improvement suggestions instantly.", bullets:["ATS score 0–100","Missing keywords report","JD matching","AI suggestions"], bg:"rgba(52,232,158,.2)", bdr:"rgba(52,232,158,.22)", grad:"linear-gradient(135deg,rgba(52,232,158,.07),transparent)" },
  { icon:"🎙️", title:"AI Mock Interviews", large:true, desc:"Conversational AI conducts full technical and behavioural interviews, adapts in real-time, and generates detailed feedback reports.", bullets:["Adaptive question flow","Real-time transcription","Role-specific personas","Score + feedback report"], bg:"rgba(255,111,165,.2)", bdr:"rgba(255,111,165,.22)", grad:"linear-gradient(135deg,rgba(255,111,165,.07),transparent)" },
  { icon:"👥", title:"Candidate Management", desc:"Centralise every candidate's journey — invitations, test status, scores — in one clean dashboard.", bullets:["Bulk email invites","Progress tracking","Score comparison","Export PDF/CSV"], bg:"rgba(255,200,87,.2)", bdr:"rgba(255,200,87,.22)", grad:"linear-gradient(135deg,rgba(255,200,87,.07),transparent)" },
  { icon:"📊", title:"Performance Analytics", desc:"Rich dashboards with score distributions, topic breakdowns, and AI-generated hiring insights.", bullets:["Score charts","Topic analysis","Batch comparison","AI insights"], bg:"rgba(94,234,212,.2)", bdr:"rgba(94,234,212,.22)", grad:"linear-gradient(135deg,rgba(94,234,212,.07),transparent)" },
];

const WORKFLOW = [
  { icon:"📋", label:"Create Test" },
  { icon:"✉️", label:"Invite Candidates" },
  { icon:"🔑", label:"Candidate Login" },
  { icon:"🧪", label:"Take Assessment" },
  { icon:"🤖", label:"AI Evaluation" },
  { icon:"📊", label:"Reports Ready" },
  { icon:"🎯", label:"Hire Faster" },
];

const RESUME_STEPS = [
  { icon:"📄", num:"01", title:"Upload Resume",  desc:"PDF or DOCX — parsed instantly by our AI engine" },
  { icon:"🔍", num:"02", title:"ATS Score",      desc:"Get a 0–100 ATS compatibility score in seconds" },
  { icon:"🧩", num:"03", title:"Missing Skills", desc:"See exactly which keywords and skills are missing" },
  { icon:"🤖", num:"04", title:"AI Suggestions", desc:"Actionable rewrites for every weak section" },
  { icon:"✨", num:"05", title:"Improved Resume", desc:"Apply with a resume that actually gets through" },
];

const ANALYTICS_FEATURES = [
  { icon:"📈", title:"Score Distribution",    desc:"See the full bell curve of candidate performance across every test batch." },
  { icon:"🗺️", title:"Topic Breakdowns",      desc:"Identify which topics candidates struggled with — and why." },
  { icon:"⏱️", title:"Time-Spent Analysis",   desc:"Understand where candidates spent the most time during assessments." },
  { icon:"🏆", title:"Leaderboards",           desc:"Auto-ranked candidate tables by score, completion time, and accuracy." },
];

const TESTIMONIALS = [
  { stars:"★★★★★", quote:"Revogen transformed how we assess engineering talent. What took two weeks now happens in 48 hours. The AI resume matching saved us 30 hours last month alone.", initials:"AK", name:"Ananya Kapoor", role:"Head of Engineering Recruitment · Infosys" },
  { stars:"★★★★★", quote:"The coding sandbox is production-grade. Candidates get a real IDE experience and we get instant, unbiased evaluations. Our offer acceptance rate jumped 22% since switching.", initials:"RS", name:"Rahul Sharma", role:"CTO · TechScale Ventures" },
  { stars:"★★★★★", quote:"As a startup we can't afford a full talent team. Revogen's AI mock interviews screen 80% of applicants automatically. We only talk to candidates who've already proven themselves.", initials:"PM", name:"Priya Menon", role:"Founder · DevSprint Labs" },
];

const FAQS = [
  { q:"Is Revogen free to use?", a:"Revogen uses a Revo Credits system. You get free credits to start — enough for your first few assessments. Additional credits can be purchased in packs." },
  { q:"How do I invite candidates?", a:"After creating a test in the admin dashboard, click 'Invite', enter candidate emails, and they receive a branded email with a unique test link. Bulk CSV upload is also supported." },
  { q:"What coding languages are supported?", a:"Python, JavaScript, TypeScript, Java, C, C++, Go, Rust, Ruby, PHP, Kotlin, and Swift — with more being added regularly." },
  { q:"How does AI resume analysis work?", a:"Upload a PDF or DOCX. Our AI parses it, extracts skills, scores it against ATS criteria, and generates specific improvement suggestions. You can also paste a job description for a match score." },
  { q:"Is my data secure?", a:"All data is encrypted in transit and at rest. Candidate data is never shared with third parties. You can request deletion anytime." },
  { q:"Can I use my own questions?", a:"Yes — write your own MCQ or coding problems, use AI generation, or mix both. You can also build from the curated question bank." },
];

const AVATAR_GRADS: [string,string][] = [["#7C5CFF","#A78BFA"],["#00E5FF","#5EEAD4"],["#FF6FA5","#FFA8C9"],["#34E89E","#6EF0BC"],["#FFC857","#FFE0A3"]];

// ─── Main Component ──────────────────────────────────────────────────────────
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrollY } = useScroll();

  // Parallax for hero orbs
  const orbY1 = useTransform(scrollY, [0, 600], [0, -80]);
  const orbY2 = useTransform(scrollY, [0, 600], [0, -50]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const NAV_LINKS = [
    { href:"/features",    label:"Features"    },
    { href:"/solutions",   label:"Solutions"   },
    { href:"/assessments", label:"Assessments" },
    { href:"/resume-ai",   label:"Resume AI"   },
    { href:"/about",       label:"About"       },
    { href:"/contact",     label:"Contact"     },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS + CSS2 + CSS3 }} />
      <SpaceBackground />

      <div className="page-wrap">

        {/* ── 1. NAV ── */}
        <nav className={`lp-nav${scrolled ? " sc" : ""}`}>
          <div className="lp-nav-inner">
            <Link href="/" className="lp-logo">
              <img src="/revogen-icon.svg" alt="Revogen" width={34} height={34} style={{ borderRadius:10 }} />
              Revogen
            </Link>
            <ul className="lp-nav-links">
              {NAV_LINKS.map(l => <li key={l.href}><Link href={l.href}>{l.label}</Link></li>)}
            </ul>
            <div className="lp-nav-actions">
              <Link href="/login"               className="btn-ghost">Login</Link>
              <Link href="/register/candidate" className="btn-primary">Get Started →</Link>
              <button className={`lp-burger${menuOpen ? " open" : ""}`} onClick={() => setMenuOpen(p=>!p)} aria-label="Toggle menu">
                <span /><span /><span />
              </button>
            </div>
          </div>
        </nav>

        <AnimatePresence>
          {menuOpen && (
            <motion.div className="lp-drawer" initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-12 }} transition={{ duration:0.18 }}>
              {NAV_LINKS.map(l => <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}>{l.label}</Link>)}
              <div className="lp-drawer-sep" />
              <div className="lp-drawer-btns">
                <Link href="/login"               className="btn-ghost">Login</Link>
                <Link href="/register/candidate" className="btn-primary">Get Started →</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── 2. HERO ── */}
        <section className="hero">
          {/* Floating shapes — parallax */}
          <motion.div className="hero-floating" style={{ width:170, height:170, top:"14%", left:"9%", background:"radial-gradient(circle,rgba(124,92,255,.18),transparent)", y:orbY1 }} animate={{ y:[0,-22,0] }} transition={{ duration:11, repeat:Infinity, ease:"easeInOut" }} />
          <motion.div className="hero-floating" style={{ width:130, height:130, top:"68%", right:"11%", background:"radial-gradient(circle,rgba(0,229,255,.14),transparent)", y:orbY2 }} animate={{ y:[0,-18,0] }} transition={{ duration:9, repeat:Infinity, ease:"easeInOut", delay:3 }} />
          <motion.div className="hero-floating" style={{ width:90, height:90, top:"48%", left:"16%", background:"radial-gradient(circle,rgba(255,111,165,.12),transparent)" }} animate={{ y:[0,-14,0] }} transition={{ duration:13, repeat:Infinity, ease:"easeInOut", delay:6 }} />
          <div className="hero-ring" style={{ width:520, height:520, top:"8%", left:"50%", transform:"translateX(-50%)" }} />
          <div className="hero-ring" style={{ width:760, height:760, top:"2%", left:"50%", transform:"translateX(-50%)", opacity:.5 }} />

          <div style={{ position:"relative", zIndex:1 }}>
            <motion.div className="hero-badge" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:.6 }}>
              <span className="hero-badge-dot" />
              AI-Powered Hiring &amp; Technical Assessment Platform
            </motion.div>

            <motion.h1 className="hero-h1" initial={{ opacity:0, y:28 }} animate={{ opacity:1, y:0 }} transition={{ duration:.7, delay:.08 }}>
              Hire Smarter with<br /><span className="grad">AI-Driven Assessments</span>
            </motion.h1>

            <motion.p className="hero-sub" initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:.7, delay:.16 }}>
              Create coding tests, evaluate candidates, analyse resumes, and run AI mock interviews — all in one platform. Find top engineering talent, faster.
            </motion.p>

            <motion.div className="hero-ctas" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:.6, delay:.24 }}>
              <Link href="/register/candidate" className="btn-hero-primary">Get Started Free <span>→</span></Link>
              <Link href="/features" className="btn-hero-secondary"><span>▶</span> Explore Platform</Link>
            </motion.div>

            <motion.div className="hero-trusted" initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:.6, delay:.36 }}>
              <div className="hero-avatars">
                {["AK","RS","PM","VR","NK"].map((ini,i) => {
                  const [c1,c2] = AVATAR_GRADS[i % AVATAR_GRADS.length];
                  return <div key={ini} className="hero-avatar" style={{ background:`linear-gradient(135deg,${c1},${c2})` }}>{ini}</div>;
                })}
              </div>
              <span style={{ color:"var(--muted2)", fontSize:".8rem" }}>Trusted by 500+ companies</span>
            </motion.div>
          </div>
        </section>


        {/* ── 3. TRUSTED BY ── */}
        <div className="trusted-band">
          <div className="trusted-inner">
            <FadeIn><div className="trusted-label">Trusted by fast-growing teams</div></FadeIn>
            <div className="trusted-logos">
              {TRUSTED.map((name, i) => (
                <FadeIn key={name} delay={i * 0.5}>
                  <motion.div className="trusted-logo" whileHover={{ scale:1.04 }} transition={{ type:"spring", stiffness:400 }}>{name}</motion.div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>

        {/* ── 4. STATS (count-up) ── */}
        <div className="stats-band">
          <div className="stats-grid">
            {[["500", "+", "Questions in Bank"],["100", "+", "Coding Problems"],["10", "+", "Assessment Types"],["94", "%", "Completion Rate"]].map(([n,s,l], i) => (
              <FadeUp key={l} delay={i}>
                <div className="stat-num"><CountUp target={parseInt(n)} suffix={s} /></div>
                <div className="stat-label">{l}</div>
              </FadeUp>
            ))}
          </div>
        </div>

        {/* ── 5. WHY REVOGEN ── */}
        <section className="section">
          <div className="s-inner">
            <div className="s-header">
              <FadeUp><span className="s-label">Why Revogen</span></FadeUp>
              <FadeUp delay={1}><h2 className="s-h2">Replace your spreadsheet hiring process</h2></FadeUp>
              <FadeUp delay={2}><p className="s-sub">One unified platform that removes bias, saves time, and surfaces your strongest candidates.</p></FadeUp>
            </div>
            <div className="why-grid">
              {WHY.map((w, i) => (
                <FadeUp key={w.title} delay={i}>
                  <motion.div className="why-card" whileHover={{ y:-6, boxShadow:"0 24px 56px rgba(0,0,0,.45)" }} transition={{ type:"spring", stiffness:300 }}>
                    <div className="why-card-icon" style={{ "--icon-bg":w.bg, "--icon-bdr":w.bdr } as React.CSSProperties}>{w.icon}</div>
                    <h3>{w.title}</h3>
                    <p>{w.desc}</p>
                  </motion.div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* ── 6. FEATURES ── */}
        <section className="section" style={{ background:"var(--void2)" }} id="features">
          <div className="s-inner">
            <div className="s-header">
              <FadeUp><span className="s-label">Platform Features</span></FadeUp>
              <FadeUp delay={1}><h2 className="s-h2">Everything you need to evaluate talent</h2></FadeUp>
              <FadeUp delay={2}><p className="s-sub">From AI-written questions to live code execution — Revogen handles the full assessment lifecycle.</p></FadeUp>
            </div>
            <div className="features-bento">
              {FEATURES.map((f, i) => (
                <FadeUp key={f.title} delay={i * 0.5}>
                  <motion.div
                    className={`feat-card${f.large ? " large" : ""}`}
                    style={{ "--card-grad":f.grad, "--icon-bg":f.bg, "--icon-bdr":f.bdr } as React.CSSProperties}
                    whileHover={{ y:-6 }}
                    transition={{ type:"spring", stiffness:280 }}
                  >
                    <div className="feat-icon">{f.icon}</div>
                    <h3>{f.title}</h3>
                    <p>{f.desc}</p>
                    <ul className="feat-bullets">{f.bullets.map(b => <li key={b}>{b}</li>)}</ul>
                  </motion.div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>


        {/* ── 7. PLATFORM PREVIEW ── */}
        <section className="section">
          <div className="s-inner">
            <div className="s-header">
              <FadeUp><span className="s-label">Platform Preview</span></FadeUp>
              <FadeUp delay={1}><h2 className="s-h2">A workspace your team will actually love</h2></FadeUp>
              <FadeUp delay={2}><p className="s-sub">Intuitive dashboards, clean interfaces, and actionable data at every step.</p></FadeUp>
            </div>
            <div className="mockups-grid">
              {/* Admin Dashboard */}
              <FadeUp delay={0}>
                <motion.div className="mockup-card" whileHover={{ y:-8, boxShadow:"0 30px 64px rgba(0,0,0,.5)" }} transition={{ type:"spring", stiffness:260 }}>
                  <div className="mockup-topbar">
                    <div className="mockup-dot" style={{ background:"#FF5F57" }} />
                    <div className="mockup-dot" style={{ background:"#FEBC2E" }} />
                    <div className="mockup-dot" style={{ background:"#28C840" }} />
                    <div className="mockup-title-bar">revogen.ai/admin</div>
                  </div>
                  <div className="mockup-body">
                    <div style={{ display:"grid", gridTemplateColumns:"72px 1fr", gap:12, height:"100%" }}>
                      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                        {[true,false,false,false,false].map((a,i) => <div key={i} style={{ height:28, borderRadius:7, background:a?"rgba(124,92,255,.28)":"rgba(255,255,255,.03)" }} />)}
                      </div>
                      <div>
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:12 }}>
                          {[{v:"142",l:"Candidates",c:"var(--nebula)"},{v:"28",l:"Active Tests",c:"var(--aqua)"},{v:"94%",l:"Completion",c:"var(--green)"}].map(s => (
                            <div key={s.l} style={{ background:"rgba(0,0,0,.3)", borderRadius:9, padding:"11px 10px" }}>
                              <div style={{ fontFamily:"var(--display)", fontSize:"1.1rem", fontWeight:700, color:s.c }}>{s.v}</div>
                              <div style={{ fontSize:".6rem", color:"var(--muted2)", marginTop:2 }}>{s.l}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ display:"flex", alignItems:"flex-end", gap:5, height:56 }}>
                          {[40,65,55,80,72,90,68,75,85,95].map((h,i) => <div key={i} style={{ flex:1, height:`${h}%`, background:"linear-gradient(to top,var(--nebula),var(--aqua))", borderRadius:"4px 4px 0 0", opacity:.78 }} />)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mockup-card-label"><span className="mockup-label-name">Admin Dashboard</span><span className="mockup-label-badge">Live</span></div>
                </motion.div>
              </FadeUp>

              {/* Code Editor */}
              <FadeUp delay={1}>
                <motion.div className="mockup-card" whileHover={{ y:-8, boxShadow:"0 30px 64px rgba(0,0,0,.5)" }} transition={{ type:"spring", stiffness:260 }}>
                  <div className="mockup-topbar">
                    <div className="mockup-dot" style={{ background:"#FF5F57" }} />
                    <div className="mockup-dot" style={{ background:"#FEBC2E" }} />
                    <div className="mockup-dot" style={{ background:"#28C840" }} />
                    <div className="mockup-title-bar">Two Sum · Python · ⏱ 18:42</div>
                  </div>
                  <div className="mockup-body">
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      {[{c:"rgba(124,92,255,.4)",w:"30%"},{c:"rgba(0,229,255,.28)",w:"60%"},{c:"rgba(255,255,255,.04)",w:"45%"},{c:"rgba(52,232,158,.24)",w:"50%"},{c:"rgba(255,255,255,.04)",w:"70%"},{c:"rgba(0,229,255,.28)",w:"60%"},{c:"rgba(124,92,255,.4)",w:"28%"}].map((l,i) => <div key={i} style={{ height:11, borderRadius:4, background:l.c, width:l.w }} />)}
                      <div style={{ display:"flex", gap:8, marginTop:8 }}>
                        <div style={{ height:26, borderRadius:8, background:"linear-gradient(135deg,var(--green),#1FA876)", flex:1, opacity:.85 }} />
                        <div style={{ height:26, borderRadius:8, background:"rgba(255,255,255,.04)", flex:2 }} />
                      </div>
                    </div>
                  </div>
                  <div className="mockup-card-label"><span className="mockup-label-name">Coding Platform</span><span className="mockup-label-badge">10+ Languages</span></div>
                </motion.div>
              </FadeUp>

              {/* Reports */}
              <FadeUp delay={2}>
                <motion.div className="mockup-card" whileHover={{ y:-8, boxShadow:"0 30px 64px rgba(0,0,0,.5)" }} transition={{ type:"spring", stiffness:260 }}>
                  <div className="mockup-topbar">
                    <div className="mockup-dot" style={{ background:"#FF5F57" }} />
                    <div className="mockup-dot" style={{ background:"#FEBC2E" }} />
                    <div className="mockup-dot" style={{ background:"#28C840" }} />
                    <div className="mockup-title-bar">Assessment Report · Batch #7</div>
                  </div>
                  <div className="mockup-body">
                    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                      {[{n:"Arjun V.",s:94,c:"var(--green)"},{n:"Sneha R.",s:88,c:"var(--aqua)"},{n:"Rohan K.",s:76,c:"var(--nebula)"},{n:"Meera P.",s:61,c:"var(--gold)"}].map(c => (
                        <div key={c.n} style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <div style={{ width:26, height:26, borderRadius:"50%", background:`linear-gradient(135deg,${c.c},transparent)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, flexShrink:0 }}>{c.n[0]}</div>
                          <div style={{ flex:1, background:"rgba(0,0,0,.3)", borderRadius:6, height:10, overflow:"hidden" }}>
                            <div style={{ height:"100%", width:`${c.s}%`, background:`linear-gradient(90deg,${c.c},transparent)`, borderRadius:6 }} />
                          </div>
                          <span style={{ fontSize:".7rem", fontWeight:700, color:c.c, width:28, textAlign:"right" }}>{c.s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mockup-card-label"><span className="mockup-label-name">Analytics &amp; Reports</span><span className="mockup-label-badge">AI Insights</span></div>
                </motion.div>
              </FadeUp>
            </div>
          </div>
        </section>


        {/* ── 8. ASSESSMENT PROCESS ── */}
        <section className="section" style={{ background:"var(--void2)" }}>
          <div className="s-inner">
            <div className="s-header" style={{ textAlign:"center" }}>
              <FadeUp><span className="s-label" style={{ justifyContent:"center" }}>Assessment Process</span></FadeUp>
              <FadeUp delay={1}><h2 className="s-h2">From test creation to hire — in one flow</h2></FadeUp>
              <FadeUp delay={2}><p className="s-sub" style={{ margin:"0 auto" }}>A unified pipeline that keeps recruiters, candidates, and AI in perfect sync.</p></FadeUp>
            </div>
            <div className="workflow-steps">
              {WORKFLOW.map((step, i) => (
                <div key={step.label} style={{ display:"contents" }}>
                  <FadeUp delay={i * 0.5}>
                    <div className="workflow-step">
                      <motion.div className="workflow-icon-wrap" whileHover={{ scale:1.1 }} transition={{ type:"spring", stiffness:400 }}>{step.icon}</motion.div>
                      <span className="workflow-step-num">{String(i+1).padStart(2,"0")}</span>
                      <span className="workflow-step-label">{step.label}</span>
                    </div>
                  </FadeUp>
                  {i < WORKFLOW.length - 1 && (
                    <div className="workflow-connector">
                      <div className="connector-line">
                        <div className="connector-dot" style={{ animationDelay:`${i*0.4}s` }} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 9. RESUME AI ── */}
        <section className="section">
          <div className="s-inner">
            <div className="resume-flow">
              {/* Left — steps */}
              <div>
                <FadeUp><span className="s-label">Resume AI</span></FadeUp>
                <FadeUp delay={1}><h2 className="s-h2">From upload to<br />a better resume</h2></FadeUp>
                <FadeUp delay={2}><p className="s-sub" style={{ marginBottom:40 }}>Our AI parses your resume the same way ATS systems do — and tells you exactly what to fix, with specific rewrites.</p></FadeUp>
                <div className="resume-pipeline">
                  {RESUME_STEPS.map((s, i) => (
                    <FadeUp key={s.num} delay={i * 0.5}>
                      <div className="resume-step">
                        <div className="resume-step-line" />
                        <div className="resume-step-icon">{s.icon}</div>
                        <div>
                          <div className="resume-step-num">{s.num}</div>
                          <div className="resume-step-title">{s.title}</div>
                          <div className="resume-step-desc">{s.desc}</div>
                        </div>
                      </div>
                    </FadeUp>
                  ))}
                </div>
                <FadeUp delay={6}>
                  <Link href="/login" className="btn-hero-primary" style={{ display:"inline-flex", marginTop:32 }}>Analyse My Resume →</Link>
                </FadeUp>
              </div>

              {/* Right — score card */}
              <FadeUp delay={2}>
                <div className="resume-card">
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:22 }}>
                    <span style={{ fontFamily:"var(--display)", fontSize:"1rem", fontWeight:700 }}>Resume Analysis</span>
                    <span style={{ background:"rgba(52,232,158,.12)", border:"1px solid rgba(52,232,158,.25)", borderRadius:100, padding:"4px 12px", fontSize:".72rem", fontWeight:700, color:"var(--green)" }}>✓ AI Analysed</span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:22, marginBottom:22 }}>
                    <div className="resume-score-ring">
                      <div className="resume-score-inner">
                        <span className="resume-score-num">82</span>
                        <span className="resume-score-lbl">ATS Score</span>
                      </div>
                    </div>
                    <div style={{ flex:1, display:"flex", flexDirection:"column", gap:9 }}>
                      {[{l:"Keywords",p:88,c:"var(--green)"},{l:"Formatting",p:76,c:"var(--aqua)"},{l:"Experience",p:91,c:"var(--nebula2)"},{l:"Skills",p:65,c:"var(--gold)"}].map(r => (
                        <div key={r.l} style={{ display:"flex", alignItems:"center", gap:9, fontSize:".78rem" }}>
                          <span style={{ color:"var(--muted)", width:80, flexShrink:0 }}>{r.l}</span>
                          <div className="resume-bar"><div className="resume-bar-fill" style={{ width:`${r.p}%`, background:r.c }} /></div>
                          <span style={{ color:"var(--text)", fontWeight:600, width:30, textAlign:"right" }}>{r.p}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="resume-missing">
                    <div className="resume-missing-title">⚠️ Missing Keywords</div>
                    <div className="resume-tags">
                      {["Docker","Kubernetes","GraphQL","CI/CD","AWS"].map(t => <span key={t} className="resume-tag">{t}</span>)}
                    </div>
                  </div>
                  <div style={{ background:"rgba(124,92,255,.08)", border:"1px solid rgba(124,92,255,.18)", borderRadius:12, padding:14, marginTop:10 }}>
                    <div style={{ fontSize:".78rem", fontWeight:700, color:"var(--nebula2)", marginBottom:8 }}>🤖 AI Suggestions</div>
                    {["Add Docker/Kubernetes to skills section","Quantify impact — replace 'worked on' with metrics","Include CI/CD pipeline experience from Project X"].map(s => (
                      <div key={s} style={{ fontSize:".76rem", color:"var(--muted)", padding:"5px 0", borderBottom:"1px solid rgba(255,255,255,.05)", display:"flex", gap:8 }}>
                        <span style={{ color:"var(--nebula2)" }}>→</span>{s}
                      </div>
                    ))}
                  </div>
                </div>
              </FadeUp>
            </div>
          </div>
        </section>


        {/* ── 10. ANALYTICS ── */}
        <section className="section" style={{ background:"var(--void2)" }}>
          <div className="s-inner">
            <div className="analytics-grid">
              <div>
                <FadeUp><span className="s-label">Analytics</span></FadeUp>
                <FadeUp delay={1}><h2 className="s-h2">Turn scores into hiring decisions</h2></FadeUp>
                <FadeUp delay={2}><p className="s-sub" style={{ marginBottom:36 }}>Rich dashboards that show performance trends, topic breakdowns, and candidate comparisons — automatically.</p></FadeUp>
                <div className="analytics-features">
                  {ANALYTICS_FEATURES.map((f, i) => (
                    <FadeUp key={f.title} delay={i * 0.5}>
                      <motion.div className="analytics-feat" whileHover={{ x:4 }} transition={{ type:"spring", stiffness:300 }}>
                        <span className="analytics-feat-icon">{f.icon}</span>
                        <div>
                          <div className="analytics-feat-title">{f.title}</div>
                          <div className="analytics-feat-desc">{f.desc}</div>
                        </div>
                      </motion.div>
                    </FadeUp>
                  ))}
                </div>
              </div>
              <FadeUp delay={2}>
                <div className="analytics-card">
                  <div style={{ fontFamily:"var(--display)", fontSize:".78rem", fontWeight:700, color:"var(--nebula2)", textTransform:"uppercase", letterSpacing:".08em", marginBottom:16 }}>Batch #7 · 48 Candidates</div>
                  <div className="analytics-stat-row">
                    {[{v:"84%",l:"Avg Score",c:"var(--green)"},{v:"22m",l:"Avg Time",c:"var(--aqua)"},{v:"94%",l:"Completion",c:"var(--nebula2)"}].map(s => (
                      <div key={s.l} className="analytics-stat-box">
                        <div className="analytics-stat-val" style={{ color:s.c }}>{s.v}</div>
                        <div className="analytics-stat-lbl">{s.l}</div>
                      </div>
                    ))}
                  </div>
                  <div className="analytics-bar-chart" style={{ marginBottom:16 }}>
                    {[40,62,55,80,72,90,68,75,85,95,58,70].map((h,i) => <div key={i} className="analytics-bar" style={{ height:`${h}%` }} />)}
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {[{n:"Arjun V.",s:94,c:"var(--green)"},{n:"Sneha R.",s:88,c:"var(--aqua)"},{n:"Rohan K.",s:76,c:"var(--nebula)"},{n:"Meera P.",s:61,c:"var(--gold)"}].map(c => (
                      <div key={c.n} style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ width:24, height:24, borderRadius:"50%", background:`linear-gradient(135deg,${c.c},transparent)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, flexShrink:0 }}>{c.n[0]}</div>
                        <div style={{ flex:1, background:"rgba(0,0,0,.3)", borderRadius:5, height:8, overflow:"hidden" }}>
                          <div style={{ height:"100%", width:`${c.s}%`, background:`linear-gradient(90deg,${c.c},transparent)`, borderRadius:5 }} />
                        </div>
                        <span style={{ fontSize:".7rem", fontWeight:700, color:c.c, width:24, textAlign:"right" }}>{c.s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </FadeUp>
            </div>
          </div>
        </section>

        {/* ── 11. TESTIMONIALS ── */}
        <section className="section">
          <div className="s-inner">
            <div className="s-header">
              <FadeUp><span className="s-label">Testimonials</span></FadeUp>
              <FadeUp delay={1}><h2 className="s-h2">Teams that ship faster with Revogen</h2></FadeUp>
            </div>
            <div className="testi-grid">
              {TESTIMONIALS.map((t, i) => (
                <FadeUp key={t.name} delay={i * 0.5}>
                  <motion.div className="testi-card" whileHover={{ y:-6 }} transition={{ type:"spring", stiffness:280 }}>
                    <span className="testi-stars">{t.stars}</span>
                    <p className="testi-quote">&ldquo;{t.quote}&rdquo;</p>
                    <div className="testi-author">
                      <div className="testi-avatar">{t.initials}</div>
                      <div><div className="testi-name">{t.name}</div><div className="testi-role">{t.role}</div></div>
                    </div>
                  </motion.div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* ── 12. FAQ ── */}
        <section className="section faq-section">
          <div className="s-inner">
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1.4fr", gap:64, alignItems:"start" }}>
              <div>
                <FadeUp><span className="s-label">FAQ</span></FadeUp>
                <FadeUp delay={1}><h2 className="s-h2">Common questions</h2></FadeUp>
                <FadeUp delay={2}><p className="s-sub" style={{ marginBottom:32 }}>Can&apos;t find what you&apos;re looking for? <Link href="/contact" style={{ color:"var(--nebula2)" }}>Contact us →</Link></p></FadeUp>
              </div>
              <FadeUp delay={1}>
                <div className="faq-list">
                  {FAQS.map((f, i) => (
                    <details key={i} className="faq-item">
                      <summary className="faq-q">{f.q}<span className="faq-chevron">▼</span></summary>
                      <div className="faq-a">{f.a}</div>
                    </details>
                  ))}
                </div>
              </FadeUp>
            </div>
          </div>
        </section>


        {/* ── 13. CTA BAND ── */}
        <div className="cta-band">
          {/* Gradient blur blobs */}
          <div style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
            <motion.div style={{ position:"absolute", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,rgba(124,92,255,.22),transparent)", top:"-20%", left:"10%", filter:"blur(40px)" }} animate={{ x:[0,30,0], y:[0,-20,0] }} transition={{ duration:12, repeat:Infinity, ease:"easeInOut" }} />
            <motion.div style={{ position:"absolute", width:320, height:320, borderRadius:"50%", background:"radial-gradient(circle,rgba(0,229,255,.16),transparent)", top:"30%", right:"8%", filter:"blur(40px)" }} animate={{ x:[0,-20,0], y:[0,20,0] }} transition={{ duration:9, repeat:Infinity, ease:"easeInOut", delay:3 }} />
          </div>
          <div style={{ position:"relative", zIndex:1 }}>
            <FadeUp><h2>Ready to transform your hiring?</h2></FadeUp>
            <FadeUp delay={1}><p>Join 500+ companies already using Revogen to find top engineering talent — faster, fairer, and smarter.</p></FadeUp>
            <FadeUp delay={2}>
              <div className="cta-row">
                <motion.div whileHover={{ scale:1.03 }} whileTap={{ scale:.97 }}><Link href="/register/candidate" className="btn-hero-primary">Start Free Today →</Link></motion.div>
                <motion.div whileHover={{ scale:1.03 }} whileTap={{ scale:.97 }}><Link href="/contact" className="btn-hero-secondary">Talk to Sales</Link></motion.div>
              </div>
            </FadeUp>
          </div>
        </div>

        {/* ── 14. FOOTER ── */}
        <footer className="footer">
          <div className="footer-inner">
            <div className="footer-top">
              {/* Brand */}
              <div>
                <Link href="/" className="lp-logo" style={{ marginBottom:0 }}>
                  <img src="/revogen-icon.svg" alt="Revogen" width={32} height={32} style={{ borderRadius:9 }} />
                  Revogen AI
                </Link>
                <p className="footer-brand-desc">The AI-powered technical assessment platform trusted by engineering teams. Build better hiring pipelines, faster.</p>
                <div className="footer-socials">
                  {[["🐙","https://github.com/revogen-ai"],["💼","https://linkedin.com/company/revogen"],["🐦","https://twitter.com/revogenai"],["📧","mailto:support@revogen.ai"]].map(([icon,href]) => (
                    <a key={String(href)} className="footer-social" href={String(href)} target="_blank" rel="noreferrer">{icon}</a>
                  ))}
                </div>
              </div>

              {/* Quick Links */}
              <div className="footer-col">
                <h4>Quick Links</h4>
                <ul className="footer-links">
                  <li><Link href="/">Homepage</Link></li>
                  <li><Link href="/features">Features</Link></li>
                  <li><Link href="/solutions">Solutions</Link></li>
                  <li><Link href="/assessments">Assessments</Link></li>
                  <li><Link href="/resume-ai">Resume AI</Link></li>
                </ul>
              </div>

              {/* Resources */}
              <div className="footer-col">
                <h4>Resources</h4>
                <ul className="footer-links">
                  <li><a href="#">Documentation</a></li>
                  <li><a href="https://github.com/revogen-ai" target="_blank" rel="noreferrer">GitHub</a></li>
                  <li><Link href="/contact">Support</Link></li>
                  <li><a href="#">Changelog</a></li>
                </ul>
              </div>

              {/* Support */}
              <div className="footer-col">
                <h4>Support</h4>
                <ul className="footer-links">
                  <li><Link href="/contact">Contact Us</Link></li>
                  <li><Link href="/about">About</Link></li>
                  <li><a href="mailto:support@revogen.ai">Email Support</a></li>
                  <li><a href="mailto:enterprise@revogen.ai">Enterprise</a></li>
                </ul>
              </div>

              {/* Legal */}
              <div className="footer-col">
                <h4>Legal</h4>
                <ul className="footer-links">
                  <li><a href="#">Privacy Policy</a></li>
                  <li><a href="#">Terms of Service</a></li>
                  <li><a href="#">Cookie Policy</a></li>
                  <li><a href="#">Security</a></li>
                </ul>
              </div>
            </div>

            <div className="footer-bottom">
              <span className="footer-copy">© {new Date().getFullYear()} Revogen AI. All rights reserved. · Made with ❤️ in Hyderabad, India</span>
              <div className="footer-legal">
                <a href="#">Privacy</a>
                <a href="#">Terms</a>
                <a href="#">Cookies</a>
              </div>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
