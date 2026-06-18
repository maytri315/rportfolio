/* ============================================================
   RIKYTA A T — Magazine Portfolio JS
   ============================================================ */

// ── DOM refs ─────────────────────────────────────────────────
const introScreen    = document.getElementById('intro-screen');
const introOpenBtn   = document.getElementById('intro-open-btn');
const pageFlipOverlay= document.getElementById('page-flip-overlay');
const appShell       = document.getElementById('app-shell');
const contentPane    = document.getElementById('content-pane');
const sectionContent = document.getElementById('section-content');
const imageColumns   = document.getElementById('image-columns');
const ccCloseBtn     = document.getElementById('cc-close-btn');
const cardDialog     = document.getElementById('card-dialog');
const cardBackdrop   = document.getElementById('card-backdrop');
const cardDialogClose= document.getElementById('card-dialog-close');
const cardDialogContent = document.getElementById('card-dialog-content');

// ── INTRO: book-cover open ────────────────────────────────────
introOpenBtn.addEventListener('click', () => {
  // Book-cover page flip
  introScreen.classList.add('is-flipping');
  pageFlipOverlay.classList.add('is-active');

  setTimeout(() => {
    introScreen.style.display = 'none';
    pageFlipOverlay.classList.remove('is-active');
    appShell.classList.add('is-visible');
    // Auto-open About on first load
    setTimeout(() => renderSection('about'), 200);
  }, 700);
});

// ── BUILD IMAGE COLUMNS ───────────────────────────────────────
const cols = [
  document.querySelector('#col-1 .col-inner'),
  document.querySelector('#col-2 .col-inner'),
  document.querySelector('#col-3 .col-inner'),
];

cols.forEach((col, ci) => {
  if (!COLUMN_IMAGES[ci]) return;
  const imgs = COLUMN_IMAGES[ci];
  for (let rep = 0; rep < 3; rep++) {
    imgs.forEach(({ src, label }) => {
      const item = document.createElement('div');
      item.className = 'col-item';
      item.innerHTML = `<img src="${src}" alt="${label}" loading="lazy" /><span class="label">${label}</span>`;
      col.appendChild(item);
    });
  }
});

// ── ASYNC SCROLL ──────────────────────────────────────────────
const DIRECTIONS = [1, -1, 1];
const positions  = [0, 0, 0];
const SPEED      = 0.55;

// Auto-scroll animation — runs on landing so users SEE it
let autoScrollRAF = null;
let autoScrollActive = true;

function autoScroll() {
  if (!autoScrollActive) return;
  cols.forEach((_, ci) => { positions[ci] += 0.4 * DIRECTIONS[ci]; });
  applyTransforms();
  autoScrollRAF = requestAnimationFrame(autoScroll);
}
autoScrollRAF = requestAnimationFrame(autoScroll);

function stopAutoScroll() {
  autoScrollActive = false;
  if (autoScrollRAF) cancelAnimationFrame(autoScrollRAF);
}

function getColHeight(ci) { return cols[ci].scrollHeight / 3; }

function applyTransforms() {
  cols.forEach((col, ci) => {
    const h = getColHeight(ci);
    positions[ci] = ((positions[ci] % h) + h) % h;
    col.style.transform = `translateY(-${positions[ci]}px)`;
  });
}

// Wheel handler
let ticking = false;
window.addEventListener('wheel', (e) => {
  // Let content-card scroll naturally
  const card = e.target.closest('.content-card, .card-dialog-box');
  if (card) return;

  stopAutoScroll();
  e.preventDefault();
  const delta = e.deltaY * SPEED;
  cols.forEach((_, ci) => { positions[ci] += delta * DIRECTIONS[ci]; });
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(() => { applyTransforms(); ticking = false; });
  }
}, { passive: false });

// Touch scroll
let touchStartY = 0;
window.addEventListener('touchstart', e => {
  touchStartY = e.touches[0].clientY;
}, { passive: true });

window.addEventListener('touchmove', e => {
  const card = e.target.closest('.content-card, .card-dialog-box');
  if (card) return;
  stopAutoScroll();
  e.preventDefault();
  const delta = (touchStartY - e.touches[0].clientY) * SPEED;
  touchStartY = e.touches[0].clientY;
  cols.forEach((_, ci) => { positions[ci] += delta * DIRECTIONS[ci]; });
  applyTransforms();
}, { passive: false });

// ── SECTION NAVIGATION ───────────────────────────────────────
let currentSection = null;

document.querySelectorAll('#section-nav a').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelectorAll('#section-nav a').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    const section = link.dataset.section;
    if (section === currentSection) {
      // Toggle: clicking active section closes pane
      closeContentPane();
      currentSection = null;
      return;
    }
    renderSection(section);
  });
});

// ── CLOSE CONTENT PANE ───────────────────────────────────────
function closeContentPane() {
  contentPane.classList.remove('visible');
  imageColumns.classList.remove('focused');
  currentSection = null;
}

ccCloseBtn.addEventListener('click', closeContentPane);

// Close pane when clicking directly on the blurred background (not the card)
contentPane.addEventListener('click', (e) => {
  if (e.target === contentPane) closeContentPane();
});

// ── RENDER SECTION ────────────────────────────────────────────
function renderSection(sectionKey) {
  if (!SECTIONS[sectionKey]) return;
  currentSection = sectionKey;

  // Page-flip animation on content card
  if (contentPane.classList.contains('visible')) {
    sectionContent.classList.add('section-flip-anim');
    setTimeout(() => {
      sectionContent.classList.remove('section-flip-anim');
      sectionContent.innerHTML = SECTIONS[sectionKey];
      wireInteractivity();
    }, 250);
  } else {
    sectionContent.innerHTML = SECTIONS[sectionKey];
    wireInteractivity();
  }

  contentPane.classList.add('visible');
  imageColumns.classList.add('focused');
  contentPane.querySelector('.content-card').scrollTop = 0;
}

// ── WIRE TABS + CLICKABLE CARDS ───────────────────────────────
function wireInteractivity() {
  // Tabs
  sectionContent.querySelectorAll('.oc-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      sectionContent.querySelectorAll('.oc-tab').forEach(t => t.classList.remove('active'));
      sectionContent.querySelectorAll('.oc-tab-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const target = sectionContent.querySelector(`#${tab.dataset.tab}`);
      if (target) target.classList.add('active');
    });
  });

  // Clickable script/carousel cards → open detail dialog
  sectionContent.querySelectorAll('[data-dialog]').forEach(card => {
    card.addEventListener('click', () => {
      const key = card.dataset.dialog;
      if (CARD_DETAILS[key]) openCardDialog(CARD_DETAILS[key]);
    });
  });
}

// ── CARD DIALOG ───────────────────────────────────────────────
function openCardDialog(html) {
  cardDialogContent.innerHTML = html;
  cardDialog.classList.add('is-open');
  cardDialog.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeCardDialog() {
  cardDialog.classList.remove('is-open');
  cardDialog.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

cardBackdrop.addEventListener('click', closeCardDialog);
cardDialogClose.addEventListener('click', closeCardDialog);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (cardDialog.classList.contains('is-open')) closeCardDialog();
    else if (contentPane.classList.contains('visible')) closeContentPane();
  }
});

// ── SECTION CONTENT ───────────────────────────────────────────
const SECTIONS = {

  // ══ ABOUT ══
  about: `
    <div class="oc-eyebrow">About</div>
    <h2 class="oc-title">Writing For Living.<br>Art For Passion.</h2>
    <p class="oc-tagline">"Words are the craft. Design is where she goes when words aren't enough."</p>
    <div class="oc-body">
      <p>Rikyta A T is what happens when a Gold Medalist literature student refuses just to read the world — and instead rewrites it, one caption, script, and campaign at a time.</p>
      <p>A Master's graduate in English &amp; Communication from Christ University, she managed the department's social media as both writer and design head long before she had a job title for it.</p>
      <p>Then a deliberate leap into a full-time creative role at Hidecor, where she writes reel scripts, social copy, and directs short-form video content. She doesn't pick a lane. She writes the road.</p>
    </div>
    <div class="oc-tags">
      <span class="oc-tag">M.A. English · Christ University</span>
      <span class="oc-tag">Gold Medalist</span>
      <span class="oc-tag">Published Author</span>
      <span class="oc-tag">Graphic Designer</span>
      <span class="oc-tag">Hidecor</span>
      <span class="oc-tag">Wuri.AI</span>
      <span class="oc-tag">ZeroHour (US)</span>
    </div>
    <div class="oc-timeline">
      <div class="oc-tl-item"><div class="oc-tl-year">2026</div><div><div class="oc-tl-title">Creative Writer — Hidecor</div><div class="oc-tl-desc">Reel scripts, social copy, campaign strategy &amp; short-form video direction</div></div></div>
      <div class="oc-tl-item"><div class="oc-tl-year">2025</div><div><div class="oc-tl-title">Freelance — Design &amp; Writing</div><div class="oc-tl-desc">Logo design for ConcertsXIndia (+40% brand recognition), illustrations for ZeroHour US</div></div></div>
      <div class="oc-tl-item"><div class="oc-tl-year">2025</div><div><div class="oc-tl-title">M.A. English, Christ University</div><div class="oc-tl-desc">First Class · Design Head, Lit Fest 2024 &amp; Mélange 2025</div></div></div>
      <div class="oc-tl-item"><div class="oc-tl-year">2024</div><div><div class="oc-tl-title">Social Media Manager &amp; Visual Designer</div><div class="oc-tl-desc">English Dept, Christ University — content calendars, reels, statics</div></div></div>
      <div class="oc-tl-item"><div class="oc-tl-year">2023</div><div><div class="oc-tl-title">Content Strategist Intern — Wuri.AI</div><div class="oc-tl-desc">Narrative design &amp; branching storylines for mobile games</div></div></div>
      <div class="oc-tl-item"><div class="oc-tl-year">2023</div><div><div class="oc-tl-title">B.A. English — Gold Medalist</div><div class="oc-tl-desc">St. Philomena's College · Overall Champion 2022</div></div></div>
      <div class="oc-tl-item"><div class="oc-tl-year">2022</div><div><div class="oc-tl-title">Published: The R.I.D.D.L.E.</div><div class="oc-tl-desc">Poetry collection · BookLeaf Publishing · ISBN: 9789357694902</div></div></div>
    </div>
  `,

  // ══ GRAPHIC DESIGN ══
  graphic: `
    <div class="oc-eyebrow">Graphic Design</div>
    <h2 class="oc-title">Artfolio &amp; Illustrations</h2>
    <p class="oc-tagline">Logo design, brand identity, and illustration work. Click a card to explore.</p>
    <div class="oc-cards-grid">
      <div class="oc-script-card bento-wide" data-dialog="graphic-rikyta">
        <div class="oc-sc-num">★</div>
        <div class="oc-sc-series">Artist / Designer</div>
        <div class="oc-sc-title">I create to translate what words can't hold.</div>
        <a href="https://drive.google.com/file/d/1kvDeFdk4prDj1fXqxIKLYx3SouNHpL0z/view?usp=drive_link" target="_blank" class="oc-link" onclick="event.stopPropagation()">View Full Artfolio ↗</a>
      </div>
      <div class="oc-script-card" data-dialog="graphic-merch">
        <div class="oc-sc-num">01</div>
        <div class="oc-sc-series">Merchandise Design</div>
        <div class="oc-sc-title">Branded Merch</div>
        <div class="oc-sc-arrow">→ Click to explore</div>
      </div>
      <div class="oc-script-card" data-dialog="graphic-comic">
        <div class="oc-sc-num">02</div>
        <div class="oc-sc-series">Sequential Art</div>
        <div class="oc-sc-title">Silent Watcher Comic</div>
        <div class="oc-sc-arrow">→ Click to explore</div>
      </div>
      <div class="oc-script-card" data-dialog="graphic-social">
        <div class="oc-sc-num">03</div>
        <div class="oc-sc-series">Social Media Creatives</div>
        <div class="oc-sc-title">Campaign Visuals</div>
        <div class="oc-sc-arrow">→ Click to explore</div>
      </div>
      <div class="oc-script-card" data-dialog="graphic-storyboard">
        <div class="oc-sc-num">04</div>
        <div class="oc-sc-series">Pre-Production</div>
        <div class="oc-sc-title">Storyboard Work</div>
        <div class="oc-sc-arrow">→ Click to explore</div>
      </div>
    </div>
  `,

  // ══ REEL SCRIPTS ══
  reel: `
    <div class="oc-eyebrow">Hidecor Reel Scripts</div>
    <h2 class="oc-title">Case Studies</h2>
    <p class="oc-tagline">Each script is a full directorial brief — shot list, dialogue, audio cues, UI overlays, and brand logic. Click any card to read the case study.</p>
    <p style="margin-bottom:16px;"><a href="https://www.instagram.com/hidecordesign/" target="_blank" class="oc-link">@hidecordesign ↗</a></p>
    <div class="oc-cards-grid">
      <div class="oc-script-card" data-dialog="reel-01">
        <div class="oc-sc-num">01</div>
        <div class="oc-sc-series">The Decode Series · EP 02</div>
        <div class="oc-sc-title">The Office Decode</div>
        <div class="oc-sc-desc">Would Dunder Mifflin work in 2026? Pop culture familiarity as a design education hook.</div>
        <div class="oc-card-action">Read Case Study</div>
      </div>
      <div class="oc-script-card" data-dialog="reel-02">
        <div class="oc-sc-num">02</div>
        <div class="oc-sc-series">Material Matters · EP 01</div>
        <div class="oc-sc-title">Sandwich Glass</div>
        <div class="oc-sc-desc">A technical material made irresistible using a sandwich analogy and deadpan comedy.</div>
        <div class="oc-card-action">Read Case Study</div>
      </div>
      <div class="oc-script-card" data-dialog="reel-03">
        <div class="oc-sc-num">03</div>
        <div class="oc-sc-series">Interior Design · Hidecor</div>
        <div class="oc-sc-title">Fluted Panels</div>
        <div class="oc-sc-desc">A niche architectural element turned into a visual metaphor-driven emotional narrative.</div>
        <div class="oc-card-action">Read Case Study</div>
      </div>
      <div class="oc-script-card" data-dialog="reel-04">
        <div class="oc-sc-num">04</div>
        <div class="oc-sc-series">Workplace · Hidecor</div>
        <div class="oc-sc-title">Rebel Kid</div>
        <div class="oc-sc-desc">A rebellious narrative for a product launch — anti-corporate tone for an office furniture brand.</div>
        <div class="oc-card-action">Read Case Study</div>
      </div>
      <div class="oc-script-card" data-dialog="reel-05">
        <div class="oc-sc-num">05</div>
        <div class="oc-sc-series">Narrative · Hidecor</div>
        <div class="oc-sc-title">Dungeons &amp; Deadlines</div>
        <div class="oc-sc-desc">Full RPG narrative — turns a broken office into a survival game, then redesigns it.</div>
        <div class="oc-card-action">Read Case Study</div>
      </div>
      <div class="oc-script-card" data-dialog="reel-06">
        <div class="oc-sc-num">06</div>
        <div class="oc-sc-series">Design Education · Hidecor</div>
        <div class="oc-sc-title">Colour Psychology</div>
        <div class="oc-sc-desc">Simplifying complex design theory into irresistible short-form content.</div>
        <div class="oc-card-action">Read Case Study</div>
      </div>
    </div>
  `,

  // ══ CAROUSELS ══
  carousels: `
    <div class="oc-eyebrow">Carousels &amp; Statics</div>
    <h2 class="oc-title">Scroll-Stopping Content</h2>
    <p class="oc-tagline">Social carousels and single-frame statics crafted for Hidecor. Click any card to read the full brief.</p>
    <div class="oc-tabs">
      <button class="oc-tab active" data-tab="tab-carousels">Carousels</button>
      <button class="oc-tab" data-tab="tab-statics">Statics</button>
    </div>
    <div class="oc-tab-panel active" id="tab-carousels">
      <div class="oc-carousel-card is-clickable" data-dialog="car-01">
        <div class="oc-cc-date">Jan 2026 · GCC Series · Hidecor</div>
        <div class="oc-cc-title">GCC Coworking Myths</div>
        <div class="oc-cc-desc">9-slide myth-busting carousel dismantling GCC assumptions about coworking.</div>
        <div class="oc-card-action">Read Brief</div>
      </div>
      <div class="oc-carousel-card is-clickable" data-dialog="car-02">
        <div class="oc-cc-date">Feb 2026 · Valentine's · Hidecor</div>
        <div class="oc-cc-title">If Your Zodiac Had a Design Type</div>
        <div class="oc-cc-desc">12-sign zodiac carousel matching each personality to a Hidecor colour.</div>
        <div class="oc-card-action">Read Brief</div>
      </div>
      <div class="oc-carousel-card is-clickable" data-dialog="car-03">
        <div class="oc-cc-date">Mar 2026 · Office Reimagined · Hidecor</div>
        <div class="oc-cc-title">CRED Office: Reimagined</div>
        <div class="oc-cc-desc">9-slide office concept reveal using CRED's credit-score language.</div>
        <div class="oc-card-action">Read Brief</div>
      </div>
      <div class="oc-carousel-card is-clickable" data-dialog="car-04">
        <div class="oc-cc-date">Mar 2026 · RenderBait · Hidecor</div>
        <div class="oc-cc-title">POV: You Are an Interior Designer</div>
        <div class="oc-cc-desc">7 rage-bait slides for interior designers — client horror stories delivered deadpan.</div>
        <div class="oc-card-action">Read Brief</div>
      </div>
      <div class="oc-carousel-card is-clickable" data-dialog="car-05">
        <div class="oc-cc-date">Feb 2026 · Office Red Flag · Hidecor</div>
        <div class="oc-cc-title">Everyone Wears Headphones All Day</div>
        <div class="oc-cc-desc">7-slide series reframing headphone dependency as acoustic design failure.</div>
        <div class="oc-card-action">Read Brief</div>
      </div>
      <div class="oc-carousel-card is-clickable" data-dialog="car-06">
        <div class="oc-cc-date">Apr 2026 · Office Red Flag · Hidecor</div>
        <div class="oc-cc-title">Your Office Is a Treasure Hunt</div>
        <div class="oc-cc-desc">Converts wasted walking time into a concrete productivity cost — 600 hours/year.</div>
        <div class="oc-card-action">Read Brief</div>
      </div>
      <a href="https://docs.google.com/document/d/1zDm-CbWaM-3d5XR6EyVH8UwW38sBTYr7/edit?usp=sharing" target="_blank" class="oc-link">View All Carousels &amp; Statics ↗</a>
    </div>
    <div class="oc-tab-panel" id="tab-statics">
      <div class="oc-carousel-card is-clickable" data-dialog="stat-01">
        <div class="oc-cc-date">Mar 2026 · Dictionary Series · Hidecor</div>
        <div class="oc-cc-title">Ergonomics</div>
        <div class="oc-cc-desc">"The science of designing office spaces so your body does not hate you by 6 p.m."</div>
        <div class="oc-card-action">Read Brief</div>
      </div>
      <div class="oc-carousel-card is-clickable" data-dialog="stat-02">
        <div class="oc-cc-date">Mar 2026 · Dictionary Series · Hidecor</div>
        <div class="oc-cc-title">Workspitality</div>
        <div class="oc-cc-desc">Coined for Hidecor — blends function with comfort and experience.</div>
        <div class="oc-card-action">Read Brief</div>
      </div>
      <div class="oc-carousel-card is-clickable" data-dialog="stat-03">
        <div class="oc-cc-date">Feb 2026 · Dictionary Series · Hidecor</div>
        <div class="oc-cc-title">RT60</div>
        <div class="oc-cc-desc">Acoustic science made human with a toxic-ex analogy.</div>
        <div class="oc-card-action">Read Brief</div>
      </div>
      <a href="https://docs.google.com/document/d/1zDm-CbWaM-3d5XR6EyVH8UwW38sBTYr7/edit?usp=sharing" target="_blank" class="oc-link">View All Statics ↗</a>
    </div>
  `,

  // ══ CONTENT ══
  content: `
    <div class="oc-eyebrow">Writing Portfolio</div>
    <h2 class="oc-title">The Full Range</h2>
    <p class="oc-tagline">Fiction, articles, LinkedIn content, and graphic design work.</p>
    <div class="oc-tabs">
      <button class="oc-tab active" data-tab="tab-linkedin">LinkedIn</button>
      <button class="oc-tab" data-tab="tab-fiction">Fiction &amp; Scripts</button>
      <button class="oc-tab" data-tab="tab-art">Graphic Design</button>
    </div>
    <div class="oc-tab-panel active" id="tab-linkedin">
      <p style="font-size:0.78rem;color:var(--dim);margin-bottom:16px;line-height:1.6;">Educational LinkedIn posts for a doctoral support brand — PhD students get saves, shares, and community engagement.</p>
      <div class="oc-li-post"><div class="oc-li-badge">LinkedIn · APA Formatting</div><div class="oc-li-title">Still Losing Marks on APA? Stop It.</div><div class="oc-li-desc">Three quick checks before submitting — Header Check, Hanging Indent, Back-Up Rule. Ends with a community CTA.</div></div>
      <div class="oc-li-post"><div class="oc-li-badge">LinkedIn · Doctoral Proposals</div><div class="oc-li-title">Why Your Doctoral Proposal Keeps Getting Sent Back</div><div class="oc-li-desc">Three root causes — vague problem, weak theory alignment, and the Summary Trap in lit reviews.</div></div>
      <div class="oc-li-post"><div class="oc-li-badge">LinkedIn · Theory Alignment</div><div class="oc-li-title">"Why Are You Using This Theory?" — How to Answer Without Freezing</div><div class="oc-li-desc">Uses the "special glasses" metaphor to explain theoretical alignment in plain language.</div></div>
      <div class="oc-li-post"><div class="oc-li-badge">LinkedIn · Literature Review</div><div class="oc-li-title">You've Read 100 Articles. Your Supervisor Says It's "Just a Summary."</div><div class="oc-li-desc">Breaks the summary-vs-synthesis distinction into a single actionable rule.</div></div>
      <div class="oc-li-post"><div class="oc-li-badge">LinkedIn · Academic Voice</div><div class="oc-li-title">The ONE Word That Makes Your Supervisor Think You're Still a Beginner</div><div class="oc-li-desc">Why first-person language undermines doctoral credibility — with before/after examples.</div></div>
    </div>
    <div class="oc-tab-panel" id="tab-fiction">
      <div class="oc-carousel-card"><div class="oc-cc-title">The R.I.D.D.L.E. — Poetry Collection</div><div class="oc-cc-desc">Published debut poetry collection exploring crime, mystery, and the human condition. Available on Flipkart. ISBN: 9789357694902.</div><a href="https://dl.flipkart.com/s/iT171_NNNN" target="_blank" class="oc-link">View on Flipkart ↗</a></div>
      <div class="oc-carousel-card"><div class="oc-cc-title">Game Narrative Design — Wuri.AI</div><div class="oc-cc-desc">Branching storylines and narrative design for mobile games during 2023 internship. Character arcs, dialogue trees, player-choice mechanics.</div><a href="https://docs.google.com/document/d/1imHPEoEVGKI3_9vJxY_U1nYRnTdZGebNzIP70oUW7hE/edit?tab=t.0" target="_blank" class="oc-link">View ↗</a></div>
      <div class="oc-carousel-card"><div class="oc-cc-title">Dungeons &amp; Deadlines — Reel Script</div><div class="oc-cc-desc">Full video-game RPG narrative script for Hidecor — turns a broken office into a survival game, then redesigns it.</div><a href="https://drive.google.com/file/d/1IzTBCVpn-iS_VpbqIfuKwXoSt1VPbmxm/view?usp=sharing" target="_blank" class="oc-link">View ↗</a></div>
    </div>
    <div class="oc-tab-panel" id="tab-art">
      <div class="oc-art-links">
        <a href="https://drive.google.com/drive/folders/1SEB4qQKLiItc5Rmvaf7xYKmcmdz27QTx" target="_blank" class="oc-art-card"><div class="oc-art-card-icon">🎨</div><div class="oc-art-card-title">Artfolio</div><div class="oc-art-card-sub">Logo design, brand identity, illustrations — ConcertsXIndia, ZeroHour US, and more.</div></a>
        <a href="https://drive.google.com/drive/folders/1ZnhDWMqZQGwZsY9v1Po48NQXYiC4cQpp" target="_blank" class="oc-art-card"><div class="oc-art-card-icon">🖼️</div><div class="oc-art-card-title">Artworks</div><div class="oc-art-card-sub">Personal artwork, drawings, and visual experiments.</div></a>
      </div>
    </div>
  `,

  // ══ MORE WORK ══
  morework: `
    <div class="oc-eyebrow">More Work</div>
    <h2 class="oc-title">More Scripts &amp; Creative Work</h2>
    <p class="oc-tagline">Additional scripts, creative writing samples, and branded content work.</p>
    <div class="oc-more-block">
      <p style="font-size:0.85rem;color:var(--dim);margin-bottom:20px;line-height:1.7;">Additional scripts, creative writing samples, and branded content work available in the linked document below.</p>
      <a href="https://drive.google.com/file/d/1ok2tGkknCmJ8pLVn7_8jES_-KugwahE_/view?usp=drive_link" target="_blank" class="oc-link">View Additional Work ↗</a>
    </div>
  `,

  // ══ PUBLICATIONS ══
  publications: `
    <div class="oc-eyebrow">Published Works</div>
    <h2 class="oc-title">On The Shelf</h2>
    <p class="oc-tagline">Three published works across poetry, anthology fiction, and collaborative writing.</p>
    <div class="oc-pub-card"><div class="oc-pub-type">Poetry Collection · BookLeaf Publishing</div><div class="oc-pub-title">The R.I.D.D.L.E.</div><div class="oc-pub-desc">Debut poetry collection exploring crime, mystery, and the human condition. ISBN: 9789357694902. Available on Flipkart.</div><a href="https://dl.flipkart.com/s/iT171_NNNN" target="_blank" class="oc-link">View on Flipkart →</a></div>
    <div class="oc-pub-card"><div class="oc-pub-type">Anthology · Poem</div><div class="oc-pub-title">The Zeal to Succeed</div><div class="oc-pub-desc">Poem titled "Unsuccessfully Successful" — opens with a thunderstorm and a bibliophile who can't sleep in a new city.</div><a href="https://docs.google.com/document/d/1uN-PvJ-BXG8YEeXSdOgyIfag1D4z8kaT/edit?usp=drivesdk" target="_blank" class="oc-link">Read Excerpt →</a></div>
    <div class="oc-pub-card"><div class="oc-pub-type">Anthology · Short Fiction</div><div class="oc-pub-title">Fervid &amp; Unfathomable Words</div><div class="oc-pub-desc">A short crime fiction piece published in this national anthology — available on Flipkart.</div><a href="https://dl.flipkart.com/s/iapZUdNNNN" target="_blank" class="oc-link">View on Flipkart →</a></div>
  `,

  // ══ CONTACT ══
  contact: `
    <div class="oc-eyebrow">Contact</div>
    <h2 class="oc-title">Let's Work Together</h2>
    <p class="oc-tagline">"Words that stop the scroll, tell the story, and make the brand."</p>
    <div class="oc-contact-grid">
      <div class="oc-contact-item"><div class="oc-contact-label">Email</div><div class="oc-contact-value"><a href="mailto:rikytaat@gmail.com">rikytaat@gmail.com</a></div></div>
      <div class="oc-contact-item"><div class="oc-contact-label">Phone</div><div class="oc-contact-value"><a href="tel:+917829303535">+91 7829303535</a></div></div>
      <div class="oc-contact-item"><div class="oc-contact-label">Location</div><div class="oc-contact-value">Mysuru, India — Open to Remote</div></div>
      <div class="oc-contact-item"><div class="oc-contact-label">Open to Freelance</div><div class="oc-contact-value" style="color:var(--accent);font-weight:700;">Yes ✓</div></div>
    </div>
    <div class="oc-avail">
      <div class="oc-avail-label">Available For</div>
      <div class="oc-avail-tags">
        <span class="oc-avail-tag">Copywriting</span>
        <span class="oc-avail-tag">Reel Scripts</span>
        <span class="oc-avail-tag">Brand Content</span>
        <span class="oc-avail-tag">Social Media</span>
      </div>
    </div>
  `,
};

// ── CARD DETAILS (dialog content) ────────────────────────────
const CARD_DETAILS = {
  'reel-01': `
    <div class="oc-eyebrow">Case Study · Reel Script 01</div>
    <h2 class="oc-title" style="font-size:1.6rem;">The Office Decode</h2>
    <p class="oc-tagline">The Decode Series · EP 02 · Hidecor</p>
    <div class="oc-body"><p>Would Dunder Mifflin work in 2026? Pop culture familiarity as a design education hook. This script leverages The Office's iconic open-plan chaos to make the case for purposeful workspace design.</p><p>The result: a reel that feels like a fan video but sells like a case study.</p></div>
    <a href="https://drive.google.com/file/d/1IzTBCVpn-iS_VpbqIfuKwXoSt1VPbmxm/view?usp=sharing" target="_blank" class="oc-link">View Full Script ↗</a>
  `,
  'reel-02': `
    <div class="oc-eyebrow">Case Study · Reel Script 02</div>
    <h2 class="oc-title" style="font-size:1.6rem;">Material Matters: Sandwich Glass</h2>
    <p class="oc-tagline">Material Matters · EP 01 · Hidecor</p>
    <div class="oc-body"><p>A technical material made irresistible using a sandwich analogy and deadpan comedy. The brief: explain a complex glass composite to a non-technical audience without losing them in the first 3 seconds.</p></div>
    <a href="https://drive.google.com/file/d/1IzTBCVpn-iS_VpbqIfuKwXoSt1VPbmxm/view?usp=sharing" target="_blank" class="oc-link">View Full Script ↗</a>
  `,
  'reel-03': `
    <div class="oc-eyebrow">Case Study · Reel Script 03</div>
    <h2 class="oc-title" style="font-size:1.6rem;">Fluted Panels</h2>
    <p class="oc-tagline">Interior Design · Hidecor</p>
    <div class="oc-body"><p>A niche architectural element turned into a visual metaphor-driven emotional narrative. Fluted panels aren't just aesthetic — this script argues they're about feeling held by a space.</p></div>
    <a href="https://drive.google.com/file/d/1IzTBCVpn-iS_VpbqIfuKwXoSt1VPbmxm/view?usp=sharing" target="_blank" class="oc-link">View Full Script ↗</a>
  `,
  'reel-04': `
    <div class="oc-eyebrow">Case Study · Reel Script 04</div>
    <h2 class="oc-title" style="font-size:1.6rem;">Rebel Kid</h2>
    <p class="oc-tagline">Workplace · Hidecor</p>
    <div class="oc-body"><p>Anti-corporate energy for an office furniture brand. The Rebel Kid challenges the beige, boxy, soul-crushing office status quo. Deadpan narration. Loud design. Maximum saves.</p></div>
    <a href="https://drive.google.com/file/d/1IzTBCVpn-iS_VpbqIfuKwXoSt1VPbmxm/view?usp=sharing" target="_blank" class="oc-link">View Full Script ↗</a>
  `,
  'reel-05': `
    <div class="oc-eyebrow">Case Study · Reel Script 05</div>
    <h2 class="oc-title" style="font-size:1.6rem;">Dungeons &amp; Deadlines</h2>
    <p class="oc-tagline">Narrative · Hidecor</p>
    <div class="oc-body"><p>Full video-game RPG narrative for Hidecor — turns a broken office into a survival dungeon, then redesigns it. One of the most ambitious scripts in the Hidecor catalogue. Branching structure, character-driven, and brand-native.</p></div>
    <a href="https://drive.google.com/file/d/1IzTBCVpn-iS_VpbqIfuKwXoSt1VPbmxm/view?usp=sharing" target="_blank" class="oc-link">View Full Script ↗</a>
  `,
  'reel-06': `
    <div class="oc-eyebrow">Case Study · Reel Script 06</div>
    <h2 class="oc-title" style="font-size:1.6rem;">Colour Psychology</h2>
    <p class="oc-tagline">Design Education · Hidecor</p>
    <div class="oc-body"><p>Simplifying complex colour theory into irresistible short-form content. The goal was to make interior designers feel seen and non-designers feel invited. The script walks through 5 colours, one emotion each, with real-room anchors.</p></div>
    <a href="https://drive.google.com/file/d/1IzTBCVpn-iS_VpbqIfuKwXoSt1VPbmxm/view?usp=sharing" target="_blank" class="oc-link">View Full Script ↗</a>
  `,
  'car-01': `
    <div class="oc-eyebrow">Carousel Brief</div>
    <h2 class="oc-title" style="font-size:1.5rem;">GCC Coworking Myths</h2>
    <p class="oc-tagline">Jan 2026 · GCC Series · Hidecor</p>
    <div class="oc-body"><p>9-slide myth-busting carousel dismantling GCC assumptions about coworking — cost, culture, security — ending on a strategic reframe.</p></div>
    <div class="oc-carousel-card" style="margin-top:12px;"><div class="oc-cc-title">Hook</div><div class="oc-cc-desc">Coworking for GCCs. Smart shortcut or expensive compromise?</div></div>
    <div class="oc-carousel-card"><div class="oc-cc-title">Slide 7</div><div class="oc-cc-desc">Coworking is not a strategy. It is a tool.</div></div>
    <div class="oc-carousel-card"><div class="oc-cc-title">CTA</div><div class="oc-cc-desc">We help GCCs choose spaces that fit their growth, not fight it.</div></div>
  `,
  'car-02': `
    <div class="oc-eyebrow">Carousel Brief</div>
    <h2 class="oc-title" style="font-size:1.5rem;">If Your Zodiac Had a Design Type</h2>
    <p class="oc-tagline">Feb 2026 · Valentine's · Hidecor</p>
    <div class="oc-body"><p>12-sign zodiac carousel matching each personality to a Hidecor colour — "swipe right" dating format applied to interior design. Built for shares and tagging.</p></div>
    <div class="oc-carousel-card" style="margin-top:12px;"><div class="oc-cc-title">Scorpio</div><div class="oc-cc-desc">221B Baker Street — Dark, moody, matte black. A lifestyle, not a trend.</div></div>
    <div class="oc-carousel-card"><div class="oc-cc-title">Leo</div><div class="oc-cc-desc">Tequila Sunrise — A statement piece is not an option. It's a basic human right.</div></div>
    <div class="oc-carousel-card"><div class="oc-cc-title">Caption</div><div class="oc-cc-desc">Roses are red, violets are blue — Cupid's busy, so we found a match for you.</div></div>
  `,
  'car-03': `
    <div class="oc-eyebrow">Carousel Brief</div>
    <h2 class="oc-title" style="font-size:1.5rem;">CRED Office: Reimagined</h2>
    <p class="oc-tagline">Mar 2026 · Office Reimagined · Hidecor</p>
    <div class="oc-body"><p>9-slide office concept reveal using CRED's credit-score language to present design decisions as performance metrics.</p></div>
    <div class="oc-carousel-card" style="margin-top:12px;"><div class="oc-cc-title">Hook</div><div class="oc-cc-desc">CRED rewards good credit habits. What would a high-scoring workspace look like?</div></div>
    <div class="oc-carousel-card"><div class="oc-cc-title">Lighting Score</div><div class="oc-cc-desc">+810 — Linear task lights. Consistent illumination. Ideas stay bright.</div></div>
    <div class="oc-carousel-card"><div class="oc-cc-title">Caption CTA</div><div class="oc-cc-desc">If your workspace had a score, what would it be?</div></div>
  `,
  'car-04': `
    <div class="oc-eyebrow">Carousel Brief</div>
    <h2 class="oc-title" style="font-size:1.5rem;">POV: You Are an Interior Designer</h2>
    <p class="oc-tagline">Mar 2026 · RenderBait · Hidecor</p>
    <div class="oc-body"><p>7 rage-bait slides for interior designers — client horror stories delivered deadpan. Engineered for maximum comment rage and share.</p></div>
    <div class="oc-carousel-card" style="margin-top:12px;"><div class="oc-cc-title">Slide 3</div><div class="oc-cc-desc">"Can you do a quick concept render?" — That's called free work. The answer is no. Respectfully.</div></div>
    <div class="oc-carousel-card"><div class="oc-cc-title">Slide 7</div><div class="oc-cc-desc">"We don't want it to look too designed." — This is fine. This is completely fine.</div></div>
    <div class="oc-carousel-card"><div class="oc-cc-title">Caption</div><div class="oc-cc-desc">Tag a designer who's survived all 6.</div></div>
  `,
  'car-05': `
    <div class="oc-eyebrow">Carousel Brief</div>
    <h2 class="oc-title" style="font-size:1.5rem;">This Office Red Flag: Everyone Wears Headphones All Day</h2>
    <p class="oc-tagline">Feb 2026 · Office Red Flag · Hidecor</p>
    <div class="oc-body"><p>7-slide series reframing headphone dependency from "focus culture" into a clear acoustic design failure.</p></div>
    <div class="oc-carousel-card" style="margin-top:12px;"><div class="oc-cc-title">Hook</div><div class="oc-cc-desc">This office red flag looks calm but is deeply distracting.</div></div>
    <div class="oc-carousel-card"><div class="oc-cc-title">Slide 4</div><div class="oc-cc-desc">An office where silence depends on headphones has failed acoustically.</div></div>
  `,
  'car-06': `
    <div class="oc-eyebrow">Carousel Brief</div>
    <h2 class="oc-title" style="font-size:1.5rem;">Your Office Is a Treasure Hunt</h2>
    <p class="oc-tagline">Apr 2026 · Office Red Flag · Hidecor</p>
    <div class="oc-body"><p>Converts wasted walking time into a concrete productivity cost — 600 hours/year — to make the layout problem viscerally felt.</p></div>
    <div class="oc-carousel-card" style="margin-top:12px;"><div class="oc-cc-title">Slide 2</div><div class="oc-cc-desc">40 employees. 15 trips a day. 600 hours of work time lost to bad planning.</div></div>
    <div class="oc-carousel-card"><div class="oc-cc-title">Slide 7</div><div class="oc-cc-desc">Great offices don't exhaust people before noon. They reduce friction.</div></div>
  `,
  'stat-01': `
    <div class="oc-eyebrow">Static Brief</div>
    <h2 class="oc-title" style="font-size:1.5rem;">Ergonomics</h2>
    <p class="oc-tagline">Mar 2026 · Dictionary Series · Hidecor</p>
    <div class="oc-body"><p>"The science of designing office spaces, furniture, and tools so your body does not hate you by 6 p.m." Single-frame definition with an instant CTA.</p></div>
    <div class="oc-carousel-card" style="margin-top:12px;"><div class="oc-cc-title">CTA</div><div class="oc-cc-desc">Spaces that have your back. Design Smarter.</div></div>
  `,
  'stat-02': `
    <div class="oc-eyebrow">Static Brief</div>
    <h2 class="oc-title" style="font-size:1.5rem;">Workspitality</h2>
    <p class="oc-tagline">Mar 2026 · Dictionary Series · Hidecor</p>
    <div class="oc-body"><p>"Workspitality = when work starts acting like hospitality." Coined for Hidecor — blends function with comfort and experience.</p></div>
    <div class="oc-carousel-card" style="margin-top:12px;"><div class="oc-cc-title">Caption</div><div class="oc-cc-desc">When your office treats you like a guest, not just an employee — that's workspitality.</div></div>
  `,
  'stat-03': `
    <div class="oc-eyebrow">Static Brief</div>
    <h2 class="oc-title" style="font-size:1.5rem;">RT60</h2>
    <p class="oc-tagline">Feb 2026 · Dictionary Series · Hidecor</p>
    <div class="oc-body"><p>"How long a room refuses to let sound leave." RT60 explained via a toxic-ex analogy — sound bouncing around every corner and haunting you.</p></div>
    <div class="oc-carousel-card" style="margin-top:12px;"><div class="oc-cc-title">Caption</div><div class="oc-cc-desc">Tired of living in an echo chamber? Let's make your space actually listen.</div></div>
  `,
  'graphic-rikyta': `
    <div class="oc-eyebrow">Graphic Design</div>
    <h2 class="oc-title" style="font-size:1.5rem;">Rikyta AT — Artfolio</h2>
    <div class="oc-body"><p>A collection of logo design, brand identity work, and illustrations — spanning clients in India and the US.</p></div>
    <div class="oc-art-links" style="margin-top:14px;">
      <a href="https://drive.google.com/file/d/1kvDeFdk4prDj1fXqxIKLYx3SouNHpL0z/view?usp=drive_link" target="_blank" class="oc-art-card"><div class="oc-art-card-icon">🎨</div><div class="oc-art-card-title">Full Artfolio</div><div class="oc-art-card-sub">All design work in one place.</div></a>
      <a href="https://drive.google.com/drive/folders/1SEB4qQKLiItc5Rmvaf7xYKmcmdz27QTx" target="_blank" class="oc-art-card"><div class="oc-art-card-icon">🖼️</div><div class="oc-art-card-title">Artworks Folder</div><div class="oc-art-card-sub">Personal and client artwork.</div></a>
    </div>
  `,
  'graphic-merch': `
    <div class="oc-eyebrow">Graphic Design · 01</div>
    <h2 class="oc-title" style="font-size:1.5rem;">Merchandise Design</h2>
    <div class="oc-body"><p>Branded merchandise design — apparel, prints, and product identity work.</p></div>
    <a href="https://drive.google.com/drive/folders/18DrQy2Kfq0Dcq-tO3jG8F2g1TgP89pdh" target="_blank" class="oc-link">View Merch Work ↗</a>
  `,
  'graphic-comic': `
    <div class="oc-eyebrow">Graphic Design · 02</div>
    <h2 class="oc-title" style="font-size:1.5rem;">Silent Watcher Comic</h2>
    <div class="oc-body"><p>Sequential art project — character design, panel composition, and narrative illustration.</p></div>
    <a href="https://drive.google.com/drive/folders/1mXqmHSO_Zcbu0VxtQWObAoSYjdPfOxHe" target="_blank" class="oc-link">View Comic Work ↗</a>
  `,
  'graphic-social': `
    <div class="oc-eyebrow">Graphic Design · 03</div>
    <h2 class="oc-title" style="font-size:1.5rem;">Social Media Creatives</h2>
    <div class="oc-body"><p>Campaign visuals, post templates, and branded social content for Instagram and LinkedIn.</p></div>
    <a href="https://drive.google.com/drive/folders/1J0zBwKMon5U83AIdDrKUDMKS-drNAKfZ" target="_blank" class="oc-link">View Social Creatives ↗</a>
  `,
  'graphic-storyboard': `
    <div class="oc-eyebrow">Graphic Design · 04</div>
    <h2 class="oc-title" style="font-size:1.5rem;">Storyboard Work</h2>
    <div class="oc-body"><p>Pre-production storyboards for video scripts — panel-by-panel visual direction bridging copy and camera.</p></div>
    <a href="https://drive.google.com/drive/folders/1JBfhlZxMaZP0-erFn0XTmKvH60fhQXD6" target="_blank" class="oc-link">View Storyboards ↗</a>
  `,
};

// ── Wire data-dialog clicks after DOM updates ─────────────────
// We delegate from document so it works after dynamic render
document.addEventListener('click', (e) => {
  const card = e.target.closest('[data-dialog]');
  if (!card) return;
  // Don't trigger if clicking a link inside the card
  if (e.target.closest('a')) return;
  const key = card.dataset.dialog;
  if (CARD_DETAILS[key]) openCardDialog(CARD_DETAILS[key]);
});

// Initial transforms
applyTransforms();