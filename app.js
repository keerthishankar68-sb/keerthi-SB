/* ═══════════════════════════════════════════════════════
   AI Resume Maker — Application Logic
   ═══════════════════════════════════════════════════════ */
;(function () {
  'use strict';

  /* ── DOM cache ────────────────────────────────────── */
  const $ = (s, p = document) => p.querySelector(s);
  const $$ = (s, p = document) => [...p.querySelectorAll(s)];

  const pages = {
    login:     $('#page-login'),
    templates: $('#page-templates'),
    builder:   $('#page-builder'),
    ats:       $('#page-ats'),
  };
  const header      = $('#app-header');
  const userDisplay = $('#user-display');

  /* ── State ────────────────────────────────────────── */
  let state = loadState();

  function defaultState() {
    return {
      user: null,
      selectedTemplate: 'modern',
      builderStep: 0,
      resume: {
        personal: {},
        education: [{}],
        projects: [{}],
        experience: [{}],
      },
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem('ag_resume_state');
      return raw ? { ...defaultState(), ...JSON.parse(raw) } : defaultState();
    } catch { return defaultState(); }
  }

  function saveState() {
    localStorage.setItem('ag_resume_state', JSON.stringify(state));
  }

  /* ═══════════════════════════════════════════════════
     ROUTING
     ═══════════════════════════════════════════════════ */
  function navigate(page) {
    Object.values(pages).forEach(p => p.classList.remove('page--active'));
    if (pages[page]) pages[page].classList.add('page--active');

    $$('.nav-link').forEach(l => l.classList.toggle('active', l.dataset.page === page));

    if (page === 'login') {
      header.classList.add('hidden');
    } else {
      header.classList.remove('hidden');
    }
  }

  /* ═══════════════════════════════════════════════════
     AUTH
     ═══════════════════════════════════════════════════ */
  let isSignUp = false;

  $('#btn-toggle-auth').addEventListener('click', () => {
    isSignUp = !isSignUp;
    $('#login-name-group').style.display = isSignUp ? 'flex' : 'none';
    $('#btn-auth').textContent = isSignUp ? 'Create Account' : 'Sign In';
    $('#toggle-auth-label').textContent = isSignUp
      ? 'Already have an account?'
      : "Don't have an account?";
    $('#btn-toggle-auth').textContent = isSignUp ? 'Sign In' : 'Sign Up';
  });

  $('#btn-auth').addEventListener('click', () => {
    const email = $('#login-email').value.trim();
    const pw    = $('#login-password').value.trim();
    if (!email || !pw) return shakeInput();
    const name = isSignUp ? ($('#login-name').value.trim() || email.split('@')[0]) : (email.split('@')[0]);

    state.user = { email, name };
    saveState();
    userDisplay.textContent = name;
    navigate('templates');
  });

  $('#btn-logout').addEventListener('click', () => {
    state.user = null;
    saveState();
    navigate('login');
  });

  function shakeInput() {
    const card = $('.login-card');
    card.style.animation = 'none';
    void card.offsetHeight;          // reflow
    card.style.animation = 'shake .4s ease';
    setTimeout(() => card.style.animation = '', 500);
  }

  /* Add shake keyframes dynamically */
  const shakeStyle = document.createElement('style');
  shakeStyle.textContent = `@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}`;
  document.head.appendChild(shakeStyle);

  /* ═══════════════════════════════════════════════════
     TEMPLATE SELECTION
     ═══════════════════════════════════════════════════ */
  const templates = [
    { id: 'modern',   name: 'Modern',   desc: 'Clean lines, bold headings' },
    { id: 'classic',  name: 'Classic',  desc: 'Traditional & timeless' },
    { id: 'creative', name: 'Creative', desc: 'Colorful & expressive' },
    { id: 'minimal',  name: 'Minimal',  desc: 'Less is more' },
  ];

  function renderTemplates() {
    const grid = $('#template-grid');
    grid.innerHTML = templates.map(t => `
      <div class="template-card ${t.id === state.selectedTemplate ? 'selected' : ''}" data-tpl="${t.id}">
        <div class="template-preview">
          <div class="template-preview-inner">
            <div class="tpl-line title"></div>
            <div class="tpl-line subtitle"></div>
            <div class="tpl-section-gap"></div>
            <div class="tpl-line" style="width:90%"></div>
            <div class="tpl-line" style="width:75%"></div>
            <div class="tpl-line short"></div>
            <div class="tpl-section-gap"></div>
            <div class="tpl-line" style="width:85%"></div>
            <div class="tpl-line" style="width:65%"></div>
          </div>
        </div>
        <div class="template-info">
          <h4>${t.name}</h4>
          <p>${t.desc}</p>
        </div>
      </div>
    `).join('');

    $$('.template-card', grid).forEach(card => {
      card.addEventListener('click', () => {
        state.selectedTemplate = card.dataset.tpl;
        saveState();
        $$('.template-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');

        // Enable the continue button
        const btn = $('#btn-continue-builder');
        btn.disabled = false;
        const hint = $('#template-hint');
        hint.textContent = '✓ "' + card.querySelector('h4').textContent + '" selected!';
        hint.classList.add('hidden');
        setTimeout(() => { hint.classList.remove('hidden'); }, 50);
      });
    });
  }

  // Continue to builder button
  $('#btn-continue-builder').addEventListener('click', () => {
    navigate('builder');
  });

  /* ═══════════════════════════════════════════════════
     RESUME BUILDER — Multi-step
     ═══════════════════════════════════════════════════ */
  const stepEls     = $$('.builder-step');
  const indicators  = $$('.step-indicator');
  const connectors  = $$('.step-connector');
  const btnPrev     = $('#btn-prev-step');
  const btnNext     = $('#btn-next-step');

  function showStep(idx) {
    state.builderStep = idx;
    stepEls.forEach((el, i) => {
      el.classList.toggle('active', i === idx);
    });
    indicators.forEach((ind, i) => {
      ind.classList.remove('active', 'done');
      if (i < idx) ind.classList.add('done');
      if (i === idx) ind.classList.add('active');
    });
    connectors.forEach((c, i) => {
      c.classList.toggle('filled', i < idx);
    });
    btnPrev.disabled = idx === 0;
    btnNext.textContent = idx === stepEls.length - 1 ? 'Preview Resume' : 'Next →';
  }

  btnPrev.addEventListener('click', () => {
    if (state.builderStep > 0) { collectCurrentStep(); showStep(state.builderStep - 1); }
  });
  btnNext.addEventListener('click', () => {
    collectCurrentStep();
    if (state.builderStep < stepEls.length - 1) {
      showStep(state.builderStep + 1);
    } else {
      openPreview();
    }
  });

  /* ── Collect data from current step ─────────────── */
  function collectCurrentStep() {
    const idx = state.builderStep;
    if (idx === 0) {
      state.resume.personal = {
        fullname:  $('#b-fullname').value,
        email:     $('#b-email').value,
        phone:     $('#b-phone').value,
        location:  $('#b-location').value,
        summary:   $('#b-summary').value,
        linkedin:  $('#b-linkedin').value,
        portfolio: $('#b-portfolio').value,
      };
    } else if (idx === 1) {
      state.resume.education = collectEntries('#edu-entries', ['edu-degree','edu-institution','edu-start','edu-end','edu-desc']);
    } else if (idx === 2) {
      state.resume.projects = collectEntries('#proj-entries', ['proj-name','proj-tech','proj-desc','proj-link']);
    } else if (idx === 3) {
      state.resume.experience = collectEntries('#exp-entries', ['exp-title','exp-company','exp-start','exp-end','exp-desc']);
    }
    saveState();
  }

  function collectEntries(containerSel, fields) {
    const container = $(containerSel);
    const blocks = $$('.entry-block', container);
    return blocks.map(block => {
      const entry = {};
      fields.forEach(f => {
        const el = $(`.${f}`, block);
        if (el) entry[f.split('-').pop()] = el.value;
      });
      return entry;
    });
  }

  /* ── Dynamic entry add/remove ───────────────────── */
  function addEntry(containerId, fields) {
    const container = $(containerId);
    const blocks = $$('.entry-block', container);
    const idx = blocks.length;
    const block = document.createElement('div');
    block.className = 'entry-block';
    block.dataset.index = idx;

    const fieldHTML = fields.map(f => {
      const isTextarea = f.cls.includes('desc');
      const tag = isTextarea ? `<textarea class="${f.cls}" rows="2" placeholder="${f.ph}"></textarea>` : `<input type="${f.type||'text'}" class="${f.cls}" placeholder="${f.ph}" />`;
      return `<div class="input-group"><label>${f.label}</label>${tag}</div>`;
    });

    // group in pairs for form-row where applicable
    let html = '<button class="btn-remove" type="button">✕ Remove</button>';
    for (let i = 0; i < fieldHTML.length; i += 2) {
      if (i + 1 < fieldHTML.length && !fields[i].cls.includes('desc') && !fields[i+1].cls.includes('desc')) {
        html += `<div class="form-row">${fieldHTML[i]}${fieldHTML[i+1]}</div>`;
      } else {
        html += fieldHTML[i];
        if (i + 1 < fieldHTML.length) html += fieldHTML[i+1];
      }
    }
    block.innerHTML = html;
    container.appendChild(block);

    block.querySelector('.btn-remove').addEventListener('click', () => {
      block.remove();
    });
  }

  const eduFields = [
    { cls:'edu-degree',      label:'Degree',      ph:'B.Sc. Computer Science' },
    { cls:'edu-institution',  label:'Institution', ph:'MIT' },
    { cls:'edu-start',       label:'Start Year',  ph:'2018' },
    { cls:'edu-end',         label:'End Year',    ph:'2022' },
    { cls:'edu-desc',        label:'Description', ph:'GPA 3.9 / 4.0…' },
  ];
  const projFields = [
    { cls:'proj-name', label:'Project Name', ph:'AI Chatbot' },
    { cls:'proj-tech', label:'Tech Stack',   ph:'Python, TensorFlow' },
    { cls:'proj-desc', label:'Description',  ph:'What did you build?' },
    { cls:'proj-link', label:'Link',         ph:'https://github.com/…', type:'url' },
  ];
  const expFields = [
    { cls:'exp-title',   label:'Job Title', ph:'Software Engineer' },
    { cls:'exp-company', label:'Company',   ph:'Google' },
    { cls:'exp-start',   label:'Start Date',ph:'Jan 2022' },
    { cls:'exp-end',     label:'End Date',  ph:'Present' },
    { cls:'exp-desc',    label:'Responsibilities', ph:'Key responsibilities…' },
  ];

  $('#btn-add-edu').addEventListener('click',  () => addEntry('#edu-entries',  eduFields));
  $('#btn-add-proj').addEventListener('click', () => addEntry('#proj-entries', projFields));
  $('#btn-add-exp').addEventListener('click',  () => addEntry('#exp-entries',  expFields));

  /* ── Populate builder from state ────────────────── */
  function populateBuilder() {
    const p = state.resume.personal;
    if (p.fullname)  $('#b-fullname').value  = p.fullname;
    if (p.email)     $('#b-email').value     = p.email;
    if (p.phone)     $('#b-phone').value     = p.phone;
    if (p.location)  $('#b-location').value  = p.location;
    if (p.summary)   $('#b-summary').value   = p.summary;
    if (p.linkedin)  $('#b-linkedin').value  = p.linkedin;
    if (p.portfolio) $('#b-portfolio').value  = p.portfolio;
    // education, projects, experience are populated via initial HTML
  }

  /* ═══════════════════════════════════════════════════
     RESUME PREVIEW
     ═══════════════════════════════════════════════════ */
  const previewOverlay = $('#preview-overlay');

  function openPreview() {
    const r = state.resume;
    const tpl = state.selectedTemplate;
    const content = $('#preview-content');
    content.className = `preview-content tpl-${tpl}`;

    let html = '';
    // Header
    const name = r.personal.fullname || 'Your Name';
    const contact = [r.personal.email, r.personal.phone, r.personal.location].filter(Boolean).join('  •  ');
    html += `<h2>${esc(name)}</h2>`;
    html += `<p class="preview-contact">${esc(contact)}</p>`;

    if (r.personal.summary) {
      html += `<div class="preview-section"><h4>Summary</h4><p>${esc(r.personal.summary)}</p></div>`;
    }

    // Education
    if (r.education.some(e => e.degree || e.institution)) {
      html += `<div class="preview-section"><h4>Education</h4>`;
      r.education.forEach(e => {
        if (!e.degree && !e.institution) return;
        html += `<div class="preview-entry"><strong>${esc(e.degree||'')}</strong> — ${esc(e.institution||'')}<br><span class="meta">${esc(e.start||'')} – ${esc(e.end||'')}</span>`;
        if (e.desc) html += `<p>${esc(e.desc)}</p>`;
        html += `</div>`;
      });
      html += `</div>`;
    }

    // Projects
    if (r.projects.some(p => p.name)) {
      html += `<div class="preview-section"><h4>Projects</h4>`;
      r.projects.forEach(p => {
        if (!p.name) return;
        html += `<div class="preview-entry"><strong>${esc(p.name)}</strong>`;
        if (p.tech) html += ` <span class="meta">(${esc(p.tech)})</span>`;
        if (p.desc) html += `<p>${esc(p.desc)}</p>`;
        if (p.link) html += `<p class="meta">${esc(p.link)}</p>`;
        html += `</div>`;
      });
      html += `</div>`;
    }

    // Experience
    if (r.experience.some(e => e.title || e.company)) {
      html += `<div class="preview-section"><h4>Experience</h4>`;
      r.experience.forEach(e => {
        if (!e.title && !e.company) return;
        html += `<div class="preview-entry"><strong>${esc(e.title||'')}</strong> at ${esc(e.company||'')}<br><span class="meta">${esc(e.start||'')} – ${esc(e.end||'')}</span>`;
        if (e.desc) html += `<p>${esc(e.desc)}</p>`;
        html += `</div>`;
      });
      html += `</div>`;
    }

    // Links
    const links = [r.personal.linkedin, r.personal.portfolio].filter(Boolean);
    if (links.length) {
      html += `<div class="preview-section"><h4>Links</h4><p>${links.map(l => esc(l)).join('<br>')}</p></div>`;
    }

    content.innerHTML = html;
    previewOverlay.classList.remove('hidden');
  }

  $('#btn-close-preview').addEventListener('click', () => previewOverlay.classList.add('hidden'));
  previewOverlay.addEventListener('click', e => {
    if (e.target === previewOverlay) previewOverlay.classList.add('hidden');
  });

  $('#btn-download-pdf').addEventListener('click', () => {
    window.print();    // simple print-to-pdf for now
  });

  function esc(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  }

  /* ═══════════════════════════════════════════════════
     ATS SCORE CHECKER
     ═══════════════════════════════════════════════════ */
  $('#btn-check-ats').addEventListener('click', () => {
    const jd = $('#ats-jd').value.trim();
    if (!jd) return;

    collectCurrentStep();   // make sure latest data is captured
    const resumeText = buildResumeText();
    const { score, missing, suggestions } = analyzeATS(resumeText, jd);

    // show results
    $('#ats-results').style.display = '';

    animateScore(score);
    renderSuggestions(suggestions);
    renderMissingKeywords(missing);
  });

  function buildResumeText() {
    const r = state.resume;
    let text = '';
    const p = r.personal;
    text += [p.fullname, p.email, p.phone, p.location, p.summary, p.linkedin, p.portfolio].join(' ');
    r.education.forEach(e => { text += ' ' + Object.values(e).join(' '); });
    r.projects.forEach(e => { text += ' ' + Object.values(e).join(' '); });
    r.experience.forEach(e => { text += ' ' + Object.values(e).join(' '); });
    return text.toLowerCase();
  }

  function analyzeATS(resumeText, jd) {
    // Extract important keywords from JD
    const stopWords = new Set([
      'a','an','the','and','or','but','in','on','at','to','for','of','with','by',
      'is','are','was','were','be','been','being','have','has','had','do','does',
      'did','will','would','shall','should','may','might','can','could','about',
      'this','that','these','those','it','its','we','our','you','your','they',
      'their','he','she','his','her','as','from','not','all','any','each',
      'more','most','such','no','nor','too','very','just','than','then',
      'also','so','if','up','out','into','over','after','before','between',
      'through','during','under','above','below','both','either','neither',
      'while','where','when','who','whom','which','what','how','why',
      'must','need','want','like','include','including','etc','e.g','i.e',
      'able','well','work','using','use','used','experience','required',
      'strong','good','excellent','preferred','plus','minimum','requirements',
      'responsibilities','qualifications','role','position','team','company',
      'opportunity','knowledge','understanding','ability','skills','skill',
    ]);

    const jdWords = jd.toLowerCase().replace(/[^a-z0-9+#.\s-]/g, ' ').split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w));

    // Count frequencies
    const freq = {};
    jdWords.forEach(w => { freq[w] = (freq[w] || 0) + 1; });

    // Get top keywords (sorted by frequency, take top 20)
    const keywords = Object.entries(freq).sort((a,b) => b[1]-a[1]).slice(0, 25).map(e => e[0]);

    const found = [];
    const missing = [];
    keywords.forEach(kw => {
      if (resumeText.includes(kw)) found.push(kw);
      else missing.push(kw);
    });

    const score = keywords.length ? Math.round((found.length / keywords.length) * 100) : 0;

    // Generate suggestions
    const suggestions = [];
    if (score < 40) suggestions.push('Your resume has low keyword overlap. Consider tailoring it to the job description.');
    if (score >= 40 && score < 70) suggestions.push('Good start! Try incorporating more of the missing keywords naturally into your experience descriptions.');
    if (score >= 70) suggestions.push('Great match! Your resume aligns well with this job description.');

    if (missing.length > 5) suggestions.push(`You're missing ${missing.length} important keywords. Focus on adding the top ones.`);
    if (!state.resume.personal.summary) suggestions.push("Add a professional summary — it's a great place to include targeted keywords.");
    if (state.resume.experience.length <= 1 && !state.resume.experience[0]?.title) suggestions.push('Add work experience entries with detailed responsibilities to boost your match.');
    if (state.resume.projects.length <= 1 && !state.resume.projects[0]?.name) suggestions.push('Including projects with relevant technologies can significantly improve your ATS score.');

    return { score, missing: missing.slice(0, 12), suggestions };
  }

  function animateScore(target) {
    const ring = $('#score-ring-fg');
    const label = $('#score-value');
    const circumference = 2 * Math.PI * 52;  // r=52

    // color based on score
    let color = 'var(--danger)';
    if (target >= 40) color = 'var(--accent-peach)';
    if (target >= 65) color = 'var(--primary)';
    if (target >= 80) color = 'var(--success)';
    ring.style.stroke = color;

    const offset = circumference - (target / 100) * circumference;
    ring.style.strokeDashoffset = circumference;   // reset
    void ring.getBoundingClientRect();             // reflow
    ring.style.strokeDashoffset = offset;

    // count up
    let current = 0;
    const step = Math.max(1, Math.round(target / 40));
    const interval = setInterval(() => {
      current += step;
      if (current >= target) { current = target; clearInterval(interval); }
      label.textContent = current;
    }, 25);
  }

  function renderSuggestions(list) {
    const ul = $('#ats-suggestions');
    ul.innerHTML = list.map(s => `<li>${esc(s)}</li>`).join('');
  }

  function renderMissingKeywords(list) {
    const container = $('#ats-missing-keywords');
    container.innerHTML = list.map(k => `<span class="keyword-chip">${esc(k)}</span>`).join('');
  }

  /* ═══════════════════════════════════════════════════
     NAV LINKS
     ═══════════════════════════════════════════════════ */
  $$('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navigate(link.dataset.page);
    });
  });

  /* ═══════════════════════════════════════════════════
     WOW FEATURE: INTERACTIVE PARTICLES
     ═══════════════════════════════════════════════════ */
  function initParticles() {
    const canvas = $('#particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    let mouse = { x: -100, y: -100 };

    class Particle {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 3 + 1;
        this.alpha = Math.random() * 0.5 + 0.2;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Mouse interaction: gentle push
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          const force = (100 - dist) / 100;
          this.vx += (dx / dist) * force * 0.2;
          this.vy += (dy / dist) * force * 0.2;
        }

        // Friction to keep it gentle
        this.vx *= 0.99;
        this.vy *= 0.99;

        // Wrap around edges
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139, 164, 212, ${this.alpha})`; // primary color
        ctx.fill();
      }
    }

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = Array.from({ length: Math.floor(canvas.width / 15) }, () => new Particle());
    }

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', e => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw connections
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(139, 164, 212, ${0.1 * (1 - dist / 120)})`;
            ctx.stroke();
          }
        }
      }

      particles.forEach(p => {
        p.update();
        p.draw();
      });
      requestAnimationFrame(animate);
    }

    resize();
    animate();
  }

  /* ═══════════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════════ */
  function init() {
    initParticles();
    renderTemplates();
    populateBuilder();
    showStep(state.builderStep);

    if (state.user) {
      userDisplay.textContent = state.user.name;
      navigate('templates');
    } else {
      navigate('login');
    }
  }

  init();
})();
