# Hyperframes Composition Brief: Livecheck

## Objective
Create a short launch-style brag video for Livecheck — a productized rescue layer for marketing agencies that audits and auto-patches AI-built websites.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 20 seconds

## Source Material
- Project root: D:\Ibrahim106\Desktop\livecheck
- Primary files read: website/index.html, website/src/index.css, website/src/pages/Landing.tsx, website/src/pages/NewAudit.tsx, website/src/pages/Dashboard.tsx, website/src/components/landing/Hero.tsx, website/src/components/landing/ProblemSection.tsx, website/src/components/landing/HowItWorks.tsx, website/src/components/landing/StatsBar.tsx
- Product name: Livecheck
- Tagline / strongest claim: "Your AI website builder gets you 80% there. We close the last mile."
- Key UI or visual moment to recreate: The audit results card with score bar (0-100) and cascading PASS/WARN/FAIL status badges for SSL, DNS, SEO, Mobile checks
- Copy that must appear verbatim:
  - "Your AI website builder gets you 80% there."
  - "We close the last mile."
  - "1,240+ AI-built sites rescued"
  - "80% auto-patched before human review"
  - "Livecheck — Last-Mile Rescue for AI-Built Websites"

## Creative Direction
- Tone preset: default
- Creative direction: playful but credible agency tool — the problem (AI breaks things at launch) is genuinely funny, but the product is serious
- Interpretation: Comfortable pacing with room for each moment to breathe. Clean transitions, readable type, and the product's own dark emerald palette. Humor comes from the problem statement, not from trying to be funny.
- Angle: AI website builders ship fast — then break at launch. Livecheck catches what broke and fixes most of it before a human ever looks. The 20% that's left is where agencies burn billable hours. Livecheck turns that chaos into a productized pipeline.
- Hook: The stats "1,240+" slam in with emerald glow — numbers-first, scale before product
- Outro / punchline: "80% auto-patched before a human ever looks." Then product name + tagline.
- Avoid:
  - Generic SaaS language ("streamline your workflow")
  - Abstract filler visuals (color washes, particle systems)
  - Unrelated visual redesign — use the project's actual dark emerald palette

## Visual Identity
- Background: #030712 (deep navy-black)
- Text: #f1f5f9 (light slate)
- Accent: #06d6a0 (emerald green) — primary action color
- Secondary accent: #60a5fa (blue) — secondary elements
- Muted text: #94a3b8
- Display font: Inter, weight 800
- Body font: Inter, weight 400-500
- Visual references from the project: dark background with radial emerald/blue gradient glow, subtle grid overlay, audit results card with score bar and status badges, intake form with green CTA button

## Storyboard
Use the storyboard in `brag-output/brag-plan.md` as the creative contract.

Scene summary:
1. Hook: The Problem in Numbers — 3s — "1,240+" slams in, "AI-built sites rescued" fades below
2. The Concept: "80% There" — 4s — Three-beat text reveal: small setup, large emerald "80% there.", white "We close the last mile."
3. The Flow: Intake Form — 4s — Recreated form with URL field, client name, green "Run Website Scan →" button with simulated click
4. The Scan: Working — 3s — Pulsing emerald scan icon, "Scanning website..." with URL
5. The Payoff: Results — 4s — Score bar fills 0→81, four check badges cascade: SSL PASS, DNS PASS, SEO WARN, Mobile PASS
6. Outro: Name + Tagline — 2s — "Livecheck" in emerald gradient, tagline below

## Audio
- Audio role: warm, modern electronic bed — clean and professional but not sterile
- Audio arc: music starts low at the hook, builds through the scan flow, peaks at the results payoff, fades under the outro
- Music: happy-beats-business-moves-vol-1-by-ende-dot-app.mp3
- Music treatment: fade in over 0.3s, volume at 0.35, gentle fade out over final 1s
- Music cue guidance: detect at composition via hyperframes beats — no bundled preset for this track
- Audio-reactive treatment: subtle; use music RMS/bass to make the emerald glow and score bar presence breathe. No waveform/equalizer visuals.
- Audio-coupled moments:
  - Scene 1 (Hook) — stat number slams with impact/impactSoft_medium_000, music starts
  - Scene 2 (Concept) — three text lines arrive with interface/drop_001 each
  - Scene 3 (Intake) — form fields use interface/drop_002, button click uses interface/click_001
  - Scene 4 (Scan) — scan icon pulses with interface/glitch_002 at reduced volume
  - Scene 5 (Results) — score bar fill has rising tension, badges arrive with interface/drop_001
  - Scene 6 (Outro) — impactBell_heavy_000 on name reveal (soft)
- SFX selection guidance: UI clicks for form interactions, scan pulse for scanning moment, success chime for results, soft impact for reveals. Prefer low high-frequency-risk sounds for repeated moments.
- SFX analysis guidance: see skills/brag/assets/sfx/sfx-analysis.md
- Exact SFX choice: Hyperframes should choose filenames, timestamps, density, and volume based on the implemented animation.
- Audio files: copy the chosen music and any Hyperframes-selected SFX into `brag-output/composition/assets/`

## Hyperframes Instructions
Load the composition-building Hyperframes domain skills — `hyperframes-core` (composition contract + `data-*` timing), `hyperframes-animation` (motion), `hyperframes-creative` (design spec, beats, audio-reactive), `hyperframes-keyframes` (seek-safe keyframes), and `hyperframes-cli` (lint/check/render). /brag is its own workflow: do not enter the `hyperframes` entry-point intent interview and do not route into its generic promo / launch-video workflow. Prefer native Hyperframes conventions over anything in `/brag`.

Requirements:
- Show at least one real UI, copy, or visual element from the source project (the audit results card, the intake form).
- Keep all text readable in the final render.
- Keep the video within 15-25 seconds.
- Include the planned music/SFX layer.
- Treat `/brag` audio notes as guidance, not a fixed cue sheet. Choose SFX after the visual animation exists.
- Treat music cue metadata as optional timing hints. Hyperframes decides exact animation timing and should ignore cues that hurt readability, scene pacing, or the product story.
- Major reveals may move toward nearby strong cues within about 0.15s. Smaller entrances may align to nearby beat points within about 0.10s. Use only 1-3 strong cue locks in a 15-25s video unless the edit clearly benefits from more.
- Use SFX to support motion and interaction: card sounds for card-like reveals, short announcement cues for major payoffs, key/click sounds for text or user actions, and restraint when the edit is already busy.
- Honor planned music treatment such as fade-outs, ducking, beat-aligned reveals, or letting a final SFX ring over the music, using the best Hyperframes-supported implementation.
- When music is present and the treatment is not `none`, consider Hyperframes audio-reactive workflow: extract audio data and use RMS/frequency bands for subtle, brand-specific motion. Good targets are glow, depth, background warmth, card presence, title emphasis, or other existing visual elements. Avoid waveform/equalizer visuals, musical-note graphics, generic particle systems, strobing, or heavy pulsing.
- Use local assets for audio and any required runtime/media dependencies when possible.
- Run `hyperframes check` before render — it is brag's single gate.
