/*
  Για νέο άρθρο: πρόσθεσε ένα αντικείμενο στο τέλος της λίστας.
  type: 'own' για κείμενο που φιλοξενείται εδώ, 'external' για αναδημοσίευση.
  Τα demo άρθρα μπορούν να αφαιρεθούν όταν προστεθούν πραγματικά άρθρα.
*/
window.articles = [
  {
    title: 'Ενδεικτικό άρθρο: Μικρές παύσεις στην καθημερινότητα',
    slug: 'mikres-pafseis-demo',
    date: '28 Αυγούστου 2026',
    isoDate: '2026-08-28',
    category: 'Προσωπική ανάπτυξη',
    type: 'own',
    author: 'Σαλώμη Τζιντζινόγλου',
    excerpt: 'Demo άρθρο που δείχνει πώς θα εμφανίζονται τα κείμενα που δημοσιεύονται στην ιστοσελίδα.',
    url: 'mikres-pafseis-demo/'
  },
  {
    title: 'Ενδεικτική αναδημοσίευση: Ένα θέμα προς εξερεύνηση',
    slug: 'endiktiki-anadimosiefsi',
    date: '20 Αυγούστου 2026',
    isoDate: '2026-08-20',
    category: 'Ψυχική υγεία',
    type: 'external',
    author: 'Ενδεικτικός αρχικός συγγραφέας',
    sourceName: 'Ενδεικτική πηγή',
    excerpt: 'Demo αναδημοσίευσης με σαφή αναφορά στον αρχικό συγγραφέα και σύνδεσμο προς την πηγή.',
    url: 'endiktiki-anadimosiefsi/'
  }
];

const listing = document.querySelector('[data-articles-list]');
if (listing) {
  listing.innerHTML = window.articles.map(article => {
    const typeLabel = article.type === 'own' ? 'Δικό μου άρθρο' : 'Αναδημοσίευση';
    const source = article.type === 'own'
      ? `Συγγραφέας: ${article.author}`
      : `Αρχικός συγγραφέας: ${article.author} · Πηγή: ${article.sourceName}`;
    return `<article class="article-card reveal"><div class="article-card__top"><span class="article-card__badge article-card__badge--${article.type}">${typeLabel}</span><span class="article-card__category">${article.category}</span></div><h2>${article.title}</h2><p>${article.excerpt}</p><div class="article-card__meta"><time datetime="2026-08-28">${article.date}</time><span>${source}</span></div><a class="text-link" href="${article.url}">Διαβάστε το άρθρο <span aria-hidden="true">→</span></a></article>`;
  }).join('');
  listing.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
}
