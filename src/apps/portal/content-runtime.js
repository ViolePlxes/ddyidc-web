// Progressive enhancement for the public business carousel. No sessions or APIs.
for (const section of document.querySelectorAll('[data-portal-module="banner_carousel"]')) {
  const slides = [...section.querySelectorAll('[data-portal-slide]')];
  if (slides.length < 2) continue;
  let index = 0;
  const show = next => { index = (next + slides.length) % slides.length; slides.forEach((slide, i) => { slide.hidden = i !== index; }); };
  const controls = document.createElement('div');
  controls.className = 'flex gap-3';
  for (const [label, step] of [['上一张', -1], ['下一张', 1]]) {
    const button = document.createElement('button');
    button.type = 'button'; button.textContent = label;
    button.className = 'rounded-md bg-kumo-base px-3 py-2 text-sm text-kumo-default ring ring-kumo-line';
    button.addEventListener('click', () => show(index + step)); controls.append(button);
  }
  section.append(controls); show(0);
  if (section.dataset.autoplay === 'true') {
    const interval = Math.max(1, Math.min(60, Number(section.dataset.interval) || 5)) * 1000;
    setInterval(() => { if (!document.hidden && !section.matches(':hover, :focus-within')) show(index + 1); }, interval);
  }
}
