// scripts/generate-effects-v14-f.mjs
//
// Fourteenth wave, part F: Charts & Data (6), Timelines & Steps (6),
// Tables & Data Grids (6), Forms & Validation (6).
//
// These four are the categories the catalog is genuinely still short of
// shapes in, so all four take six designs each.
//
//   Charts    — population pyramid, marimekko mosaic, polar rose,
//               pareto combo, waffle pictogram, venn overlap
//   Timelines — flight itinerary, locked course steps, sequence diagram,
//               milestone thermometer, handoff swimlanes, history scrub
//   Tables    — spreadsheet range, skeleton loading, row reorder,
//               row action reveal, directory avatars, import errors
//   Forms     — star rating, slug preview, completion meter,
//               error summary, autosave draft, scroll-to-accept

export function generateV14F(ctx) {
  const { cls, mk, add } = ctx

  /* ------------------------------------------------------------------ */
  /* Charts & Data                                                       */
  /* ------------------------------------------------------------------ */

  /* CH1. Population pyramid — back-to-back bars around a centred age axis */
  {
    const c = cls('v14-ch-pyramid')
    const html = `<div class="${c}"><div class="hd"><span>Men</span><em>Age</em><span>Women</span></div><div class="r"><i class="l" style="--w:34%"></i><b>65+</b><i class="t" style="--w:48%"></i></div><div class="r"><i class="l" style="--w:52%"></i><b>50-64</b><i class="t" style="--w:58%"></i></div><div class="r"><i class="l" style="--w:78%"></i><b>35-49</b><i class="t" style="--w:72%"></i></div><div class="r"><i class="l" style="--w:96%"></i><b>20-34</b><i class="t" style="--w:88%"></i></div><div class="r"><i class="l" style="--w:61%"></i><b>0-19</b><i class="t" style="--w:64%"></i></div><div class="ax"><span>8%</span><em>0</em><span>8%</span></div></div>`
    const css = `.${c} {
  width: 246px;
  color: #cbd5e1;
}
.${c} .hd, .${c} .ax {
  display: grid;
  grid-template-columns: 1fr 46px 1fr;
  align-items: center;
  font-size: 0.58rem;
  color: #64748b;
}
.${c} .hd { margin-bottom: 0.3rem; }
.${c} .ax { margin-top: 0.3rem; }
.${c} .hd span:last-child, .${c} .ax span:last-child { text-align: right; }
.${c} .hd em, .${c} .ax em { font-style: normal; text-align: center; }
.${c} .r {
  display: grid;
  grid-template-columns: 1fr 46px 1fr;
  align-items: center;
  margin-bottom: 4px;
}
.${c} .r b {
  font-size: 0.57rem;
  font-weight: 500;
  text-align: center;
  color: #94a3b8;
  font-variant-numeric: tabular-nums;
}
.${c} .r i {
  display: block;
  width: var(--w);
  height: 13px;
  transition: filter 0.22s ease, transform 0.22s ease;
}
.${c} .l {
  justify-self: end;
  border-radius: 2px 0 0 2px;
  background: linear-gradient(90deg, #0369a1, #38bdf8);
  transform-origin: right center;
}
.${c} .t {
  border-radius: 0 2px 2px 0;
  background: linear-gradient(90deg, #a78bfa, #6d28d9);
  transform-origin: left center;
}
.${c} .r:hover i { filter: brightness(1.3); transform: scaleX(1.05); }
.${c} .r:hover b { color: #f1f5f9; }`
    add(mk({
      name: 'Population Pyramid Chart',
      category: 'Charts & Data',
      description: 'Age bands stacked around a centred label column, with one bar growing left and one growing right so the two populations can be compared band by band.',
      html, css,
      tags: ['pyramid', 'demographics', 'bidirectional', 'bars', 'chart'],
    }))
  }

  /* CH2. Marimekko mosaic — stacked columns whose widths carry a second value */
  {
    const c = cls('v14-ch-mekko')
    const html = `<div class="${c}"><div class="pl"><div class="col" style="--f:38"><i class="s1" style="--h:52"></i><i class="s2" style="--h:31"></i><i class="s3" style="--h:17"></i></div><div class="col" style="--f:26"><i class="s1" style="--h:34"></i><i class="s2" style="--h:44"></i><i class="s3" style="--h:22"></i></div><div class="col" style="--f:21"><i class="s1" style="--h:61"></i><i class="s2" style="--h:19"></i><i class="s3" style="--h:20"></i></div><div class="col" style="--f:15"><i class="s1" style="--h:26"></i><i class="s2" style="--h:29"></i><i class="s3" style="--h:45"></i></div></div><div class="lb"><span style="--f:38">EMEA</span><span style="--f:26">AMER</span><span style="--f:21">APAC</span><span style="--f:15">LATAM</span></div></div>`
    const css = `.${c} {
  width: 246px;
  color: #cbd5e1;
}
.${c} .pl {
  display: flex;
  gap: 3px;
  height: 116px;
}
.${c} .col {
  flex: var(--f);
  display: flex;
  flex-direction: column;
  gap: 2px;
  transition: opacity 0.22s ease;
}
.${c} .col i {
  display: block;
  flex: var(--h);
  border-radius: 2px;
  transition: filter 0.22s ease;
}
.${c} .s1 { background: #0ea5e9; }
.${c} .s2 { background: #6366f1; }
.${c} .s3 { background: #44546f; }
.${c} .pl:hover .col { opacity: 0.45; }
.${c} .pl .col:hover { opacity: 1; }
.${c} .col:hover i { filter: brightness(1.2); }
.${c} .lb {
  display: flex;
  gap: 3px;
  margin-top: 0.32rem;
}
.${c} .lb span {
  flex: var(--f);
  overflow: hidden;
  font-size: 0.57rem;
  color: #64748b;
  text-align: center;
  white-space: nowrap;
}`
    add(mk({
      name: 'Marimekko Mosaic Chart',
      category: 'Charts & Data',
      description: 'Mosaic of stacked columns where each column is as wide as the share of the market it represents, so both the split inside a region and the size of the region read from one block.',
      html, css,
      tags: ['marimekko', 'mosaic', 'stacked', 'share', 'chart'],
    }))
  }

  /* CH3. Polar rose — sectors of equal angle and varying radius */
  {
    const c = cls('v14-ch-rose')
    const html = `<div class="${c}"><i style="--a:0;--r:66;--col:#0ea5e9"></i><i style="--a:45;--r:48;--col:#22d3ee"></i><i style="--a:90;--r:57;--col:#38bdf8"></i><i style="--a:135;--r:31;--col:#818cf8"></i><i style="--a:180;--r:62;--col:#6366f1"></i><i style="--a:225;--r:40;--col:#a78bfa"></i><i style="--a:270;--r:52;--col:#c084fc"></i><i style="--a:315;--r:36;--col:#7dd3fc"></i><b></b></div>`
    const css = `.${c} {
  position: relative;
  width: 142px;
  height: 142px;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 50%,
    transparent 0 23px, rgba(148,163,184,0.14) 23px 24px,
    transparent 24px 46px, rgba(148,163,184,0.14) 46px 47px,
    transparent 47px 69px, rgba(148,163,184,0.2) 69px 70px, transparent 70px);
}
.${c} i {
  position: absolute;
  left: 50%;
  top: 50%;
  width: calc(var(--r) * 2px);
  height: calc(var(--r) * 2px);
  margin-left: calc(var(--r) * -1px);
  margin-top: calc(var(--r) * -1px);
  border-radius: 50%;
  background: conic-gradient(from calc(var(--a) * 1deg), var(--col) 0 43deg, transparent 43deg);
  opacity: 0.82;
  transition: transform 0.32s cubic-bezier(0.34, 1.4, 0.64, 1), opacity 0.32s ease;
}
.${c} b {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 9px;
  height: 9px;
  margin: -4.5px 0 0 -4.5px;
  border-radius: 50%;
  background: #0f172a;
  box-shadow: 0 0 0 2px #475569;
}
.${c}:hover i { transform: scale(1.09); opacity: 1; }
.${c} i:hover { transform: scale(1.16); opacity: 1; }`
    add(mk({
      name: 'Polar Rose Chart',
      category: 'Charts & Data',
      description: 'Eight equal-angle petals drawn from the centre, each reaching a different radius over faint guide rings so the values read as a rose rather than a row of bars.',
      html, css,
      tags: ['polar', 'rose', 'radial', 'sectors', 'chart'],
    }))
  }

  /* CH4. Pareto combo — descending bars under a cumulative line and an 80% rule */
  {
    const c = cls('v14-ch-pareto')
    const html = `<div class="${c}"><b class="ttl">Failures by cause</b><div class="pl"><i style="--h:89%"></i><i style="--h:62%"></i><i style="--h:38%"></i><i style="--h:22%"></i><i style="--h:11%"></i><span class="r80"><u>80%</u></span><svg class="ln" viewBox="0 0 100 60" preserveAspectRatio="none"><polyline points="10,34.4 30,19.3 50,10.1 70,4.7 90,2"/></svg></div><div class="ax"><em>Timeout</em><em>Auth</em><em>Parse</em><em>Disk</em><em>Other</em></div></div>`
    const css = `.${c} {
  width: 244px;
  color: #cbd5e1;
}
.${c} .ttl {
  display: block;
  margin-bottom: 0.4rem;
  font-size: 0.64rem;
  font-weight: 500;
  color: #94a3b8;
}
.${c} .pl {
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 100px;
  border-bottom: 1px solid #29344d;
}
.${c} .pl i {
  flex: 1;
  height: var(--h);
  border-radius: 2px 2px 0 0;
  background: linear-gradient(180deg, #38bdf8, #0369a1);
  transition: filter 0.2s ease, opacity 0.2s ease;
}
.${c} .pl:hover i { opacity: 0.4; }
.${c} .pl i:hover { opacity: 1; filter: brightness(1.25); }
.${c} .r80 {
  position: absolute;
  left: 0;
  right: 0;
  top: 21.3%;
  border-top: 1px dashed rgba(251,191,36,0.55);
}
.${c} .r80 u {
  position: absolute;
  right: 0;
  top: -12px;
  font-size: 0.54rem;
  text-decoration: none;
  color: #fbbf24;
}
.${c} .ln {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}
.${c} .ln polyline {
  fill: none;
  stroke: #fbbf24;
  stroke-width: 2;
  stroke-linejoin: round;
  stroke-linecap: round;
  vector-effect: non-scaling-stroke;
  transition: stroke 0.2s ease;
}
.${c}:hover .ln polyline { stroke: #fde68a; }
.${c} .ax {
  display: flex;
  gap: 6px;
  margin-top: 0.28rem;
}
.${c} .ax em {
  flex: 1;
  font-style: normal;
  font-size: 0.54rem;
  text-align: center;
  color: #64748b;
  overflow: hidden;
  white-space: nowrap;
}`
    add(mk({
      name: 'Pareto Combo Chart',
      category: 'Charts & Data',
      description: 'Causes ranked as descending bars with a cumulative percentage line running across them and a dashed eighty percent rule marking where the vital few end.',
      html, css,
      tags: ['pareto', 'cumulative', 'combo', 'ranked', 'chart'],
    }))
  }

  /* CH5. Waffle pictogram — a fifty-square grid filled to the share */
  {
    const c = cls('v14-ch-waffle')
    const html = `<div class="${c}"><div class="hd"><b>Seats in use</b><em>34 / 50</em></div><div class="g">${'<i></i>'.repeat(50)}</div><div class="lg"><span class="on"></span>Assigned<span class="off"></span>Free</div></div>`
    const css = `.${c} {
  width: 232px;
  color: #cbd5e1;
}
.${c} .hd {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 0.35rem;
}
.${c} .hd b { font-size: 0.66rem; font-weight: 500; }
.${c} .hd em { font-style: normal; font-size: 0.62rem; color: #38bdf8; font-variant-numeric: tabular-nums; }
.${c} .g {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 3px;
}
.${c} .g i {
  aspect-ratio: 1;
  border-radius: 2px;
  background: #1e293b;
  transition: transform 0.18s ease, background 0.18s ease;
}
.${c} .g i:nth-child(-n+34) { background: #0ea5e9; }
.${c} .g i:nth-child(-n+34):hover { background: #7dd3fc; }
.${c} .g i:hover { transform: scale(1.35); }
.${c} .lg {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin-top: 0.4rem;
  font-size: 0.56rem;
  color: #64748b;
}
.${c} .lg span {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}
.${c} .lg .on { background: #0ea5e9; }
.${c} .lg .off { margin-left: 0.5rem; background: #1e293b; }`
    add(mk({
      name: 'Waffle Pictogram Chart',
      category: 'Charts & Data',
      description: 'Fifty squares in a ten-wide grid with thirty-four of them filled, so the proportion can be counted square by square instead of read off an axis.',
      html, css,
      tags: ['waffle', 'pictogram', 'proportion', 'grid', 'chart'],
    }))
  }

  /* CH6. Venn overlap — three screen-blended discs with counts in the regions */
  {
    const c = cls('v14-ch-venn')
    const html = `<div class="${c}"><div class="vn"><i class="a"></i><i class="b"></i><i class="d"></i><b class="na">412</b><b class="nb">288</b><b class="nd">196</b><b class="nx">74</b></div><div class="lg"><span><u class="ka"></u>Email</span><span><u class="kb"></u>Push</span><span><u class="kd"></u>In-app</span></div></div>`
    const css = `.${c} {
  width: 218px;
  color: #cbd5e1;
}
.${c} .vn {
  position: relative;
  width: 158px;
  height: 134px;
  margin: 0 auto;
}
.${c} .vn i {
  position: absolute;
  width: 96px;
  height: 96px;
  border-radius: 50%;
  mix-blend-mode: screen;
  transition: transform 0.3s ease, filter 0.3s ease;
}
.${c} .a { left: 0; top: 0; background: rgba(2,132,199,0.75); }
.${c} .b { left: 62px; top: 0; background: rgba(124,58,237,0.7); }
.${c} .d { left: 31px; top: 38px; background: rgba(13,148,136,0.7); }
.${c} .vn i:hover { transform: scale(1.05); filter: brightness(1.3); }
.${c} .vn b {
  position: absolute;
  transform: translate(-50%, -50%);
  font-size: 0.64rem;
  font-weight: 700;
  color: #f8fafc;
  text-shadow: 0 1px 2px rgba(2,6,23,0.9);
  pointer-events: none;
}
.${c} .na { left: 27px; top: 40px; }
.${c} .nb { left: 131px; top: 40px; }
.${c} .nd { left: 79px; top: 116px; }
.${c} .nx { left: 79px; top: 62px; }
.${c} .lg {
  display: flex;
  justify-content: center;
  gap: 0.6rem;
  margin-top: 0.3rem;
  font-size: 0.56rem;
  color: #64748b;
}
.${c} .lg span { display: flex; align-items: center; gap: 0.22rem; }
.${c} .lg u { width: 8px; height: 8px; border-radius: 50%; }
.${c} .ka { background: #0284c7; }
.${c} .kb { background: #7c3aed; }
.${c} .kd { background: #0d9488; }`
    add(mk({
      name: 'Venn Overlap Chart',
      category: 'Charts & Data',
      description: 'Three translucent discs blended together so every intersection lightens, with the audience count printed in each exclusive region and in the shared centre.',
      html, css,
      tags: ['venn', 'overlap', 'sets', 'blend', 'chart'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* Timelines & Steps                                                   */
  /* ------------------------------------------------------------------ */

  /* TL1. Flight itinerary — two airports joined by a dashed path a plane travels */
  {
    const c = cls('v14-tl-flight')
    const html = `<div class="${c}"><div class="rw"><div class="pt"><b>LHR</b><em>09:15</em></div><div class="mid"><span class="ln"><i class="pl"></i></span><u>7h 25m · non-stop</u></div><div class="pt e"><b>JFK</b><em>12:40</em></div></div><div class="ft"><span>BA 178</span><span>Terminal 5</span><span>Gate B12</span></div></div>`
    const css = `.${c} {
  width: 246px;
  padding: 0.7rem 0.75rem;
  color: #cbd5e1;
  background: #111a2b;
  border: 1px solid #253049;
  border-radius: 0.6rem;
}
.${c} .rw { display: flex; align-items: center; gap: 0.5rem; }
.${c} .pt b { display: block; font-size: 0.95rem; font-weight: 700; color: #f1f5f9; letter-spacing: 0.03em; }
.${c} .pt em { display: block; font-style: normal; font-size: 0.6rem; color: #64748b; font-variant-numeric: tabular-nums; }
.${c} .e { text-align: right; }
.${c} .mid { flex: 1; }
.${c} .ln {
  position: relative;
  display: block;
  height: 0;
  margin: 0 2px 0.45rem;
  border-top: 2px dashed #334155;
}
.${c} .pl {
  position: absolute;
  left: 12%;
  top: -6px;
  width: 0;
  height: 0;
  border-left: 11px solid #38bdf8;
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
  transition: left 0.75s cubic-bezier(0.5, 0, 0.3, 1);
}
.${c} .mid u {
  display: block;
  font-size: 0.55rem;
  text-align: center;
  text-decoration: none;
  color: #64748b;
}
.${c}:hover .pl { left: 82%; }
.${c}:hover .ln { border-top-color: #475569; }
.${c} .ft {
  display: flex;
  justify-content: space-between;
  margin-top: 0.6rem;
  padding-top: 0.45rem;
  border-top: 1px solid #253049;
  font-size: 0.56rem;
  color: #64748b;
}
.${c} .ft span:first-child { color: #7dd3fc; }`
    add(mk({
      name: 'Flight Itinerary Steps',
      category: 'Timelines & Steps',
      description: 'Departure and arrival airports at either end of a dashed route, with a plane marker that flies the length of the path on hover and the flight details ruled off underneath.',
      html, css,
      tags: ['flight', 'itinerary', 'journey', 'travel', 'steps'],
    }))
  }

  /* TL2. Locked course steps — a lesson chain gated by a padlock */
  {
    const c = cls('v14-tl-course')
    const html = `<div class="${c}"><div class="s done"><span class="ic"><i class="ck"></i></span><div class="tx"><b>Anatomy of a hover</b><em>6 min · complete</em></div></div><div class="s now"><span class="ic"><i class="pl"></i></span><div class="tx"><b>Easing and timing</b><em>4 of 9 min</em><span class="ba"><u></u></span></div></div><div class="s lock"><span class="ic"><i class="lk"></i></span><div class="tx"><b>Reduced motion</b><em>Locked</em></div></div></div>`
    const css = `.${c} {
  width: 238px;
  color: #cbd5e1;
}
.${c} .s {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.3rem 0.4rem;
  border-radius: 0.4rem;
  transition: background 0.2s ease;
}
.${c} .s:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 17px;
  top: 34px;
  width: 2px;
  height: 14px;
  background: #29344d;
}
.${c} .ic {
  display: grid;
  place-items: center;
  flex: none;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #16203a;
  border: 1px solid #29344d;
}
.${c} .done .ic { background: rgba(52,211,153,0.16); border-color: #34d399; }
.${c} .now .ic { background: #0ea5e9; border-color: #38bdf8; box-shadow: 0 0 0 3px rgba(56,189,248,0.16); }
.${c} .ck {
  width: 5px;
  height: 9px;
  margin-top: -2px;
  border: solid #34d399;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}
.${c} .pl {
  width: 0;
  height: 0;
  margin-left: 2px;
  border-left: 8px solid #082f49;
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
}
.${c} .lk {
  position: relative;
  width: 11px;
  height: 8px;
  margin-top: 3px;
  border-radius: 1px;
  background: #64748b;
}
.${c} .lk::before {
  content: '';
  position: absolute;
  left: 2px;
  top: -6px;
  width: 7px;
  height: 7px;
  border: 2px solid #64748b;
  border-bottom: none;
  border-radius: 4px 4px 0 0;
}
.${c} .tx { flex: 1; min-width: 0; }
.${c} b { display: block; font-size: 0.7rem; font-weight: 500; }
.${c} em { display: block; font-style: normal; font-size: 0.56rem; color: #64748b; }
.${c} .done b { color: #94a3b8; text-decoration: line-through; }
.${c} .now b { color: #f1f5f9; }
.${c} .lock b, .${c} .lock em { color: #475569; }
.${c} .ba {
  display: block;
  height: 3px;
  margin-top: 4px;
  border-radius: 2px;
  background: rgba(148,163,184,0.2);
  overflow: hidden;
}
.${c} .ba u { display: block; width: 44%; height: 100%; background: #38bdf8; }
.${c} .s:hover { background: #16203a; }
.${c} .lock:hover .lk, .${c} .lock:hover .lk::before { background: #94a3b8; border-color: #94a3b8; }
.${c} .lock:hover .lk::before { background: transparent; }`
    add(mk({
      name: 'Locked Course Steps',
      category: 'Timelines & Steps',
      description: 'Lesson chain running from a struck-through completed step through the in-progress one with its own part-filled bar, down to a padlocked step that is still out of reach.',
      html, css,
      tags: ['course', 'locked', 'lessons', 'gated', 'steps'],
    }))
  }

  /* TL3. Sequence diagram — messages crossing between two lifelines */
  {
    const c = cls('v14-tl-sequence')
    const html = `<div class="${c}"><div class="hd"><b>Client</b><b>API</b></div><div class="bd"><i class="lf"></i><i class="rt"></i><i class="act"></i><div class="m go" style="top:20px"><span>POST /session</span></div><div class="m back" style="top:52px"><span>201 token</span></div><div class="m go" style="top:84px"><span>GET /me</span></div></div></div>`
    const css = `.${c} {
  width: 240px;
  color: #cbd5e1;
}
.${c} .hd {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.4rem;
}
.${c} .hd b {
  padding: 0.16rem 0.5rem;
  font-size: 0.62rem;
  font-weight: 600;
  color: #e2e8f0;
  background: #1b2740;
  border: 1px solid #334155;
  border-radius: 0.3rem;
}
.${c} .bd { position: relative; height: 112px; }
.${c} .lf, .${c} .rt {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 0;
  border-left: 1px dashed #334155;
}
.${c} .lf { left: 30px; }
.${c} .rt { right: 26px; }
.${c} .act {
  position: absolute;
  right: 23px;
  top: 20px;
  width: 7px;
  height: 40px;
  background: #1b2740;
  border: 1px solid #3f4f6b;
  border-radius: 1px;
}
.${c} .m {
  position: absolute;
  left: 30px;
  right: 26px;
  height: 22px;
  border-top: 1.6px solid #38bdf8;
  transition: border-color 0.2s ease, opacity 0.2s ease;
}
.${c} .m span {
  position: absolute;
  left: 50%;
  top: -14px;
  transform: translateX(-50%);
  white-space: nowrap;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.58rem;
  color: #94a3b8;
  transition: color 0.2s ease;
}
.${c} .m::after {
  content: '';
  position: absolute;
  top: -5.6px;
  width: 0;
  height: 0;
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
}
.${c} .go::after { right: -1px; border-left: 8px solid #38bdf8; }
.${c} .back {
  border-top-style: dashed;
  border-top-color: #64748b;
}
.${c} .back::after { left: -1px; border-right: 8px solid #64748b; }
.${c} .bd:hover .m { opacity: 0.35; }
.${c} .bd .m:hover { opacity: 1; border-top-color: #7dd3fc; }
.${c} .m:hover span { color: #f1f5f9; }
.${c} .back:hover { border-top-color: #cbd5e1; }`
    add(mk({
      name: 'Sequence Diagram Steps',
      category: 'Timelines & Steps',
      description: 'Two dashed lifelines with request arrows crossing between them in order, a solid arrow out, a dashed reply back, and an activation bar marking how long the server was busy.',
      html, css,
      tags: ['sequence', 'lifeline', 'messages', 'protocol', 'steps'],
    }))
  }

  /* TL4. Milestone thermometer — a vertical fill climbing past goal ticks */
  {
    const c = cls('v14-tl-thermo')
    const html = `<div class="${c}"><div class="tb"><i class="fl"></i><i class="tk" style="bottom:25%"></i><i class="tk" style="bottom:50%"></i><i class="tk" style="bottom:75%"></i></div><div class="sc"><span style="bottom:100%"><u></u>£50k goal</span><span class="hit" style="bottom:75%"><u></u>£37.5k</span><span class="hit" style="bottom:50%"><u></u>£25k</span></div><b class="cap">£34,200 raised<em>68% of goal</em></b></div>`
    const css = `.${c} {
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: 0.55rem;
  width: 224px;
  height: 152px;
  color: #cbd5e1;
}
.${c} .tb {
  position: relative;
  flex: none;
  width: 24px;
  height: 130px;
  border-radius: 12px;
  background: #16203a;
  border: 1px solid #29344d;
  overflow: hidden;
}
.${c} .fl {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 68%;
  background: linear-gradient(180deg, #fb923c, #dc2626);
  transition: height 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}
.${c} .tk {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background: rgba(15,23,42,0.55);
}
.${c} .sc {
  position: relative;
  flex: 1;
  height: 130px;
}
.${c} .sc span {
  position: absolute;
  left: 0;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  transform: translateY(50%);
  font-size: 0.58rem;
  color: #64748b;
  font-variant-numeric: tabular-nums;
}
.${c} .sc u { width: 10px; height: 1px; background: #334155; }
.${c} .sc .hit { color: #fdba74; }
.${c} .sc .hit u { background: #7c2d12; }
.${c} .sc span:first-child { color: #e2e8f0; font-weight: 600; }
.${c} .cap {
  position: absolute;
  left: 44px;
  bottom: 0;
  font-size: 0.72rem;
  font-weight: 600;
  color: #f1f5f9;
}
.${c} .cap em {
  display: block;
  font-style: normal;
  font-size: 0.56rem;
  font-weight: 400;
  color: #64748b;
}
.${c}:hover .fl { height: 84%; }`
    add(mk({
      name: 'Milestone Thermometer',
      category: 'Timelines & Steps',
      description: 'Fundraising tube filled from the bottom with milestone ticks scored across it and money labels beside each one, the reached amounts warmed and the level climbing toward the next milestone on hover.',
      html, css,
      tags: ['thermometer', 'milestone', 'goal', 'fundraising', 'progress'],
    }))
  }

  /* TL5. Handoff swimlanes — steps alternating between two owner lanes */
  {
    const c = cls('v14-tl-swimlane')
    const html = `<div class="${c}"><div class="gr"><b class="ln1">Design</b><b class="ln2">Build</b><i class="st p1">Spec</i><i class="cn c1"></i><i class="st p2">Build</i><i class="cn c2"></i><i class="st p3">Review</i><i class="cn c3"></i><i class="st p4">Ship</i></div></div>`
    const css = `.${c} {
  width: 250px;
  padding: 0.65rem 0.7rem;
  color: #cbd5e1;
  background: #111a2b;
  border: 1px solid #253049;
  border-radius: 0.6rem;
}
.${c} .gr {
  display: grid;
  grid-template-columns: 42px 1fr 20px 1fr 20px 1fr 20px 1fr;
  grid-template-rows: 30px 30px;
  align-items: center;
  gap: 0.5rem 0;
}
.${c} b {
  grid-column: 1;
  font-size: 0.56rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #64748b;
}
.${c} .ln1 { grid-row: 1; }
.${c} .ln2 { grid-row: 2; }
.${c} .st {
  display: grid;
  place-items: center;
  height: 26px;
  font-style: normal;
  font-size: 0.64rem;
  color: #cbd5e1;
  background: #16203a;
  border: 1px solid #334155;
  border-radius: 0.35rem;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}
.${c} .p1 { grid-column: 2; grid-row: 1; }
.${c} .p2 { grid-column: 4; grid-row: 2; }
.${c} .p3 { grid-column: 6; grid-row: 1; }
.${c} .p4 { grid-column: 8; grid-row: 2; }
.${c} .st:hover { background: #1d4ed8; border-color: #3b82f6; color: #eff6ff; }
.${c} .cn {
  grid-row: 1 / 3;
  align-self: stretch;
}
.${c} .c1 { grid-column: 3; }
.${c} .c2 { grid-column: 5; }
.${c} .c3 { grid-column: 7; }
.${c} .c1, .${c} .c3 {
  background: linear-gradient(to top right, transparent calc(50% - 1px), #475569 calc(50% - 1px), #475569 calc(50% + 1px), transparent calc(50% + 1px));
}
.${c} .c2 {
  background: linear-gradient(to bottom right, transparent calc(50% - 1px), #475569 calc(50% - 1px), #475569 calc(50% + 1px), transparent calc(50% + 1px));
}
.${c} .gr:hover .cn { filter: brightness(1.6); }`
    add(mk({
      name: 'Handoff Swimlane Steps',
      category: 'Timelines & Steps',
      description: 'Four steps dropped into two owner lanes, with diagonal connectors cutting between the lanes at every handoff so the work is seen changing hands twice.',
      html, css,
      tags: ['swimlane', 'handoff', 'lanes', 'workflow', 'steps'],
    }))
  }

  /* TL6. History scrub — hovering a version discards everything after it */
  {
    const c = cls('v14-tl-history')
    const html = `<div class="${c}"><b class="hd">Version history</b><div class="ls"><div class="r"><i></i><span>Created document</span><em>4h</em><u>Restore</u></div><div class="r"><i></i><span>Renamed hero layer</span><em>52m</em><u>Restore</u></div><div class="r"><i></i><span>Added pricing table</span><em>18m</em><u>Restore</u></div><div class="r now"><i></i><span>Recoloured buttons</span><em>now</em><u>Restore</u></div></div></div>`
    const css = `.${c} {
  width: 244px;
  color: #cbd5e1;
}
.${c} .hd {
  display: block;
  margin-bottom: 0.35rem;
  font-size: 0.58rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #64748b;
}
.${c} .r {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.3rem 0.45rem;
  border-radius: 0.35rem;
  font-size: 0.68rem;
  transition: background 0.18s ease, opacity 0.18s ease, color 0.18s ease;
}
.${c} .r::after {
  content: '';
  position: absolute;
  left: 10px;
  top: 26px;
  width: 1px;
  height: 12px;
  background: #29344d;
}
.${c} .r:last-child::after { display: none; }
.${c} .r i {
  flex: none;
  width: 7px;
  height: 7px;
  margin-left: 3px;
  border-radius: 50%;
  background: #475569;
}
.${c} .now i { background: #38bdf8; box-shadow: 0 0 0 3px rgba(56,189,248,0.18); }
.${c} .r span { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.${c} .r em { font-style: normal; font-size: 0.58rem; color: #64748b; }
.${c} .r u {
  position: absolute;
  right: 0.45rem;
  padding: 0.1rem 0.35rem;
  font-size: 0.56rem;
  text-decoration: none;
  color: #082f49;
  background: #38bdf8;
  border-radius: 0.25rem;
  opacity: 0;
  transform: translateX(4px);
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.${c} .r:hover { background: #16203a; }
.${c} .r:hover u { opacity: 1; transform: none; }
.${c} .r:hover em { opacity: 0; }
.${c} .r:hover ~ .r { opacity: 0.32; }
.${c} .r:hover ~ .r span { text-decoration: line-through; }`
    add(mk({
      name: 'History Scrub Steps',
      category: 'Timelines & Steps',
      description: 'Version list running oldest to newest where pointing at an entry offers to restore it and strikes through every later edit, previewing exactly what rolling back would throw away.',
      html, css,
      tags: ['history', 'versions', 'undo', 'restore', 'timeline'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* Tables & Data Grids                                                 */
  /* ------------------------------------------------------------------ */

  /* TB1. Spreadsheet range — lettered columns, a selected range and a fill handle */
  {
    const c = cls('v14-tb-sheet')
    const html = `<div class="${c}"><div class="fb"><span class="nb">B2</span><i>fx</i><span class="fx">=Q1!C4*1.08</span></div><div class="g"><span class="hc"></span><span class="hc hA">A</span><span class="hc hB">B</span><span class="hc hD">C</span><span class="rn">1</span><span class="cA">Region</span><span class="cB">Revenue</span><span class="cD">Δ</span><span class="rn">2</span><span class="cA">EMEA</span><span class="cB sel s1">12,480</span><span class="cD">+4%</span><span class="rn">3</span><span class="cA">AMER</span><span class="cB sel">18,204</span><span class="cD">+9%</span><span class="rn">4</span><span class="cA">APAC</span><span class="cB sel s2">9,116</span><span class="cD">−2%</span></div></div>`
    const css = `.${c} {
  width: 246px;
  font-size: 0.64rem;
  color: #cbd5e1;
  background: #0f1626;
  border: 1px solid #253049;
  border-radius: 0.45rem;
  overflow: hidden;
}
.${c} .fb {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.4rem;
  background: #131c31;
  border-bottom: 1px solid #253049;
}
.${c} .nb {
  width: 40px;
  padding: 0.1rem 0.3rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.6rem;
  color: #e2e8f0;
  background: #0d1424;
  border: 1px solid #29344d;
  border-radius: 0.2rem;
}
.${c} .fb i { font-style: italic; font-size: 0.6rem; color: #64748b; }
.${c} .fx {
  flex: 1;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.6rem;
  color: #7dd3fc;
}
.${c} .g {
  display: grid;
  grid-template-columns: 24px 1fr 1fr 44px;
}
.${c} .g > span {
  padding: 0.26rem 0.4rem;
  border-right: 1px solid #1b2438;
  border-bottom: 1px solid #1b2438;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
}
.${c} .hc, .${c} .rn {
  font-size: 0.55rem;
  text-align: center;
  color: #64748b;
  background: #131c31;
  transition: background 0.16s ease, color 0.16s ease;
}
.${c} .g > span:nth-child(4n) { border-right: none; }
.${c} .cB, .${c} .cD { text-align: right; }
.${c} .sel { background: rgba(56,189,248,0.13); border-left: 1px solid #38bdf8; border-right: 1px solid #38bdf8; }
.${c} .s1 { border-top: 1px solid #38bdf8; }
.${c} .s2 { position: relative; border-bottom: 1px solid #38bdf8; }
.${c} .s2::after {
  content: '';
  position: absolute;
  right: -3px;
  bottom: -3px;
  width: 6px;
  height: 6px;
  background: #38bdf8;
  border: 1px solid #0f1626;
}
.${c} .g:has(.cA:hover) .hA, .${c} .g:has(.cB:hover) .hB, .${c} .g:has(.cD:hover) .hD {
  color: #e2e8f0;
  background: #1e3a5f;
}
.${c} .g > span:hover { background: rgba(148,163,184,0.1); }`
    add(mk({
      name: 'Spreadsheet Range Grid',
      category: 'Tables & Data Grids',
      description: 'Worksheet with a name box and formula bar over lettered columns and numbered rows, one column selected as a single outlined range complete with a fill handle at its corner.',
      html, css,
      tags: ['spreadsheet', 'range', 'cells', 'formula', 'grid'],
    }))
  }

  /* TB2. Skeleton loading — shimmering placeholder bars where the data will land */
  {
    const c = cls('v14-tb-skeleton')
    const html = `<div class="${c}"><div class="hd"><span>Customer</span><span>Plan</span><span>MRR</span></div><div class="r"><i class="w1"></i><i class="w2"></i><i class="w3"></i></div><div class="r"><i class="w4"></i><i class="w5"></i><i class="w6"></i></div><div class="r"><i class="w7"></i><i class="w8"></i><i class="w9"></i></div><div class="ft">Loading 3 of 128 rows</div></div>`
    const css = `.${c} {
  width: 246px;
  color: #cbd5e1;
  background: #0f1626;
  border: 1px solid #253049;
  border-radius: 0.45rem;
  overflow: hidden;
}
.${c} .hd {
  display: grid;
  grid-template-columns: 1fr 62px 54px;
  gap: 0.5rem;
  padding: 0.32rem 0.55rem;
  font-size: 0.56rem;
  color: #64748b;
  background: #131c31;
  border-bottom: 1px solid #253049;
}
.${c} .r {
  display: grid;
  grid-template-columns: 1fr 62px 54px;
  gap: 0.5rem;
  align-items: center;
  padding: 0.42rem 0.55rem;
  border-bottom: 1px solid #1b2438;
}
.${c} .r i {
  display: block;
  height: 8px;
  border-radius: 4px;
  background: linear-gradient(90deg, #1e293b 0%, #1e293b 25%, #3b4a63 45%, #1e293b 65%, #1e293b 100%);
  background-size: 260% 100%;
  background-position: 120% 0;
  animation: ${c}-sh 1.5s linear infinite;
}
.${c} .w1 { width: 82%; }
.${c} .w2 { width: 100%; }
.${c} .w3 { width: 74%; animation-delay: 0.1s; }
.${c} .w4 { width: 64%; animation-delay: 0.15s; }
.${c} .w5 { width: 86%; animation-delay: 0.2s; }
.${c} .w6 { width: 92%; animation-delay: 0.25s; }
.${c} .w7 { width: 71%; animation-delay: 0.3s; }
.${c} .w8 { width: 70%; animation-delay: 0.35s; }
.${c} .w9 { width: 58%; animation-delay: 0.4s; }
@keyframes ${c}-sh {
  from { background-position: 120% 0; }
  to { background-position: -60% 0; }
}
.${c} .ft {
  padding: 0.32rem 0.55rem;
  font-size: 0.55rem;
  color: #64748b;
  background: #131c31;
}
.${c}:hover .r i { animation-duration: 0.75s; }`
    add(mk({
      name: 'Skeleton Loading Table',
      category: 'Tables & Data Grids',
      description: 'Real column headers over rounded grey placeholder bars of uneven length, a highlight sweeping across them on a stagger and speeding up while the pointer is over the table.',
      html, css,
      tags: ['skeleton', 'loading', 'shimmer', 'placeholder', 'table'],
    }))
  }

  /* TB3. Row reorder — grip handles, a lifted row and a drop indicator */
  {
    const c = cls('v14-tb-reorder')
    const html = `<div class="${c}"><div class="hd"><span>Order</span><span>Stage</span></div><div class="r"><i class="gp"></i><b>Discovery call</b><em>1</em></div><div class="r"><i class="gp"></i><b>Technical review</b><em>2</em></div><div class="r"><i class="gp"></i><b>Contract sent</b><em>3</em></div></div>`
    const css = `.${c} {
  width: 240px;
  color: #cbd5e1;
  background: #0f1626;
  border: 1px solid #253049;
  border-radius: 0.5rem;
  padding-bottom: 0.3rem;
}
.${c} .hd {
  display: flex;
  justify-content: space-between;
  padding: 0.35rem 0.6rem;
  font-size: 0.55rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #64748b;
  border-bottom: 1px solid #253049;
  margin-bottom: 0.3rem;
}
.${c} .r {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.55rem;
  margin: 0 0.3rem;
  padding: 0.4rem 0.5rem;
  background: #131c31;
  border: 1px solid transparent;
  border-radius: 0.35rem;
  cursor: grab;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, background 0.18s ease;
}
.${c} .r + .r { margin-top: 0.25rem; }
.${c} .gp {
  flex: none;
  width: 8px;
  height: 14px;
  background-image: radial-gradient(circle, #475569 1.1px, transparent 1.2px);
  background-size: 4px 5px;
  transition: background-image 0.18s ease;
}
.${c} b { flex: 1; font-size: 0.69rem; font-weight: 500; }
.${c} em {
  font-style: normal;
  font-size: 0.6rem;
  color: #64748b;
  font-variant-numeric: tabular-nums;
}
.${c} .r::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -4px;
  height: 2px;
  border-radius: 1px;
  background: #38bdf8;
  opacity: 0;
  transition: opacity 0.18s ease;
}
.${c} .r:hover {
  background: #1b2740;
  border-color: #3f5578;
  transform: translateY(-2px);
  box-shadow: 0 6px 14px rgba(2,6,23,0.55);
}
.${c} .r:hover .gp { background-image: radial-gradient(circle, #7dd3fc 1.1px, transparent 1.2px); }
.${c} .r:hover::after { opacity: 1; }`
    add(mk({
      name: 'Row Reorder Table',
      category: 'Tables & Data Grids',
      description: 'Stage rows carrying dotted grip handles, where pointing at one lifts it off the table with a shadow and drops a blue insertion line beneath it.',
      html, css,
      tags: ['reorder', 'drag', 'handle', 'rows', 'table'],
    }))
  }

  /* TB4. Row action reveal — buttons sliding in from the row's right edge */
  {
    const c = cls('v14-tb-actions')
    const icons = `<i><svg viewBox="0 0 24 24"><path d="M4 20h4L20 8l-4-4L4 16z"/></svg></i><i><svg viewBox="0 0 24 24"><path d="M12 4v11M7 12l5 5 5-5M5 20h14"/></svg></i><i class="rm"><svg viewBox="0 0 24 24"><path d="M5 7h14M9.5 7V4.5h5V7M7.5 7l1 12.5h7L16.5 7"/></svg></i>`
    const html = `<div class="${c}"><div class="r"><b>invoice-2291.pdf</b><span class="mt">2.4 MB</span><span class="ac">${icons}</span></div><div class="r"><b>contract-v3.docx</b><span class="mt">840 KB</span><span class="ac">${icons}</span></div><div class="r"><b>brand-kit.zip</b><span class="mt">18 MB</span><span class="ac">${icons}</span></div></div>`
    const css = `.${c} {
  width: 244px;
  color: #cbd5e1;
  background: #0f1626;
  border: 1px solid #253049;
  border-radius: 0.5rem;
  overflow: hidden;
}
.${c} .r {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.6rem;
  overflow: hidden;
  transition: background 0.18s ease;
}
.${c} .r + .r { border-top: 1px solid #1b2438; }
.${c} b {
  flex: 1;
  min-width: 0;
  font-size: 0.68rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.${c} .mt {
  font-size: 0.58rem;
  color: #64748b;
  font-variant-numeric: tabular-nums;
  transition: transform 0.24s ease, opacity 0.24s ease;
}
.${c} .ac {
  position: absolute;
  right: 0.5rem;
  display: flex;
  gap: 0.28rem;
  transform: translateX(120%);
  opacity: 0;
  transition: transform 0.24s cubic-bezier(0.3, 0.9, 0.3, 1), opacity 0.24s ease;
}
.${c} .ac i {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  background: #1b2740;
  border: 1px solid #334155;
  border-radius: 0.28rem;
  transition: background-color 0.16s ease, border-color 0.16s ease;
}
.${c} .ac svg {
  width: 12px;
  height: 12px;
  fill: none;
  stroke: #7dd3fc;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.${c} .rm svg { stroke: #fca5a5; }
.${c} .r:hover { background: #16203a; }
.${c} .r:hover .mt { transform: translateX(-14px); opacity: 0; }
.${c} .r:hover .ac { transform: none; opacity: 1; }
.${c} .ac i:hover { background: #334155; border-color: #64748b; }`
    add(mk({
      name: 'Row Action Reveal Table',
      category: 'Tables & Data Grids',
      description: 'File rows whose size column slides away on hover as a strip of edit, download and delete buttons glides in from the right edge to take its place.',
      html, css,
      tags: ['actions', 'reveal', 'slide', 'rows', 'table'],
    }))
  }

  /* TB5. Directory avatars — two-line identity cells with initial discs */
  {
    const c = cls('v14-tb-directory')
    const html = `<div class="${c}"><div class="hd"><span>Member</span><span>Role</span></div><div class="r"><i class="av a1">MT</i><div class="id"><b>Mira Tanaka</b><em>mira@atlas.dev</em></div><u class="rl own">Owner</u></div><div class="r"><i class="av a2">RK</i><div class="id"><b>Ravi Kumar</b><em>ravi@atlas.dev</em></div><u class="rl">Editor</u></div><div class="r"><i class="av a3">JS</i><div class="id"><b>Jo Silva</b><em>jo@atlas.dev</em></div><u class="rl">Viewer</u></div></div>`
    const css = `.${c} {
  width: 248px;
  color: #cbd5e1;
  background: #0f1626;
  border: 1px solid #253049;
  border-radius: 0.5rem;
  overflow: hidden;
}
.${c} .hd {
  display: flex;
  justify-content: space-between;
  padding: 0.3rem 0.6rem;
  font-size: 0.54rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #64748b;
  background: #131c31;
  border-bottom: 1px solid #253049;
}
.${c} .r {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.36rem 0.6rem;
  transition: background 0.18s ease;
}
.${c} .r + .r { border-top: 1px solid #1b2438; }
.${c} .av {
  display: grid;
  place-items: center;
  flex: none;
  width: 26px;
  height: 26px;
  font-style: normal;
  font-size: 0.58rem;
  font-weight: 700;
  color: #0b1020;
  border-radius: 50%;
  transition: box-shadow 0.18s ease, transform 0.18s ease;
}
.${c} .a1 { background: linear-gradient(135deg, #67e8f9, #0ea5e9); }
.${c} .a2 { background: linear-gradient(135deg, #fcd34d, #f97316); }
.${c} .a3 { background: linear-gradient(135deg, #c4b5fd, #7c3aed); }
.${c} .id { flex: 1; min-width: 0; }
.${c} b { display: block; font-size: 0.68rem; font-weight: 500; color: #f1f5f9; }
.${c} em {
  display: block;
  font-style: normal;
  font-size: 0.55rem;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.${c} .rl {
  padding: 0.1rem 0.4rem;
  font-size: 0.55rem;
  text-decoration: none;
  color: #94a3b8;
  background: #1b2740;
  border: 1px solid #334155;
  border-radius: 999px;
}
.${c} .own { color: #7dd3fc; border-color: rgba(56,189,248,0.5); background: rgba(56,189,248,0.14); }
.${c} .r:hover { background: #16203a; }
.${c} .r:hover .av { transform: scale(1.06); box-shadow: 0 0 0 3px rgba(148,163,184,0.22); }`
    add(mk({
      name: 'Directory Avatar Table',
      category: 'Tables & Data Grids',
      description: 'Member list whose first column packs an initials disc beside a name stacked over its email address, with the role carried as a pill on the right and the owner pill tinted.',
      html, css,
      tags: ['directory', 'avatar', 'members', 'identity', 'table'],
    }))
  }

  /* TB6. Import errors — invalid cells underlined, with the reason on hover */
  {
    const c = cls('v14-tb-import')
    const html = `<div class="${c}"><div class="bn"><i>!</i>2 cells need fixing before import</div><div class="g"><span class="h">Name</span><span class="h">Signed</span><span class="h">Seats</span><span>Atlas Ltd</span><span>2026-04-11</span><span>24</span><span>Northwind</span><span class="bad">11 Apr<u>not ISO 8601</u></span><span>8</span><span>Cobalt</span><span>2026-02-02</span><span class="bad">many<u class="rt">not a number</u></span></div></div>`
    const css = `.${c} {
  width: 250px;
  font-size: 0.63rem;
  color: #cbd5e1;
  background: #0f1626;
  border: 1px solid #253049;
  border-radius: 0.45rem;
  overflow: hidden;
}
.${c} .bn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.5rem;
  font-size: 0.6rem;
  color: #fecaca;
  background: rgba(248,113,113,0.12);
  border-bottom: 1px solid rgba(248,113,113,0.3);
}
.${c} .bn i {
  display: grid;
  place-items: center;
  flex: none;
  width: 14px;
  height: 14px;
  font-style: normal;
  font-size: 0.58rem;
  font-weight: 700;
  color: #450a0a;
  background: #f87171;
  border-radius: 50%;
}
.${c} .g { display: grid; grid-template-columns: 1fr 1fr 44px; }
.${c} .g > span {
  position: relative;
  padding: 0.28rem 0.45rem;
  border-bottom: 1px solid #1b2438;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.${c} .h {
  font-size: 0.54rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #64748b;
  background: #131c31;
}
.${c} .g > span.bad {
  overflow: visible;
  color: #fca5a5;
  background: rgba(248,113,113,0.1);
  text-decoration: underline wavy #f87171;
  text-underline-offset: 2px;
  cursor: help;
}
.${c} .bad u {
  position: absolute;
  left: 0.45rem;
  bottom: 100%;
  z-index: 2;
  padding: 0.14rem 0.35rem;
  font-size: 0.54rem;
  text-decoration: none;
  color: #450a0a;
  background: #fca5a5;
  border-radius: 0.25rem;
  white-space: nowrap;
  opacity: 0;
  transform: translateY(4px);
  transition: opacity 0.18s ease, transform 0.18s ease;
  pointer-events: none;
}
.${c} .bad u.rt { left: auto; right: 0.2rem; }
.${c} .bad:hover u { opacity: 1; transform: translateY(-2px); }
.${c} .g > span:last-child, .${c} .g > span:nth-last-child(2), .${c} .g > span:nth-last-child(3) { border-bottom: none; }`
    add(mk({
      name: 'Import Error Grid',
      category: 'Tables & Data Grids',
      description: 'CSV import preview headed by a red count banner, the two offending cells tinted and underlined with a wavy rule that raises the reason for the rejection on hover.',
      html, css,
      tags: ['import', 'errors', 'validation', 'csv', 'grid'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* Forms & Validation                                                  */
  /* ------------------------------------------------------------------ */

  /* FM1. Star rating — hover repaints the row up to the star under the pointer */
  {
    const c = cls('v14-fm-stars')
    const html = `<div class="${c}"><span class="lb">Rate this template</span><div class="st"><label><input type="radio" name="${c}" /><i class="s"></i></label><label><input type="radio" name="${c}" /><i class="s on"></i></label><label><input type="radio" name="${c}" /><i class="s on"></i></label><label><input type="radio" name="${c}" /><i class="s on"></i></label><label><input type="radio" name="${c}" /><i class="s on"></i></label></div><em class="hint">4 of 5 · 128 ratings</em></div>`
    const css = `.${c} {
  width: 214px;
  color: #cbd5e1;
}
.${c} .lb { display: block; margin-bottom: 0.4rem; font-size: 0.68rem; }
.${c} .st { display: flex; flex-direction: row-reverse; justify-content: flex-end; gap: 0.28rem; }
.${c} .st input { position: absolute; opacity: 0; width: 0; height: 0; }
.${c} .st label { cursor: pointer; }
.${c} .st .s {
  display: block;
  width: 24px;
  height: 24px;
  background: #334155;
  clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
  transition: background 0.15s ease, transform 0.15s ease;
}
.${c} .st .s.on { background: #fbbf24; }
.${c} .st:hover .s.on { background: #334155; }
.${c} .st:hover label:hover .s, .${c} .st:hover label:hover ~ label .s {
  background: #f59e0b;
  transform: scale(1.12);
}
.${c} .hint { display: block; margin-top: 0.35rem; font-style: normal; font-size: 0.58rem; color: #64748b; }`
    add(mk({
      name: 'Star Rating Field',
      category: 'Forms & Validation',
      description: 'Five-star input showing a saved rating of four, where sweeping across it clears the stored fill and repaints the row up to whichever star sits under the pointer.',
      html, css,
      tags: ['rating', 'stars', 'review', 'input', 'preview'],
    }))
  }

  /* FM2. Slug preview — the URL a title will publish to, mirrored under the field */
  {
    const c = cls('v14-fm-slug')
    const html = `<label class="${c}"><span class="lb">Post title</span><input type="text" value="Hover states that teach" /><span class="pv"><em>hoverlab.dev/blog/</em><b>hover-states-that-teach</b><i class="cp">copy</i></span><span class="ok"><u></u>Address is free</span></label>`
    const css = `.${c} {
  display: block;
  width: 244px;
  color: #cbd5e1;
}
.${c} .lb { display: block; margin-bottom: 0.22rem; font-size: 0.6rem; color: #64748b; }
.${c} input {
  width: 100%;
  padding: 0.38rem 0.5rem;
  font: inherit;
  font-size: 0.74rem;
  color: #f1f5f9;
  background: #0d1424;
  border: 1px solid #29344d;
  border-radius: 0.38rem;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.${c} input:focus { border-color: #38bdf8; box-shadow: 0 0 0 3px rgba(56,189,248,0.16); }
.${c} .pv {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.12rem;
  margin-top: 0.4rem;
  padding: 0.3rem 0.45rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.6rem;
  background: #101a2e;
  border: 1px dashed #29344d;
  border-radius: 0.35rem;
  overflow: hidden;
}
.${c} .pv em { font-style: normal; color: #64748b; }
.${c} .pv b {
  font-weight: 600;
  color: #7dd3fc;
  background: rgba(56,189,248,0.12);
  border-radius: 2px;
  transition: background 0.2s ease;
}
.${c} .cp {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  padding: 0 0.45rem 0 1.5rem;
  font-style: normal;
  font-size: 0.56rem;
  color: #cbd5e1;
  background: linear-gradient(90deg, rgba(16,26,46,0), #16203a 55%);
  transform: translateX(100%);
  transition: transform 0.24s ease;
}
.${c}:hover .cp { transform: none; }
.${c}:hover .pv b { background: rgba(56,189,248,0.24); }
.${c} .ok {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin-top: 0.3rem;
  font-size: 0.58rem;
  color: #6ee7b7;
}
.${c} .ok u { width: 6px; height: 6px; border-radius: 50%; background: #34d399; }`
    add(mk({
      name: 'Slug Preview Field',
      category: 'Forms & Validation',
      description: 'Title field with the published address mirrored underneath it, the slugged half highlighted inside a dashed strip and a copy button sliding over the end on hover.',
      html, css,
      tags: ['slug', 'preview', 'url', 'field', 'mirror'],
    }))
  }

  /* FM3. Completion meter — a ring counting the requirements still open */
  {
    const c = cls('v14-fm-completion')
    const html = `<div class="${c}"><div class="tp"><div class="rg"><b>60<u>%</u></b></div><div class="hh"><b>Finish your profile</b><em>3 of 5 complete</em></div></div><div class="ls"><div class="i done"><span class="mk"></span>Email verified</div><div class="i"><span class="mk"></span>Add a payment method<u>Add</u></div><div class="i"><span class="mk"></span>Invite a teammate<u>Add</u></div></div></div>`
    const css = `.${c} {
  width: 244px;
  color: #cbd5e1;
}
.${c} .tp { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.5rem; }
.${c} .rg {
  display: grid;
  place-items: center;
  flex: none;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: conic-gradient(#38bdf8 0 60%, #1e293b 60%);
}
.${c} .rg b {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  font-size: 0.6rem;
  font-weight: 700;
  color: #e2e8f0;
  background: #0f172a;
  border-radius: 50%;
}
.${c} .rg u { font-size: 0.44rem; text-decoration: none; color: #64748b; }
.${c} .hh b { display: block; font-size: 0.72rem; font-weight: 600; color: #f1f5f9; }
.${c} .hh em { display: block; font-style: normal; font-size: 0.58rem; color: #64748b; }
.${c} .i {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.26rem 0.4rem;
  font-size: 0.66rem;
  border-radius: 0.3rem;
  transition: background 0.18s ease;
}
.${c} .mk {
  position: relative;
  flex: none;
  width: 13px;
  height: 13px;
  border: 1.5px solid #475569;
  border-radius: 50%;
}
.${c} .done .mk { background: #34d399; border-color: #34d399; }
.${c} .done .mk::after {
  content: '';
  position: absolute;
  left: 4px;
  top: 1px;
  width: 3px;
  height: 6px;
  border: solid #052e16;
  border-width: 0 1.5px 1.5px 0;
  transform: rotate(45deg);
}
.${c} .done { color: #64748b; }
.${c} .i u {
  margin-left: auto;
  padding: 0.06rem 0.4rem;
  font-size: 0.56rem;
  text-decoration: none;
  color: #7dd3fc;
  border: 1px solid rgba(56,189,248,0.35);
  border-radius: 0.25rem;
  opacity: 0;
  transition: opacity 0.18s ease;
}
.${c} .i:hover { background: #16203a; }
.${c} .i:hover u { opacity: 1; }`
    add(mk({
      name: 'Form Completion Meter',
      category: 'Forms & Validation',
      description: 'Profile checklist headed by a conic progress ring reading sixty percent, with the finished requirement ticked and greyed and each outstanding one offering an add button on hover.',
      html, css,
      tags: ['completion', 'checklist', 'progress', 'ring', 'form'],
    }))
  }

  /* FM4. Error summary — pointing at a listed error lights the offending field */
  {
    const c = cls('v14-fm-errsummary')
    const html = `<div class="${c}"><div class="sm"><b><i>!</i>2 problems with this form</b><a class="l1">Enter a valid email address</a><a class="l2">Choose a plan</a></div><div class="fs"><label class="f f1"><span>Email</span><input type="text" value="mira@" /></label><label class="f f2"><span>Plan</span><span class="sel">Select…</span></label></div></div>`
    const css = `.${c} {
  width: 248px;
  color: #cbd5e1;
}
.${c} .sm {
  padding: 0.4rem 0.55rem;
  background: rgba(248,113,113,0.1);
  border: 1px solid rgba(248,113,113,0.35);
  border-left: 3px solid #f87171;
  border-radius: 0.4rem;
}
.${c} .sm b {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.66rem;
  color: #fecaca;
}
.${c} .sm i {
  display: grid;
  place-items: center;
  width: 13px;
  height: 13px;
  font-style: normal;
  font-size: 0.55rem;
  font-weight: 700;
  color: #450a0a;
  background: #f87171;
  border-radius: 50%;
}
.${c} .sm a {
  display: block;
  margin-top: 0.2rem;
  margin-left: 1.1rem;
  font-size: 0.6rem;
  color: #fca5a5;
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
  transition: color 0.18s ease;
}
.${c} .sm a:hover { color: #fff1f2; }
.${c} .fs { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 0.5rem; }
.${c} .f span:first-child { display: block; margin-bottom: 0.16rem; font-size: 0.56rem; color: #64748b; }
.${c} .f input, .${c} .f .sel {
  display: block;
  width: 100%;
  padding: 0.3rem 0.45rem;
  font: inherit;
  font-size: 0.68rem;
  color: #e2e8f0;
  background: #0d1424;
  border: 1px solid #29344d;
  border-radius: 0.35rem;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.${c} .f .sel { color: #64748b; }
.${c}:has(.l1:hover) .f1 input, .${c}:has(.l2:hover) .f2 .sel {
  border-color: #f87171;
  box-shadow: 0 0 0 3px rgba(248,113,113,0.2);
}
.${c}:has(.l1:hover) .f1 span:first-child, .${c}:has(.l2:hover) .f2 span:first-child { color: #fca5a5; }`
    add(mk({
      name: 'Error Summary Panel',
      category: 'Forms & Validation',
      description: 'Red summary block counting the form errors above the fields themselves, where hovering one of the listed messages rings the field it belongs to and reddens its label.',
      html, css,
      tags: ['errors', 'summary', 'validation', 'linked', 'form'],
    }))
  }

  /* FM5. Autosave draft — the saved stamp swapping for a saving spinner */
  {
    const c = cls('v14-fm-autosave')
    const html = `<div class="${c}"><div class="hd"><span>Release notes</span><span class="st"><em class="a"><u class="dt"></u>Saved · 12s ago</em><em class="b"><u class="sp"></u>Saving…</em></span></div><div class="ta">Fixed the flicker on the pricing table and shortened the hover delay on nav items.<i class="cr"></i></div><div class="ft"><em>Autosaves every 5 seconds</em><span class="pb">Publish</span></div></div>`
    const css = `.${c} {
  width: 248px;
  color: #cbd5e1;
}
.${c} .hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.3rem;
  font-size: 0.62rem;
  color: #94a3b8;
}
.${c} .st { position: relative; display: block; height: 12px; }
.${c} .st em {
  display: flex;
  align-items: center;
  gap: 0.28rem;
  font-style: normal;
  font-size: 0.56rem;
  white-space: nowrap;
  transition: opacity 0.2s ease;
}
.${c} .st .b { position: absolute; right: 0; top: 0; opacity: 0; color: #7dd3fc; }
.${c} .st .a { color: #6ee7b7; }
.${c} .dt { width: 6px; height: 6px; border-radius: 50%; background: #34d399; }
.${c} .sp {
  width: 8px;
  height: 8px;
  border: 1.5px solid rgba(125,211,252,0.3);
  border-top-color: #7dd3fc;
  border-radius: 50%;
  animation: ${c}-spin 0.7s linear infinite;
}
@keyframes ${c}-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.${c} .ta {
  position: relative;
  height: 66px;
  padding: 0.4rem 0.5rem;
  font-size: 0.66rem;
  line-height: 1.45;
  color: #cbd5e1;
  background: #0d1424;
  border: 1px solid #29344d;
  border-radius: 0.4rem;
  overflow: hidden;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.${c} .cr {
  display: inline-block;
  width: 1.5px;
  height: 11px;
  margin-left: 1px;
  vertical-align: -2px;
  background: #7dd3fc;
  animation: ${c}-blink 1.1s steps(1, end) infinite;
}
@keyframes ${c}-blink { 0% { opacity: 0; } 50% { opacity: 1; } 100% { opacity: 1; } }
.${c}:hover .ta { border-color: #38bdf8; box-shadow: 0 0 0 3px rgba(56,189,248,0.14); }
.${c}:hover .st .a { opacity: 0; }
.${c}:hover .st .b { opacity: 1; }
.${c} .ft {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.35rem;
}
.${c} .ft em { font-style: normal; font-size: 0.55rem; color: #64748b; }
.${c} .pb {
  padding: 0.2rem 0.55rem;
  font-size: 0.6rem;
  font-weight: 600;
  color: #082f49;
  background: #38bdf8;
  border-radius: 0.3rem;
  cursor: pointer;
  transition: background 0.18s ease;
}
.${c} .pb:hover { background: #7dd3fc; }`
    add(mk({
      name: 'Autosave Draft Field',
      category: 'Forms & Validation',
      description: 'Draft editor with a blinking caret and a green saved stamp in its header that swaps for a spinning saving indicator the moment the field is touched.',
      html, css,
      tags: ['autosave', 'draft', 'status', 'spinner', 'field'],
    }))
  }

  /* FM6. Scroll to accept — a scrollable terms frame gating the accept button */
  {
    const c = cls('v14-fm-terms')
    const html = `<div class="${c}"><b class="hd">Terms of service</b><div class="bx"><p>1. You may use the catalog in client and commercial work without attribution.</p><p>2. You may not resell the effects as a competing library or template pack.</p><p>3. The licence is per seat and stays with your team.</p></div><div class="ft"><span class="ck"><i></i>I accept</span><span class="bt">Accept<u>Scroll to the end first</u></span></div></div>`
    const css = `.${c} {
  width: 250px;
  color: #cbd5e1;
}
.${c} .hd { display: block; margin-bottom: 0.3rem; font-size: 0.66rem; font-weight: 600; color: #f1f5f9; }
.${c} .bx {
  height: 82px;
  padding: 0.4rem 0.55rem;
  font-size: 0.6rem;
  line-height: 1.5;
  color: #94a3b8;
  background: #0d1424;
  border: 1px solid #29344d;
  border-radius: 0.4rem;
  overflow-y: auto;
  -webkit-mask-image: linear-gradient(180deg, #000 0 62px, rgba(0,0,0,0.25) 82px);
  mask-image: linear-gradient(180deg, #000 0 62px, rgba(0,0,0,0.25) 82px);
}
.${c} .bx p { margin: 0 0 0.4rem; }
.${c} .bx p:last-child { margin-bottom: 0; }
.${c} .bx::-webkit-scrollbar { width: 5px; }
.${c} .bx::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
.${c} .bx::-webkit-scrollbar-thumb:hover { background: #475569; }
.${c} .ft {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.45rem;
}
.${c} .ck { display: flex; align-items: center; gap: 0.35rem; font-size: 0.63rem; color: #475569; }
.${c} .ck i {
  width: 14px;
  height: 14px;
  border: 1.5px solid #334155;
  border-radius: 0.24rem;
}
.${c} .bt {
  position: relative;
  padding: 0.28rem 0.7rem;
  font-size: 0.65rem;
  font-weight: 600;
  color: #475569;
  background: #1b2740;
  border: 1px solid #29344d;
  border-radius: 0.35rem;
  cursor: not-allowed;
}
.${c} .bt u {
  position: absolute;
  right: 0;
  bottom: 125%;
  padding: 0.16rem 0.4rem;
  font-size: 0.55rem;
  font-weight: 400;
  text-decoration: none;
  white-space: nowrap;
  color: #e2e8f0;
  background: #334155;
  border-radius: 0.25rem;
  opacity: 0;
  transform: translateY(4px);
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.${c} .bt:hover u { opacity: 1; transform: none; }
.${c} .bx:hover { border-color: #3f5578; }`
    add(mk({
      name: 'Scroll To Accept Terms',
      category: 'Forms & Validation',
      description: 'Licence text scrolling inside a fixed frame that fades out at its bottom edge, above a dimmed accept row whose disabled button explains on hover that the text must be read to the end.',
      html, css,
      tags: ['terms', 'scroll', 'accept', 'disabled', 'consent'],
    }))
  }
}
