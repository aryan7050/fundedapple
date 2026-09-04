const sectionFiles = [
  'sections/00-logo-symbols.html',
  'sections/01-promo.html',
  'sections/02-header.html',
  'sections/03-hero.html',
  'sections/04-guarantee.html',
  'sections/05-payout-ticker.html',
  'sections/06-how-it-works.html',
  'sections/07-configurator.html',
  'sections/08-proof.html',
  'sections/08a-propfirm-why.html',
  'sections/09-global.html',
  'sections/08-platforms.html',
  'sections/09-rules.html',
  'sections/10-testimonials.html',
  'sections/11-faq.html',
  'sections/12-cta.html',
  'sections/13-footer.html',
  'sections/14-chat.html'
];

(async function loadSite(){
  const root = document.getElementById('site-sections');
  for (const file of sectionFiles) {
    const response = await fetch(`${file}?v=20260838`);
    if (!response.ok) throw new Error(`Could not load ${file}`);
    root.insertAdjacentHTML('beforeend', await response.text());
  }

  const heroTiles = document.querySelector('.hero-tiles');
  if (heroTiles) {
    const tileFragment = document.createDocumentFragment();
    for (let index = 0; index < 144; index += 1) {
      tileFragment.appendChild(document.createElement('span'));
    }
    heroTiles.appendChild(tileFragment);
  }

  const script = document.createElement('script');
  script.src = 'js/app.js';
  document.body.appendChild(script);
})().catch(error => {
  console.error(error);
  document.getElementById('site-sections').innerHTML =
    '<div style="padding:30px;font-family:Arial;color:white;background:#0A0F0C">Website files could not be loaded. Start the website using START-WEBSITE.bat.</div>';
});
