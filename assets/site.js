(() => {
  const root = document.documentElement;
  const portal = document.querySelector('.portal');
  const bar = document.querySelector('.topbar');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 지금 계절 표시 + 첫 화면 글자를 지금 계절로
  const month = new Date().getMonth() + 1;
  const now = [...document.querySelectorAll('.s')].find((el) =>
    el.dataset.months.split(',').map(Number).includes(month));
  if (now) {
    now.classList.add('is-now');
    const word = now.querySelector('.s-name').textContent.trim();
    const left = document.querySelector('[data-season-word="0"]');
    if (left) left.textContent = word;
  }

  // 첫 화면: 스크롤 정도(0~1)를 --p 로 넘긴다
  if (portal && !reduce) {
    let ticking = false;
    const update = () => {
      ticking = false;
      const total = portal.offsetHeight - window.innerHeight;
      const p = Math.min(1, Math.max(0, -portal.getBoundingClientRect().top / (total * 0.8)));
      root.style.setProperty('--p', p.toFixed(4));
      portal.classList.toggle('is-open', p > 0.7);
      bar.classList.toggle('is-solid', portal.getBoundingClientRect().bottom < 80);
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  } else if (portal) {
    portal.classList.add('is-open');
    bar.classList.add('is-solid');
  }

  // 문의 폼
  const form = document.getElementById('ask-form');
  if (!form) return;
  const msg = form.querySelector('.form-msg');
  const btn = form.querySelector('button[type="submit"]');
  const say = (text, kind) => { msg.textContent = text; msg.className = 'form-msg ' + kind; };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = form.elements;
    if (!f.name.value.trim() || !f.contact.value.trim()) return say('이름과 연락처를 적어 주세요', 'err');
    if (!f.consent.checked) return say('개인정보 수집·이용에 동의해 주세요', 'err');
    btn.disabled = true;
    say('보내는 중이에요…', '');
    try {
      const r = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: f.name.value,
          contact: f.contact.value,
          target: f.target.value,
          consent: f.consent.checked,
          website: f.website.value,
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || '보내지 못했어요. 잠시 뒤 다시 시도해 주세요.');
      form.reset();
      say('문의가 접수됐어요. 확인 후 연락드릴게요.', 'ok');
    } catch (err) {
      say(err.message, 'err');
    } finally {
      btn.disabled = false;
    }
  });
})();
