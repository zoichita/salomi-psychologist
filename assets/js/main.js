const root = document.documentElement;
const base = document.body.dataset.base || '';
const page = document.body.dataset.page || 'home';
const currentYear = new Date().getFullYear();

document.querySelector('[data-component="header"]').innerHTML = `
  <header class="site-header"><div class="container nav">
    <a class="brand" href="${base}" aria-label="Σαλώμη Τζιντζινόγλου, αρχική"><img src="${base}assets/images/logo-clean.png" alt="Λογότυπο Εξέλιξη"><span>Σαλώμη Τζιντζινόγλου<small>Ψυχολόγος - Συστημική Ψυχοθεραπεία</small></span></a>
    <button class="menu-toggle" type="button" aria-label="Άνοιγμα μενού" aria-expanded="false" aria-controls="main-menu">☰</button>
    <nav id="main-menu" class="nav__links" aria-label="Κύρια πλοήγηση"><a href="${base}" ${page==='home'?'aria-current="page"':''}>Αρχική</a><a href="${base}ypiresies/" ${page==='services'?'aria-current="page"':''}>Υπηρεσίες</a><a href="${base}arthra/" ${page==='articles'?'aria-current="page"':''}>Άρθρα</a><a href="#epikoinonia">Επικοινωνία</a><button class="button button--small" type="button" data-open-modal>Κλείστε Ραντεβού</button></nav>
  </div></header>`;

document.querySelector('[data-component="contact"]').innerHTML = `
  <section id="epikoinonia" class="contact" aria-labelledby="contact-title"><div class="container contact__grid"><div class="reveal"><p class="eyebrow">Επικοινωνία</p><h2 id="contact-title">Επικοινωνήστε μαζί μου</h2><p>Για περισσότερες πληροφορίες ή για να προγραμματίσετε το ραντεβού σας, μπορείτε να επικοινωνήσετε τηλεφωνικά ή μέσω email.</p><button class="button" type="button" data-open-modal>Κλείστε Ραντεβού <span aria-hidden="true">→</span></button><div class="contact__details"><div class="contact__detail"><span class="contact__detail-icon" aria-hidden="true">☎</span><div><strong>Τηλέφωνο</strong><a href="tel:+302311545915">2311545915</a></div></div><div class="contact__detail"><span class="contact__detail-icon" aria-hidden="true">✉</span><div><strong>Email</strong><a href="mailto:salomitzinpsy@gmail.com">salomitzinpsy@gmail.com</a></div></div><div class="contact__detail"><span class="contact__detail-icon" aria-hidden="true">⌖</span><div><strong>Διεύθυνση</strong><address>Μ. Αλεξάνδρου 80, 56224, Εύοσμος</address></div></div><div class="contact__detail"><span class="contact__detail-icon" aria-hidden="true"><i class="fa-brands fa-instagram"></i></span><div><strong>Instagram</strong><a href="https://www.instagram.com/exelixi_therapy/?__d=11" target="_blank" rel="noopener noreferrer" aria-label="Instagram Εξέλιξη Therapy (ανοίγει σε νέα καρτέλα)">@exelixi_therapy</a></div></div></div></div><div class="map reveal"><iframe title="Χάρτης: Μ. Αλεξάνδρου 80, 56224, Εύοσμος" src="https://www.google.com/maps?q=Megalou%20Alexandrou%2080%2C%2056224%2C%20Evosmos&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div></div></section>`;

document.querySelector('[data-component="footer"]').innerHTML = `
  <footer class="site-footer"><div class="container"><div class="footer__top"><div class="footer__brand">Σαλώμη Τζιντζινόγλου<span>Ψυχολόγος - Συστημική Ψυχοθεραπεία</span></div><div><p><a href="tel:+302311545915">Τηλέφωνο: 2311545915</a></p><p><a href="mailto:salomitzinpsy@gmail.com">salomitzinpsy@gmail.com</a></p><p>Μ. Αλεξάνδρου 80, 56224, Εύοσμος</p></div><nav class="footer__links" aria-label="Σύνδεσμοι υποσέλιδου"><a href="${base}">Αρχική</a><a href="${base}ypiresies/">Υπηρεσίες</a><a href="${base}arthra/">Άρθρα</a><a href="#epikoinonia">Επικοινωνία</a></nav></div><div class="footer__bottom">© ${currentYear} Σαλώμη Τζιντζινόγλου. Με επιφύλαξη παντός δικαιώματος.</div></div></footer>`;

document.querySelector('[data-component="modal"]').innerHTML = `
  <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" aria-hidden="true"><div class="modal__dialog"><button class="modal__close" type="button" aria-label="Κλείσιμο παραθύρου">×</button><p class="eyebrow">Επικοινωνία</p><h2 id="modal-title">Κλείστε το ραντεβού σας</h2><p>Επιλέξτε τον τρόπο επικοινωνίας που σας εξυπηρετεί.</p><div class="modal__actions"><a class="button" href="tel:+302311545915">Καλέστε τώρα <span>2311545915</span></a><a class="button" href="mailto:salomitzinpsy@gmail.com">Στείλτε email</a></div></div></div>`;

const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('.nav__links');
menuButton.addEventListener('click', () => { const open = menu.classList.toggle('is-open'); menuButton.setAttribute('aria-expanded', open); menuButton.textContent = open ? '×' : '☰'; });
menu.addEventListener('click', event => { if (event.target.matches('a,button')) { menu.classList.remove('is-open'); menuButton.setAttribute('aria-expanded','false'); menuButton.textContent='☰'; } });
const modal = document.querySelector('.modal');
const closeModal = () => { modal.classList.remove('is-open'); modal.setAttribute('aria-hidden','true'); root.style.overflow=''; };
document.querySelectorAll('[data-open-modal]').forEach(button => button.addEventListener('click', () => { modal.classList.add('is-open'); modal.setAttribute('aria-hidden','false'); root.style.overflow='hidden'; modal.querySelector('.modal__close').focus(); }));
modal.addEventListener('click', event => { if (event.target === modal || event.target.closest('.modal__close')) closeModal(); });
document.addEventListener('keydown', event => { if(event.key === 'Escape' && modal.classList.contains('is-open')) closeModal(); });
addEventListener('scroll', () => document.querySelector('.site-header').classList.toggle('is-scrolled', scrollY > 8), {passive:true});
const observer = new IntersectionObserver(entries => entries.forEach(entry => { if(entry.isIntersecting){ entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }), {threshold:.12});
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
