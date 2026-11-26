/* PIP — procedural puppet. Layered SVG with lit gradients, grain texture, a jaw/eyelid rig and costume slots.
   MODEL (shared by every costume): head centre (240,215); eyes (170,150)/(310,150) r40; mouth line y=252, half-width 134;
   shoulders (158,392)/(322,392); feet y≈556. Costumes only add layers into named slots, so proportions never change. */
(function (P) {
  const M = { eyes: [[170, 150], [310, 150]], er: 40, y0: 252, hw: 134, sh: [[158, 392], [322, 392]] };
  const DEF = { lid: 0, tilt: 0, lidLow: 0, browY: 0, browRot: 0, browAsym: 0, px: 0, py: 0, pupS: 1, eyeS: 1, cross: 0, smile: 0.1, open: 0, wide: 1,
    tongue: 0, cheek: 0, tears: 0, zzz: 0, hearts: 0, sweat: 0, shades: 0, tint: 0, headRot: 0, headY: 0, armL1: 12, armL2: 6, armR1: 12, armR2: 6, shake: 0, teeth: 0 };
  const MOODS = {
    stoned: { lid: .5, tilt: -.1, browY: 4, smile: .15, open: .05, pupS: .8, py: .15, headRot: -4, cheek: .2 },
    happy: { lid: .08, lidLow: .35, smile: .9, open: .14, browY: -6, cheek: .4, armL1: 20, armR1: 20 },
    laughing: { lid: .45, lidLow: .6, smile: 1, open: .75, wide: 1.12, browY: -8, headRot: 5, shake: .6, cheek: .5, teeth: .2, armL1: 40, armL2: -95, armR1: 40, armR2: -95 },
    crying: { lid: .3, tilt: -.7, browRot: -14, browY: 4, smile: -.85, open: .25, tears: 1, py: .35, headY: 5 },
    smug: { lid: .38, tilt: .1, smile: .55, open: .02, headRot: -6, px: .5, browY: -3 },
    angry: { lid: .3, tilt: .95, browRot: 20, browY: 6, smile: -.6, open: .3, teeth: 1, shake: .5, armL1: 18, armR1: 18 },
    shocked: { lid: 0, pupS: .5, eyeS: 1.15, open: .72, wide: .62, browY: -14, headY: -4, armL1: 35, armL2: 20, armR1: 35, armR2: 20 },
    sleepy: { lid: .86, smile: .05, open: .1, zzz: 1, headRot: 7, headY: 6 },
    love: { lid: .1, pupS: 1.25, smile: .85, open: .12, cheek: 1, hearts: 1, headRot: 4, py: -.1 },
    cool: { lid: .15, smile: .35, open: .03, shades: 1, headRot: -3, browY: -2 },
    thinking: { lid: .15, px: -.7, py: -.8, smile: -.1, open: .03, browAsym: 9, headRot: 6, armR1: 70, armR2: -170 },
    queasy: { lid: .4, smile: -.4, open: .08, tint: .42, sweat: 1, pupS: .8, headY: 4, tilt: -.2, wide: .8 }
  };
  const lerp = (a, b, t) => a + (b - a) * t;
  const NS = 'http://www.w3.org/2000/svg';

  /* ---------- costume art layers: function(p) → {defs, slot: svg} ---------- */
  const grad = (id, stops, extra = 'cx=".4" cy=".3" r=".8"') => `<radialGradient id="${id}" ${extra}>${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</radialGradient>`;
  const lin = (id, stops, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;
  const star = (x, y, s, f) => `<path d="M${x} ${y - s}L${x + s * .3} ${y - s * .3}L${x + s} ${y}L${x + s * .3} ${y + s * .3}L${x} ${y + s}L${x - s * .3} ${y + s * .3}L${x - s} ${y}L${x - s * .3} ${y - s * .3}Z" fill="${f}"/>`;
  const mirrorX = (s) => `<g transform="translate(480 0) scale(-1 1)">${s}</g>`;
  const LAYERS = {
    zeno: (p) => ({
      defs: grad(p + 'dome', [[0, '#e6ff8a'], [.5, '#92cc2c'], [1, '#4a8a1a']], 'cx=".35" cy=".2" r=".9"') + lin(p + 'ridge', [[0, '#3f7a18'], [1, '#6aa82a']]),
      headBack: `<g data-sway="5,1.3,0,120,150"><path d="M104 150C40 122 14 54 58 8C84-14 128-6 136 26C94 38 86 96 128 140Z" fill="url(#${p}ridge)" stroke="#2e5a12" stroke-width="5"/><path d="M60 40C70 20 100 14 116 28M52 70C60 52 84 46 100 58" stroke="#c9f06a" stroke-opacity=".5" stroke-width="4" fill="none"/></g>
        <g data-sway="5,1.3,1,360,150">${mirrorX('<path d="M104 150C40 122 14 54 58 8C84-14 128-6 136 26C94 38 86 96 128 140Z" fill="url(#' + p + 'ridge)" stroke="#2e5a12" stroke-width="5"/>')}</g>
        <path d="M92 168C60 40 140-74 240-82C340-74 420 40 388 168Z" fill="url(#${p}dome)" stroke="#2e5a12" stroke-width="6"/>
        <path d="M130 140C112 40 170-36 240-60M190 130C180 50 210-20 240-40M350 140C368 40 310-36 240-60M290 130C300 50 270-20 240-40" stroke="#3f7a18" stroke-opacity=".45" stroke-width="5" fill="none"/>
        <ellipse cx="180" cy="-22" rx="52" ry="20" transform="rotate(-28 180 -22)" fill="#fff" opacity=".55"/><ellipse cx="150" cy="10" rx="14" ry="6" transform="rotate(-40 150 10)" fill="#fff" opacity=".6"/>
        <g data-sway="14,1.7,0,205,-70"><path d="M205-70C190-120 168-150 146-166" stroke="#5a9a1c" stroke-width="7" fill="none" stroke-linecap="round"/><circle cx="146" cy="-166" r="10" fill="#e8ff8a" stroke="#4a8a1a" stroke-width="3"/></g>
        <g data-sway="14,1.9,2,275,-70"><path d="M275-70C290-120 312-150 334-166" stroke="#5a9a1c" stroke-width="7" fill="none" stroke-linecap="round"/><circle cx="334" cy="-166" r="10" fill="#e8ff8a" stroke="#4a8a1a" stroke-width="3"/></g>`,
      bodyOver: [0, 1, 2, 3].map(i => `<path d="M178 ${400 + i * 24}Q240 ${418 + i * 24} 302 ${400 + i * 24}" stroke="#2c5a12" stroke-opacity=".35" stroke-width="6" fill="none" stroke-linecap="round"/>`).join('') + [0, 1, 2].map(i => `<path d="M188 ${346 + i * 10}Q240 ${362 + i * 10} 292 ${346 + i * 10}" stroke="#2c5a12" stroke-opacity=".5" stroke-width="4" fill="none"/>`).join(''),
      back: `<g data-sway="9,1.2,0,300,520"><path d="M300 530C410 552 456 480 430 392C420 450 380 500 300 500Z" fill="#5a9a1c" stroke="#2e5a12" stroke-width="5"/><path d="M340 520C380 500 400 470 408 440M330 510L350 488" stroke="#c9f06a" stroke-opacity=".5" stroke-width="3" fill="none"/></g>`
    }),
    evil: (p) => ({
      defs: lin(p + 'cl', [[0, '#3a3d45'], [1, '#101114']]) + lin(p + 'hd', [[0, '#2c2e35'], [1, '#0b0b0e']]),
      back: `<path d="M118 330C56 430 34 540 24 578L456 578C446 540 424 430 362 330Z" fill="#0f1013"/>`,
      headBack: `<path d="M66 200C30 56 140-34 240-38C340-34 450 56 414 200C414 292 350 336 240 336C130 336 66 292 66 200Z" fill="url(#${p}hd)"/>`,
      bodyOver: `<path d="M104 345C96 430 64 520 40 580L440 580C416 520 384 430 376 345C330 376 150 376 104 345Z" fill="url(#${p}cl)"/>` +
        [[176, 150], [208, 200], [240, 240], [272, 290], [304, 330]].map(([a, b], i) => `<path d="M${a} 382C${a - 12} 460 ${b - 30} 520 ${b - 40} 578" stroke="${i % 2 ? '#4a4d57' : '#07070a'}" stroke-opacity=".55" stroke-width="${8 - i}" fill="none"/>`).join(''),
      armU: `<path d="M-23-12C-35 20-35 60-31 86L31 86C35 60 35 20 23-12Z" fill="url(#${p}cl)"/><path d="M-10 0C-14 30-14 60-12 80" stroke="#07070a" stroke-opacity=".5" stroke-width="5" fill="none"/>`,
      armF: `<path d="M-27 0C-36 30-38 58-34 78L34 78C38 58 36 30 27 0Z" fill="url(#${p}cl)"/><path d="M-34 78L34 78" stroke="#4a4d57" stroke-width="4"/>`,
      headOver: `<path fill-rule="evenodd" fill="url(#${p}hd)" d="M48 210C18 36 130-50 240-54C350-50 462 36 432 210C434 304 382 352 330 360L150 360C98 352 46 304 48 210ZM112 214C102 140 140 100 240 96C340 100 378 140 368 214C372 290 320 332 240 334C160 332 108 290 112 214Z"/>
        <path d="M112 214C102 140 140 100 240 96C340 100 378 140 368 214C372 290 320 332 240 334C160 332 108 290 112 214Z" fill="none" stroke="#000" stroke-opacity=".55" stroke-width="12"/><path d="M70 140C80 60 150-10 240-14" stroke="#555a66" stroke-opacity=".5" stroke-width="5" fill="none"/>`
    }),
    myco: (p) => ({
      defs: grad(p + 'cap', [[0, '#ff8a5c'], [.55, '#d83c26'], [1, '#8f1c18']], 'cx=".4" cy=".25" r=".9"'),
      headOver: `<g data-sway="3.5,.9,0,240,124"><path d="M26 130C60 150 420 150 454 130L454 116L26 116Z" fill="#e8d8b0"/>${Array.from({ length: 16 }, (_, i) => `<path d="M${50 + i * 25} 118L${46 + i * 25} 140" stroke="#b9a070" stroke-width="2"/>`).join('')}
        <path d="M18 128C6 30 120-84 240-90C360-84 474 30 462 128C384 150 96 150 18 128Z" fill="url(#${p}cap)" stroke="#6c1210" stroke-width="6"/>
        ${[[118, 38, 27], [242, -34, 31], [354, 30, 25], [180, 76, 14], [300, 82, 16], [66, 100, 12], [414, 96, 12], [240, 54, 9], [150, -10, 10], [330, -10, 11]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * .8}" fill="#fbefd2" opacity=".95"/>`).join('')}
        <ellipse cx="170" cy="-30" rx="70" ry="22" transform="rotate(-20 170 -30)" fill="#fff" opacity=".22"/></g>`,
      bodyOver: `<g data-sway="5,1.1,0,345,380"><path d="M330 384C326 354 360 340 380 354C392 366 380 386 330 384Z" fill="#d83c26" stroke="#6c1210" stroke-width="3"/><circle cx="356" cy="362" r="4" fill="#fbefd2"/><circle cx="372" cy="370" r="3" fill="#fbefd2"/></g>` +
        `<ellipse cx="170" cy="520" rx="34" ry="12" fill="#5f8a3a" opacity=".7"/><ellipse cx="300" cy="530" rx="40" ry="12" fill="#5f8a3a" opacity=".6"/>`,
      faceOver: [[60, 60], [420, 30], [30, 220], [452, 200], [100, -30], [380, -10]].map(([x, y], i) => `<circle data-float="${6 + i},${.5 + i * .1},${i}" data-twinkle="${1 + i * .3},${i}" cx="${x}" cy="${y}" r="${3 + (i % 3)}" fill="#ffe9b0"/>`).join('')
    }),
    punk: (p) => ({
      defs: lin(p + 'mo', [[0, '#ff6fb8'], [1, '#b0126b']]) + lin(p + 'lt', [[0, '#35353b'], [1, '#0c0c0f']]),
      headOver: `<g data-sway="2,2,0,240,112"><path d="M184 118L172 6L206 78L212-26L236 72L256-40L268 74L300-12L296 118Z" fill="url(#${p}mo)" stroke="#6d0a40" stroke-width="4" stroke-linejoin="round"/></g><circle cx="98" cy="262" r="9" fill="none" stroke="#cfd4dc" stroke-width="3"/>`,
      bodyOver: `<path d="M118 350C98 420 98 500 128 548L352 548C382 500 382 420 362 350L300 374L240 444L180 374Z" fill="url(#${p}lt)"/><path d="M180 374L240 444L300 374Z" fill="#d6d6d0"/><path d="M232 392L222 414L238 412L230 434L254 406L240 408Z" fill="#e0245e"/>
        <path d="M118 350L182 374L216 420L148 404Z M362 350L298 374L264 420L332 404Z" fill="#46464e" stroke="#0c0c0f" stroke-width="3"/><path d="M240 444L240 548" stroke="#aab0ba" stroke-width="5" stroke-dasharray="3 3"/>` +
        [[150, 388], [160, 400], [170, 412], [330, 388], [320, 400], [310, 412], [140, 366], [340, 366]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#d9dee6" stroke="#6b717c"/>`).join(''),
      armU: `<path d="M-23-12C-31 20-30 60-27 80L27 80C30 60 31 20 23-12Z" fill="url(#${p}lt)"/><circle cx="0" cy="12" r="4" fill="#d9dee6"/><path d="M0 24L0 78" stroke="#aab0ba" stroke-width="3" stroke-dasharray="2 3"/>`,
      armF: `<path d="M-21 0L-23 54L23 54L21 0Z" fill="url(#${p}lt)"/><path d="M-23 54L23 54" stroke="#d9dee6" stroke-width="4"/><circle cx="-12" cy="44" r="3" fill="#d9dee6"/><circle cx="12" cy="44" r="3" fill="#d9dee6"/>`
    }),
    wizard: (p) => ({
      defs: lin(p + 'rb', [[0, '#5a35b0'], [1, '#1d1050']]) + lin(p + 'ht', [[0, '#4a3aa8'], [1, '#1a1250']]) + lin(p + 'bd', [[0, '#ffffff'], [1, '#cfd0d8']]),
      headOver: `<path d="M24 112C80 144 400 144 456 112C400 70 80 70 24 112Z" fill="url(#${p}ht)" stroke="#120c3a" stroke-width="5"/>
        <g data-sway="4,1.1,0,240,100"><path d="M116 104C150 30 190-30 244-122C290-150 336-134 326-102C306-80 360 20 364 104C300 130 190 130 116 104Z" fill="url(#${p}ht)" stroke="#120c3a" stroke-width="5"/><path d="M120 100C190 124 300 124 360 100L362 86C300 108 190 108 124 86Z" fill="#e8b830"/>
        ${star(200, 20, 14, '#ffe27a')}${star(290, -30, 11, '#ffe27a')}${star(250, 62, 9, '#fff1b0')}${star(168, 70, 7, '#fff1b0')}</g>`,
      jaw: `<path d="M118 262C128 340 190 392 240 440C290 392 352 340 362 262C330 296 150 296 118 262Z" fill="url(#${p}bd)" stroke="#aeb0bd" stroke-width="3"/><path d="M200 330C210 360 226 384 240 410M280 330C270 360 254 384 240 410M170 300C180 330 196 350 208 366" stroke="#b6b8c6" stroke-width="3" fill="none"/>`,
      bodyOver: `<path d="M108 345C88 430 66 520 56 580L424 580C414 520 392 430 372 345C326 376 154 376 108 345Z" fill="url(#${p}rb)"/><path d="M56 580L424 580L420 560L60 560Z" fill="#e8b830"/><path d="M130 480L350 480" stroke="#e8b830" stroke-width="12"/>` +
        [[160, 420], [320, 430], [110, 520], [250, 520], [370, 520], [200, 400], [290, 400]].map(([x, y]) => star(x, y, 8, '#ffe27a')).join(''),
      armU: `<path d="M-23-12C-35 20-35 60-35 86L35 86C35 60 35 20 23-12Z" fill="url(#${p}rb)"/>`,
      armF: `<path d="M-28 0L-44 76L44 76L28 0Z" fill="url(#${p}rb)"/><path d="M-44 76L44 76" stroke="#e8b830" stroke-width="6"/>`,
      faceOver: [[50, 30], [430, 60], [90, -40], [400, -30], [30, 250], [452, 240]].map(([x, y], i) => `<g data-float="${5 + i},${.6 + i * .1},${i}" data-twinkle="${1.4 + i * .2},${i}">${star(x, y, 8 + (i % 3) * 2, i % 2 ? '#fff1b0' : '#9fc4ff')}</g>`).join('')
    }),
    space: (p) => ({
      defs: lin(p + 'su', [[0, '#ffffff'], [1, '#aab4c4']]) + grad(p + 'gl', [[0, '#bfe6ff'], [1, '#6aa0d8']], 'cx=".5" cy=".4" r=".7"'),
      bodyOver: `<path d="M118 345C98 430 98 510 128 548L352 548C382 510 382 430 362 345C322 372 158 372 118 345Z" fill="url(#${p}su)" stroke="#8793a5" stroke-width="3"/><rect x="198" y="400" width="84" height="56" rx="8" fill="#232a36" stroke="#8793a5" stroke-width="3"/>
        <circle data-twinkle="2,0" cx="216" cy="420" r="6" fill="#ff4d5a"/><circle data-twinkle="1.4,1" cx="240" cy="420" r="6" fill="#4dff9a"/><circle data-twinkle="2.6,2" cx="264" cy="420" r="6" fill="#ffd34d"/><path d="M210 442L270 442" stroke="#4fc3ff" stroke-width="4"/>
        <path d="M122 500L358 500" stroke="#ff8a3d" stroke-width="10"/><circle cx="160" cy="430" r="16" fill="#2b5fd0" stroke="#fff" stroke-width="3"/><path d="M152 432L160 422L168 432Z" fill="#ff4d4d"/>`,
      collarOver: `<ellipse cx="240" cy="348" rx="116" ry="26" fill="#cdd5e0" stroke="#7e8a9a" stroke-width="5"/><ellipse cx="240" cy="344" rx="94" ry="16" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="3"/>`,
      armU: `<path d="M-23-12C-31 20-31 60-29 84L29 84C31 60 31 20 23-12Z" fill="url(#${p}su)" stroke="#8793a5" stroke-width="3"/><path d="M-28 36L28 36" stroke="#ff8a3d" stroke-width="7"/>`,
      armF: `<path d="M-18 0L-20 56L20 56L18 0Z" fill="url(#${p}su)" stroke="#8793a5" stroke-width="3"/><path d="M-24 58C-36 78-32 106-18 110C-6 114 6 114 18 110C32 106 36 78 24 58Z" fill="url(#${p}su)" stroke="#8793a5" stroke-width="3"/>`,
      faceOver: `<ellipse cx="240" cy="190" rx="192" ry="186" fill="url(#${p}gl)" fill-opacity=".14" stroke="#d6ecff" stroke-opacity=".7" stroke-width="6"/><path d="M96 120C110 70 170 30 230 24" stroke="#fff" stroke-opacity=".6" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M86 150C88 140 92 130 96 122" stroke="#fff" stroke-opacity=".5" stroke-width="6" fill="none" stroke-linecap="round"/>
        <path d="M56 296C80 372 400 372 424 296L436 310C410 392 70 392 44 310Z" fill="#cdd5e0" stroke="#7e8a9a" stroke-width="4"/><path d="M240 6L240-34" stroke="#8793a5" stroke-width="5"/><circle data-twinkle="2.2,0" cx="240" cy="-38" r="8" fill="#ff4d5a"/>`
    }),
    royal: (p) => ({
      defs: lin(p + 'cp', [[0, '#d02248'], [1, '#620a22']]) + lin(p + 'tu', [[0, '#3a4cb0'], [1, '#141c55']]) + lin(p + 'gd', [[0, '#fff0a0'], [.5, '#f0b83a'], [1, '#b07814']]),
      back: `<path d="M116 332C34 440 14 540 8 580L472 580C466 540 446 440 364 332Z" fill="url(#${p}cp)"/><path d="M116 332C150 400 330 400 364 332L350 330C320 380 160 380 130 330Z" fill="#f3e6c8" opacity=".5"/>`,
      bodyOver: `<path d="M128 350C110 430 110 510 140 550L340 550C370 510 370 430 352 350C312 374 168 374 128 350Z" fill="url(#${p}tu)"/><path d="M236 374L236 550L244 550L244 374Z" fill="url(#${p}gd)"/>` + [410, 450, 490, 520].map(y => `<circle cx="240" cy="${y}" r="6" fill="url(#${p}gd)" stroke="#8a5a10"/>`).join('') + `<circle cx="240" cy="392" r="15" fill="url(#${p}gd)" stroke="#8a5a10" stroke-width="2"/><circle cx="240" cy="392" r="6" fill="#e0245e"/>`,
      collarOver: Array.from({ length: 12 }, (_, i) => { const a = Math.PI * (.05 + i * .082); const x = 240 - Math.cos(a) * 110, y = 336 + Math.sin(a) * 40; return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="19" fill="#faf8f2" stroke="#d8d4c8" stroke-width="2"/><path d="M${(x - 3).toFixed(1)} ${(y - 4).toFixed(1)}l3 9l3-9" stroke="#222" stroke-width="2.5" fill="none"/>`; }).join(''),
      headOver: `<path d="M150 116L148 66L190 92L214 44L240 84L266 44L290 92L332 66L330 116Q240 130 150 116Z" fill="url(#${p}gd)" stroke="#8a5a10" stroke-width="4" stroke-linejoin="round"/><circle cx="214" cy="52" r="6" fill="#e0245e"/><circle cx="266" cy="52" r="6" fill="#2fa8ff"/><circle cx="240" cy="108" r="7" fill="#2fd07a"/><path d="M150 108Q240 122 330 108" stroke="#8a5a10" stroke-opacity=".5" stroke-width="3" fill="none"/>
        <path d="M240 238C222 226 196 228 176 244C200 240 220 244 240 246C260 244 280 240 304 244C284 228 258 226 240 238Z" fill="#33231a" stroke="#1a0e08" stroke-width="1.5"/>`,
      faceOver: `<circle cx="310" cy="150" r="48" fill="#fff" fill-opacity=".08" stroke="url(#${p}gd)" stroke-width="6"/><path d="M342 184C360 230 350 290 330 330" stroke="#f0b83a" stroke-width="3" fill="none" stroke-dasharray="4 3"/>`
    }),
    cyber: (p) => ({
      defs: lin(p + 'mt', [[0, '#8794a6'], [1, '#3b4652']]) + grad(p + 'co', [[0, '#e8ffff'], [.5, '#35f0ff'], [1, '#0a6a7a']], 'cx=".5" cy=".5" r=".6"'),
      headOver: `<path d="M118 120C160 94 320 94 362 120L352 136C300 120 180 120 128 136Z" fill="url(#${p}mt)" stroke="#232b34" stroke-width="3"/>` + [150, 200, 280, 330].map(x => `<circle cx="${x}" cy="112" r="4" fill="#cfd8e2" stroke="#232b34"/>`).join('') + `<path d="M240 100L240 38" stroke="#8794a6" stroke-width="5"/><circle data-twinkle="3,0" cx="240" cy="34" r="8" fill="#35f0ff"/>`,
      bodyOver: `<rect x="186" y="396" width="108" height="100" rx="14" fill="url(#${p}mt)" stroke="#232b34" stroke-width="4"/><circle data-twinkle="1.6,0" cx="240" cy="438" r="24" fill="url(#${p}co)" stroke="#232b34" stroke-width="3"/>` + [466, 474, 482].map(y => `<path d="M204 ${y}L276 ${y}" stroke="#232b34" stroke-width="3"/>`).join('') + [[196, 406], [284, 406], [196, 486], [284, 486]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.5" fill="#cfd8e2"/>`).join(''),
      collarOver: [0, 1, 2].map(i => `<path d="M${150 + i * 6} ${338 + i * 10}Q240 ${362 + i * 10} ${330 - i * 6} ${338 + i * 10}" stroke="#232b34" stroke-width="9" fill="none"/><path d="M${150 + i * 6} ${338 + i * 10}Q240 ${362 + i * 10} ${330 - i * 6} ${338 + i * 10}" stroke="#8794a6" stroke-width="4" fill="none"/>`).join(''),
      armU: `<path d="M-17 4L17 4L15 70L-15 70Z" fill="url(#${p}mt)" stroke="#232b34" stroke-width="3"/>` + [20, 36, 52].map(y => `<path d="M-16 ${y}L16 ${y}" stroke="#232b34" stroke-width="3"/>`).join('') + `<circle cx="0" cy="76" r="15" fill="#3b4652" stroke="#232b34" stroke-width="3"/><circle data-twinkle="2.4,1" cx="0" cy="76" r="5" fill="#35f0ff"/>`,
      armF: `<path d="M-14 8L14 8L12 60L-12 60Z" fill="url(#${p}mt)" stroke="#232b34" stroke-width="3"/><path d="M-13 30L13 30" stroke="#232b34" stroke-width="3"/>`,
      jaw: [-60, -30, 0, 30, 60].map(x => `<path d="M${240 + x} 292L${240 + x} 318" stroke="#35f0ff" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"/>`).join(''),
      faceOver: `<circle cx="170" cy="150" r="46" fill="none" stroke="url(#${p}mt)" stroke-width="9"/><circle cx="170" cy="150" r="36" fill="none" stroke="#35f0ff" stroke-opacity=".8" stroke-width="3"/><path data-twinkle="1.5,0" d="M120 232C140 220 150 232 170 222M310 224C330 214 350 226 364 218M96 196L96 180L108 170" stroke="#35f0ff" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="90" cy="206" r="7" fill="#8794a6" stroke="#232b34" stroke-width="2"/><circle cx="390" cy="206" r="7" fill="#8794a6" stroke="#232b34" stroke-width="2"/>`
    })
  };

  /* ---------- grain texture (generated once) ---------- */
  let grainURL = null;
  function grain() {
    if (grainURL !== null) return grainURL;
    try {
      const c = document.createElement('canvas'); c.width = c.height = 96; const g = c.getContext('2d');
      let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
      for (let i = 0; i < 900; i++) { g.fillStyle = r() > .5 ? 'rgba(235,255,170,.28)' : 'rgba(10,40,10,.26)'; g.beginPath(); g.arc(r() * 96, r() * 96, .5 + r() * 1.1, 0, 6.3); g.fill(); }
      grainURL = c.toDataURL();
    } catch (e) { grainURL = ''; }
    return grainURL;
  }

  /* ---------- the character ---------- */
  class PipCharacter {
    constructor(host, opts = {}) {
      this.host = host; this.p = (opts.prefix || 'pip') + '-'; this.interactive = !!opts.interactive;
      this.st = Object.assign({}, DEF); this.mood = 'stoned'; this.costume = null; this.t = 0;
      this.expr = null; this.exprEnd = 0; this.blink = { t: 0, next: 2, phase: -1, n: 0 }; this.beat = 0; this.visemes = null; this.speechFlap = false;
      this.boost = { sway: 0, until: 0 }; this.gesture = null; this.looking = { until: 0, x: 0, y: 0 }; this.glitchUntil = 0; this.bobUntil = 0; this.floatUntil = 0;
      this.build();
    }
    build() {
      const p = this.p, g = grain();
      const use = (id, grad, stroke) => `<use href="#${p}${id}" fill="url(#${p}${grad})" ${stroke ? `stroke="var(--line)" stroke-width="${stroke}" stroke-linejoin="round"` : ''}/>` + (g ? `<use href="#${p}${id}" fill="url(#${p}grain)"/>` : '') + `<use href="#${p}${id}" fill="url(#${p}shine)"/>`;
      const eye = (i) => { const [ex, ey] = M.eyes[i];
        return `<g id="${p}eye${i}"><circle cx="${ex}" cy="${ey - 2}" r="50" fill="url(#${p}hskin)" stroke="var(--line)" stroke-width="5"/>${g ? `<circle cx="${ex}" cy="${ey - 2}" r="50" fill="url(#${p}grain)"/>` : ''}
          <circle cx="${ex}" cy="${ey}" r="${M.er}" fill="var(--sclera)" stroke="var(--line)" stroke-width="4"/><circle cx="${ex}" cy="${ey}" r="${M.er}" fill="url(#${p}ball)"/>
          <g id="${p}pg${i}"><circle id="${p}iris${i}" r="20" fill="#000" cx="${ex}" cy="${ey}"/><ellipse id="${p}pup${i}" cx="${ex}" cy="${ey}" rx="12" ry="12" fill="#0d1612"/><circle id="${p}gl${i}" r="4.5" fill="#fff" cx="${ex + 5}" cy="${ey - 6}"/></g>
          <g clip-path="url(#${p}clip${i})"><path id="${p}lid${i}" fill="url(#${p}hskin)" stroke="var(--line)" stroke-width="4" stroke-linejoin="round"/><path id="${p}llid${i}" fill="url(#${p}hskin)" stroke="var(--line)" stroke-width="4"/></g>
          <path id="${p}brow${i}" fill="none" stroke="var(--skinD)" stroke-width="9" stroke-linecap="round"/></g>`; };
      const arm = (side) => `<g id="${p}arm${side}"><g id="${p}au${side}">${use('upper', 'bskin', 5)}<g data-slot="armU"></g><g id="${p}af${side}" transform="translate(0 76)"><circle r="14" fill="var(--skinM)"/>${use('fore', 'bskin', 5)}${use('hand', 'bskin', 5)}<path d="M-6 84L-6 100M6 84L6 100" stroke="var(--line)" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/><g data-slot="armF"></g></g></g></g>`;
      this.host.innerHTML = `<svg viewBox="0 -190 480 800" xmlns="${NS}" role="img" aria-label="Pip the frog puppet" style="overflow:visible">
        <defs>
          ${['hskin', 'bskin'].map(n => `<radialGradient id="${p}${n}" gradientUnits="userSpaceOnUse" cx="190" cy="${n === 'hskin' ? 120 : 380}" r="${n === 'hskin' ? 330 : 380}"><stop offset="0" stop-color="var(--skinL)"/><stop offset=".5" stop-color="var(--skinM)"/><stop offset="1" stop-color="var(--skinD)"/></radialGradient>`).join('')}
          <radialGradient id="${p}shine" gradientUnits="userSpaceOnUse" cx="170" cy="130" r="260"><stop offset="0" stop-color="#fff" stop-opacity=".30"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></radialGradient>
          <radialGradient id="${p}ball" cx=".42" cy=".38" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".28"/></radialGradient>
          <radialGradient id="${p}belly" cx=".5" cy=".35" r=".7"><stop offset="0" stop-color="var(--skinL)" stop-opacity=".9"/><stop offset="1" stop-color="var(--skinL)" stop-opacity="0"/></radialGradient>
          <linearGradient id="${p}cavg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--cav)"/><stop offset="1" stop-color="#000" stop-opacity=".8"/></linearGradient>
          ${g ? `<pattern id="${p}grain" width="48" height="48" patternUnits="userSpaceOnUse" opacity=".6"><image href="${g}" width="48" height="48"/></pattern>` : ''}
          <clipPath id="${p}clip0"><circle cx="${M.eyes[0][0]}" cy="${M.eyes[0][1]}" r="${M.er + 1}"/></clipPath><clipPath id="${p}clip1"><circle cx="${M.eyes[1][0]}" cy="${M.eyes[1][1]}" r="${M.er + 1}"/></clipPath>
          <path id="${p}body" d="M168 340C120 380 106 470 138 530C170 562 310 562 342 530C374 470 360 380 312 340Z"/>
          <path id="${p}upper" d="M-15-8C-22 20-21 52-15 78L15 78C21 52 22 20 15-8Z"/><path id="${p}fore" d="M-13 0C-16 25-15 50-11 68L11 68C15 50 16 25 13 0Z"/>
          <path id="${p}hand" d="M-15 60C-27 72-25 94-16 100C-8 106 8 106 16 100C25 94 27 72 15 60Z"/>
          <path id="${p}foot" d="M-34 -50C-42-20-44 10-40 20C-52 26-56 40-44 46C-34 52-24 50-16 48C-10 54 0 54 6 48C14 52 26 52 34 46C46 40 42 26 34 20C34 0 30-30 24-50Z"/>
          <path id="${p}collar" d="M138 338L148 376L172 348L186 388L208 354L226 394L240 358L254 394L272 354L294 388L308 348L332 376L342 338Q240 312 138 338Z"/>
          <path id="${p}headU"/><path id="${p}jawP"/>
          <filter id="${p}blur"><feGaussianBlur stdDeviation="7"/></filter>
          <g data-slot="defs"></g>
        </defs>
        <ellipse cx="240" cy="578" rx="150" ry="16" fill="#000" opacity=".4" filter="url(#${p}blur)"/>
        <g id="${p}rig">
          <g data-slot="back"></g>
          <g id="${p}legs">${['L', 'R'].map((s, i) => `<g transform="translate(${i ? 292 : 188} 560)${i ? ' scale(-1 1)' : ''}">${use('foot', 'bskin', 5)}</g>`).join('')}</g>
          ${use('body', 'bskin', 6)}<ellipse cx="240" cy="470" rx="70" ry="78" fill="url(#${p}belly)"/>
          <g data-slot="bodyOver"></g>
          <g id="${p}armsG"><g id="${p}armLw" transform="translate(${M.sh[0][0]} ${M.sh[0][1]})">${arm('L')}</g><g id="${p}armRw" transform="translate(${M.sh[1][0]} ${M.sh[1][1]}) scale(-1 1)">${arm('R')}</g></g>
          <g id="${p}collarG">${use('collar', 'bskin', 5)}</g>
          <g data-slot="collarOver"></g>
          <g id="${p}head">
            <g data-slot="headBack"></g>
            <path id="${p}cav" fill="url(#${p}cavg)"/><ellipse id="${p}tongue" fill="var(--tongue)"/><path id="${p}teethU" fill="var(--teeth)" stroke="#0004" stroke-width="1"/><path id="${p}teethL" fill="var(--teeth)" stroke="#0004" stroke-width="1"/>
            ${use('jawP', 'hskin', 7)}<g id="${p}jawSlot" data-slot="jaw"></g>
            ${use('headU', 'hskin', 7)}
            <path id="${p}seam" fill="none" stroke="var(--line)" stroke-width="5" stroke-linecap="round"/><path id="${p}crease" fill="none" stroke="var(--line)" stroke-width="4" stroke-linecap="round" opacity="0"/>
            <ellipse id="${p}tint" cx="240" cy="230" rx="150" ry="120" fill="#b9c93a" opacity="0"/>
            <path d="M214 206q8 6 14 0M252 206q6 6 14 0" fill="none" stroke="var(--line)" stroke-width="4" stroke-linecap="round"/>
            <g id="${p}blush" opacity="0"><ellipse cx="118" cy="226" rx="26" ry="14" fill="#f08a84"/><ellipse cx="362" cy="226" rx="26" ry="14" fill="#f08a84"/></g>
            <g data-slot="headOver"></g>
            ${eye(0)}${eye(1)}
            <g id="${p}tears" opacity="0"><path d="M138 196Q120 232 140 244Q160 232 138 196Z" fill="#8de0f0" opacity=".85"/><path d="M342 196Q324 232 344 244Q364 232 342 196Z" fill="#8de0f0" opacity=".85"/></g>
            <g id="${p}shades" opacity="0"><path d="M112 124h110q8 0 8 10v28q0 18-18 18h-72q-26 0-28-26z M250 134q0-10 8-10h110l8 38q-2 26-28 26h-72q-18 0-18-18z" fill="#0b0d10" stroke="#222" stroke-width="3"/><path d="M222 134h28" stroke="#0b0d10" stroke-width="7"/><path d="M130 134l30 0M268 134l30 0" stroke="#fff" stroke-opacity=".5" stroke-width="4" stroke-linecap="round"/></g>
            <g id="${p}sweat" opacity="0"><path d="M386 132Q374 156 386 166Q398 156 386 132Z" fill="#9fe3ef"/></g>
            <g id="${p}hearts" opacity="0"><path d="M70 40q-14-16-2-26q10-6 14 4q6-12 18-4q10 12-8 26l-12 10z" fill="#ff5a8a"/><path d="M400 20q-10-12-1-19q7-4 10 3q4-8 12-3q8 8-5 19l-8 7z" fill="#ff7aa0"/></g>
            <g id="${p}zzz" opacity="0" fill="#e0f0b8" font-family="sans-serif" font-weight="700"><text x="390" y="60" font-size="34">z</text><text x="420" y="22" font-size="24">z</text></g>
            <g data-slot="faceOver"></g>
          </g>
        </g></svg>`;
      this.svg = this.host.firstChild; const q = (id) => this.svg.querySelector('#' + p + id);
      this.el = {}; ['rig', 'head', 'armLw', 'armRw', 'auL', 'auR', 'afL', 'afR', 'headU', 'jawP', 'cav', 'tongue', 'teethU', 'teethL', 'seam', 'crease', 'tint', 'blush', 'tears', 'shades', 'sweat', 'hearts', 'zzz', 'jawSlot', 'collarG', 'eye0', 'eye1', 'lid0', 'lid1', 'llid0', 'llid1', 'brow0', 'brow1', 'pup0', 'pup1', 'iris0', 'iris1', 'gl0', 'gl1', 'pg0', 'pg1']
        .forEach(k => this.el[k] = q(k));
      this.slots = {}; this.svg.querySelectorAll('[data-slot]').forEach(s => (this.slots[s.dataset.slot] = this.slots[s.dataset.slot] || []).push(s));
    }
    setCostume(c) {
      this.costume = c; const s = this.host.style, k = c.skin;
      s.setProperty('--skinL', k.L); s.setProperty('--skinM', k.M); s.setProperty('--skinD', k.D); s.setProperty('--line', k.line);
      const f = c.face, e = f.eye; s.setProperty('--sclera', e.sclera); s.setProperty('--tongue', f.tongue); s.setProperty('--cav', f.cavity); s.setProperty('--teeth', f.teeth ? f.teeth.color : '#fff');
      Object.keys(this.slots).forEach(n => this.slots[n].forEach(x => { x.innerHTML = ''; }));
      const parts = {}; c.layers.forEach(id => { const o = LAYERS[id](this.p); Object.keys(o).forEach(sl => parts[sl] = (parts[sl] || '') + o[sl]); });
      Object.keys(parts).forEach(sl => { (this.slots[sl] || []).forEach(x => { x.innerHTML = parts[sl]; }); });
      this.el.collarG.style.display = c.collar ? '' : 'none'; if (c.collar) this.el.collarG.querySelector('use').setAttribute('fill', c.collar);
      // eyes
      [0, 1].forEach(i => { const irisEl = this.el['iris' + i]; irisEl.style.display = e.iris ? '' : 'none'; if (e.iris) { irisEl.setAttribute('fill', e.iris); irisEl.setAttribute('r', e.irisR || 20); } });
      this.el.brow0.style.display = this.el.brow1.style.display = f.brows ? '' : 'none';
      this.sways = Array.from(this.svg.querySelectorAll('[data-sway]')).map(n => { const [a, sp, ph, x, y] = n.dataset.sway.split(',').map(Number); return { n, a, sp, ph, x, y }; });
      this.floats = Array.from(this.svg.querySelectorAll('[data-float]')).map(n => { const [a, sp, ph] = n.dataset.float.split(',').map(Number); return { n, a, sp, ph }; });
      this.twinks = Array.from(this.svg.querySelectorAll('[data-twinkle]')).map(n => { const [sp, ph] = n.dataset.twinkle.split(',').map(Number); return { n, sp, ph }; });
      this.render(0);
    }
    setMood(m) { if (MOODS[m]) this.mood = m; }
    express(def) { // momentary costume expression layered over the mood
      this.expr = def; this.exprEnd = this.t + def.dur; this.gesture = null;
      if (def.boost) this.boost = { sway: 3, until: this.t + def.dur };
      if (def.blink) { this.blink.phase = 0; this.blink.style = def.blink; this.blink.t = 0; }
      if (def.bob) this.bobUntil = this.t + def.dur; if (def.float) this.floatUntil = this.t + def.dur; if (def.glitch) this.glitchUntil = this.t + def.dur;
    }
    nudge(px, py, dur) { this.looking = { until: this.t + dur, x: px, y: py }; }
    pulse(v = 1) { this.beat = Math.max(this.beat, v); }
    target() {
      const c = this.costume, f = c.face, T = Object.assign({}, DEF, MOODS[this.mood], c.moodOverrides[this.mood] || {});
      T.lid += f.lidBias; T.browY += f.brow.y; T.browRot += f.brow.rot; T.smile += f.smile - 0.05;
      if (f.teeth && !T.teeth) T.teeth = 0; T.tongue = T.tongue || 0;
      if (this.expr && this.t < this.exprEnd) Object.assign(T, this.expr.p);
      else this.expr = null;
      if (this.looking.until > this.t && !(this.expr && 'px' in this.expr.p)) { T.px = this.looking.x; T.py = this.looking.y; }
      return T;
    }
    render(dt) {
      this.t += dt; const t = this.t, c = this.costume, f = c.face, S = this.st, T = this.target(), el = this.el, p = this.p;
      const rate = 1 - Math.exp(-f.speed * dt), fast = 1 - Math.exp(-28 * dt);
      const speaking = !!this.visemes;
      for (const k in T) { if (k === 'open' || k === 'wide') continue; S[k] = dt ? lerp(S[k], T[k], rate) : T[k]; }
      let vis = this.visemes; let openT = T.open, wideT = T.wide;
      if (vis) { openT = Math.max(vis.open, 0.04); wideT = vis.wide; }
      else if (this.speechFlap) { openT = 0.15 + 0.5 * Math.abs(Math.sin(t * 9) * Math.sin(t * 3.3)); wideT = 0.8 + 0.3 * Math.sin(t * 5); }
      if (T.shake > 0.9 && this.expr && this.expr.laugh) openT = Math.max(openT, 0.4 + 0.35 * Math.abs(Math.sin(t * 11)));
      if (this.mood === 'laughing') openT = Math.max(openT, 0.35 + 0.3 * Math.abs(Math.sin(t * 10)));
      const mr = (speaking || this.speechFlap) ? fast : rate; S.open = dt ? lerp(S.open, openT, mr) : openT; S.wide = dt ? lerp(S.wide, wideT, mr) : wideT;
      // blink
      const B = this.blink; let bl = 0; B.t += dt;
      if (B.phase < 0 && B.t > B.next) { B.phase = 0; B.t = 0; B.style = f.blink.style; }
      if (B.phase >= 0) { const dur = B.style === 'slow' ? .55 : .2, n = B.style === 'double' ? 2 : 1; const k = B.t / dur; if (k >= n) { B.phase = -1; B.t = 0; B.next = f.blink.every[0] + Math.random() * (f.blink.every[1] - f.blink.every[0]); } else bl = Math.sin(Math.PI * (k % 1)); if (B.style === 'double' && k < n) bl = Math.sin(Math.PI * (k % 1)); }
      // secondary motion
      const idle = c.idle, bp = Math.sin(t * idle.speed * 1.6), glitch = this.glitchUntil > t;
      let bob = bp * idle.bob * .6, hy = S.headY, hr = S.headRot + Math.sin(t * idle.speed * .9) * 1.6 * idle.sway, hx = 0;
      if (idle.kind === 'space' || this.floatUntil > t) bob += Math.sin(t * .7) * 9 * (this.floatUntil > t ? 2 : 1);
      if (idle.kind === 'punk' || this.bobUntil > t) { const b = Math.max(0, Math.sin(t * (this.bobUntil > t ? 7 : 3.2))); hy += b * (this.bobUntil > t ? 9 : 3); }
      if (idle.kind === 'evil') hr += Math.sin(t * .35) * 2;
      if (idle.kind === 'royal') hy -= 4;
      if (S.shake) hx += Math.sin(t * 42) * S.shake * 3;
      if (glitch) { hx += (Math.random() - .5) * 14; hy += (Math.random() - .5) * 6; }
      this.beat *= Math.exp(-dt * 7); hy += this.beat * 9;
      let ax = 0; if (this.expr && this.expr.scan) ax = Math.sin(t * 4);
      const sq = 1 + Math.sin(t * 1.6 * idle.speed) * .012 - this.beat * .02;
      el.rig.setAttribute('transform', `translate(0 ${(bob).toFixed(2)}) translate(240 570) scale(${(1 / sq).toFixed(4)} ${sq.toFixed(4)}) translate(-240 -570)`);
      el.head.setAttribute('transform', `translate(${hx.toFixed(1)} ${hy.toFixed(1)}) rotate(${hr.toFixed(2)} 240 330) translate(240 330) scale(${c.head.sx} ${c.head.sy}) translate(-240 -330)`);
      // face geometry
      const y0 = M.y0, hw = M.hw * S.wide, sm = Math.max(-1, Math.min(1.3, S.smile)), lift = sm * 24, cy = y0 - lift, op = Math.max(0, S.open);
      const D = op * 68 * f.jaw * (this.expr && this.expr.p.open > .9 ? 1.1 : 1), midU = y0 + 4 + sm * 8, cU = 2 * midU - cy, cL = 2 * (midU + D) - cy;
      const sw = Math.max(M.hw, hw), SL = 240 - sw, SR = 240 + sw, LX = 240 - hw, RX = 240 + hw;
      el.headU.setAttribute('d', `M${SL} ${y0}C${SL - 34} ${y0 - 14} ${SL - 38} 170 ${SL - 8} 138C${SL + 26} 102 190 96 240 96C290 96 ${SR - 26} 102 ${SR + 8} 138C${SR + 38} 170 ${SR + 34} ${y0 - 14} ${SR} ${y0}L${RX} ${cy}Q240 ${cU} ${LX} ${cy}Z`);
      el.jawP.setAttribute('d', `M${SL} ${y0}L${LX} ${cy}Q240 ${cL} ${RX} ${cy}L${SR} ${y0}C${SR + 2} ${y0 + 42 + D} ${SR - 46} ${338 + D} 240 ${342 + D}C${SL + 46} ${338 + D} ${SL - 2} ${y0 + 42 + D} ${SL} ${y0}Z`);
      el.cav.setAttribute('d', `M${LX} ${cy}Q240 ${cU} ${RX} ${cy}Q240 ${cL} ${LX} ${cy}Z`);
      el.cav.style.opacity = op > .02 ? 1 : 0;
      const tg = Math.min(1, op * 1.6), tongueOut = S.tongue;
      el.tongue.setAttribute('cx', 240); el.tongue.setAttribute('cy', (midU + D * (.82 + tongueOut * .5)).toFixed(1)); el.tongue.setAttribute('rx', (hw * .42).toFixed(1)); el.tongue.setAttribute('ry', (6 + D * .22 + tongueOut * 14).toFixed(1)); el.tongue.style.opacity = op > .1 || tongueOut > .1 ? 1 : 0;
      if (tongueOut > .1) el.tongue.setAttribute('cy', (midU + D * .9 + 20 * tongueOut).toFixed(1));
      el.seam.setAttribute('d', `M${LX - 2} ${cy}Q240 ${cU} ${RX + 2} ${cy}`);
      el.crease.setAttribute('d', `M${LX - 14} ${cy - 12}q-6 12 4 24M${RX + 14} ${cy - 12}q6 12 -4 24`); el.crease.style.opacity = Math.max(0, sm) * .7;
      // teeth
      const tf = f.teeth, tv = Math.max(S.teeth, tf ? 0.0 : 0) * (op > .08 ? 1 : 0), tc = tf || (S.teeth > .1 ? { upper: 6, lower: 0, len: 8 } : null);
      const mkTeeth = (n, len, dir, midY, ctl) => { if (!n || !tc) return ''; let d = ''; for (let i = 0; i < n; i++) { const u = (i + .5) / n, a = 1 - u, x = a * a * LX + 2 * a * u * 240 + u * u * RX, y = a * a * cy + 2 * a * u * ctl + u * u * cy; const w = (RX - LX) / n * .42; d += `M${(x - w).toFixed(1)} ${y.toFixed(1)}L${x.toFixed(1)} ${(y + dir * len).toFixed(1)}L${(x + w).toFixed(1)} ${y.toFixed(1)}Z`; } return d; };
      const showT = (tf ? (op > .06 ? 1 : (S.teeth > .2 ? 1 : 0)) : (S.teeth > .2 && op > .1 ? 1 : 0));
      el.teethU.setAttribute('d', showT && tc ? mkTeeth(tc.upper, tc.len * (tf ? 1 : S.teeth), 1, midU, cU) : ''); el.teethL.setAttribute('d', showT && tc && tc.lower ? mkTeeth(tc.lower, tc.len * .9, -1, midU + D, cL) : '');
      el.jawSlot.setAttribute('transform', `translate(0 ${D.toFixed(1)})`);
      // eyes
      const e = f.eye, es = e.scale * S.eyeS;
      for (let i = 0; i < 2; i++) {
        const [ex, ey] = M.eyes[i], r = M.er, side = i ? -1 : 1;
        const lidv = Math.max(0, Math.min(1, Math.max(S.lid, bl) )), yb = ey - r - 8 + lidv * (2 * r + 16), tl = S.tilt * 14;
        const yIn = yb + tl, yOut = yb - tl * .7, yR = i ? yOut : yIn, yL = i ? yIn : yOut, cc = (yL + yR) / 2 + 2 * (3 + lidv * 5);
        el['lid' + i].setAttribute('d', `M${ex - r - 6} ${ey - r - 10}H${ex + r + 6}V${yR.toFixed(1)}Q${ex} ${cc.toFixed(1)} ${ex - r - 6} ${yL.toFixed(1)}Z`);
        const yl = ey + r + 8 - S.lidLow * r * 1.1; el['llid' + i].setAttribute('d', `M${ex - r - 6} ${ey + r + 10}H${ex + r + 6}V${yl.toFixed(1)}Q${ex} ${(yl - 12).toFixed(1)} ${ex - r - 6} ${yl.toFixed(1)}Z`);
        const lim = (r - e.pupilR * S.pupS) * .72; let px = S.px + (i ? -1 : 1) * S.cross + ax; px = Math.max(-1, Math.min(1, px)); const py = Math.max(-1, Math.min(1, S.py));
        const pcx = ex + px * lim, pcy = ey + py * lim * .8, pr = e.pupilR * S.pupS;
        const pup = el['pup' + i]; pup.setAttribute('cx', pcx); pup.setAttribute('cy', pcy);
        if (e.pupil === 'slit') { pup.setAttribute('rx', pr * .32); pup.setAttribute('ry', pr * 1.9); } else { pup.setAttribute('rx', pr); pup.setAttribute('ry', pr * (e.pupil === 'tiny' ? 1 : 1.02)); }
        el['iris' + i].setAttribute('cx', pcx); el['iris' + i].setAttribute('cy', pcy); el['gl' + i].setAttribute('cx', pcx + pr * .42); el['gl' + i].setAttribute('cy', pcy - pr * .5); el['gl' + i].setAttribute('r', Math.max(2.5, pr * .38));
        const by = ey - 56 + S.browY + (i ? -S.browAsym : 0), rot = S.browRot * side, bc = ex;
        el['brow' + i].setAttribute('d', `M${ex - 36} ${by + 4}Q${ex} ${by - 8} ${ex + 36} ${by + 4}`); el['brow' + i].setAttribute('transform', `rotate(${rot.toFixed(1)} ${bc} ${by})`);
        el['eye' + i].setAttribute('transform', `translate(${ex} ${ey}) scale(${es.toFixed(3)}) translate(${-ex} ${-ey})`);
      }
      el.tint.style.opacity = S.tint; el.blush.style.opacity = Math.min(1, S.cheek); el.tears.style.opacity = S.tears; el.shades.style.opacity = S.shades; el.sweat.style.opacity = S.sweat; el.hearts.style.opacity = S.hearts; el.zzz.style.opacity = S.zzz;
      if (S.tears > .1) el.tears.setAttribute('transform', `translate(0 ${((t * 30) % 26).toFixed(1)})`);
      if (S.hearts > .1) el.hearts.setAttribute('transform', `translate(0 ${(-((t * 18) % 30)).toFixed(1)})`);
      if (S.zzz > .1) el.zzz.setAttribute('transform', `translate(${Math.sin(t * 1.5) * 4} ${(-((t * 14) % 20)).toFixed(1)})`);
      if (S.sweat > .1) el.sweat.setAttribute('transform', `translate(0 ${((t * 14) % 16).toFixed(1)})`);
      // arms
      const sw1 = Math.sin(t * 1.1 * idle.speed) * 2.5 * idle.sway, wv = this.expr && this.expr.wave ? Math.sin(t * 7) * 22 : 0, cast = this.expr && this.expr.id === 'cast' ? Math.sin(t * 6) * 8 : 0;
      const setArm = (g, u, fo, a1, a2) => { this.el[g].setAttribute('transform', this.el[g].getAttribute('transform').replace(/rotate\([^)]*\)/, '').trim() + ''); this.el[u].setAttribute('transform', `rotate(${a1.toFixed(1)})`); this.el[fo].setAttribute('transform', `translate(0 76) rotate(${a2.toFixed(1)})`); };
      const aL1 = S.armL1 + sw1, aR1 = S.armR1 - sw1 + (this.expr && this.expr.wave ? 0 : 0);
      setArm('armLw', 'auL', 'afL', aL1 + (glitch ? (Math.random() - .5) * 20 : 0), S.armL2 + sw1);
      setArm('armRw', 'auR', 'afR', aR1, S.armR2 - sw1 + wv + cast);
      // costume sway & float & twinkle
      const bm = this.boost.until > t ? this.boost.sway : 1;
      for (const s of this.sways) s.n.setAttribute('transform', `rotate(${(Math.sin(t * s.sp + s.ph) * s.a * bm * c.idle.sway).toFixed(2)} ${s.x} ${s.y})`);
      for (const s of this.floats) s.n.setAttribute('transform', `translate(${(Math.cos(t * s.sp * .7 + s.ph) * s.a * .6).toFixed(1)} ${(Math.sin(t * s.sp + s.ph) * s.a).toFixed(1)})`);
      for (const s of this.twinks) s.n.style.opacity = (.55 + .45 * Math.sin(t * s.sp * 2 + s.ph)).toFixed(2);
    }
  }
  P.PipCharacter = PipCharacter; P.MOODS = MOODS; P.MOOD_NAMES = Object.keys(MOODS);
})(window.Pip = window.Pip || {});
