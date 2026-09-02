(function () {
  const cms = window.cms || { configured: false };
  const base = document.body.dataset.base || '';
  const page = document.body.dataset.page;
  const escape = value => String(value || '').replace(/[&<>'"]/g, char => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' })[char]);
  const date = value => value ? new Intl.DateTimeFormat('el-GR', { day:'numeric', month:'long', year:'numeric' }).format(new Date(`${value}T12:00:00`)) : '';
  const safeUrl = value => { try { const url = new URL(value); return ['http:','https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; } };

  window.renderSafeArticleContent = content => {
    const lines = String(content || '').replace(/\r/g, '').split('\n');
    const inline = text => escape(text)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, label, href) => `<a href="${safeUrl(href)}" target="_blank" rel="noopener noreferrer">${label}</a>`);
    let html = '', list = null;
    const closeList = () => { if (list) { html += `</${list}>`; list = null; } };
    lines.forEach(line => {
      if (/^[-*]\s+/.test(line)) { if (list !== 'ul') { closeList(); list = 'ul'; html += '<ul>'; } html += `<li>${inline(line.replace(/^[-*]\s+/, ''))}</li>`; return; }
      if (/^\d+\.\s+/.test(line)) { if (list !== 'ol') { closeList(); list = 'ol'; html += '<ol>'; } html += `<li>${inline(line.replace(/^\d+\.\s+/, ''))}</li>`; return; }
      closeList();
      if (!line.trim()) return;
      if (/^###\s+/.test(line)) html += `<h3>${inline(line.slice(4))}</h3>`;
      else if (/^##\s+/.test(line)) html += `<h2>${inline(line.slice(3))}</h2>`;
      else if (/^#\s+/.test(line)) html += `<h2>${inline(line.slice(2))}</h2>`;
      else if (/^>\s+/.test(line)) html += `<blockquote>${inline(line.slice(2))}</blockquote>`;
      else html += `<p>${inline(line)}</p>`;
    });
    closeList();
    return html;
  };

  const state = (target, title, message, error = false) => {
    target.innerHTML = `<div class="articles-state${error ? ' articles-state--error' : ''}" role="${error ? 'alert' : 'status'}"><h2>${escape(title)}</h2><p>${escape(message)}</p></div>`;
  };
  const card = article => {
    const republished = article.type === 'republished';
    const source = republished
      ? `Αρχικός συγγραφέας: ${escape(article.original_author)} · Πηγή: ${escape(article.source_name)}`
      : `Συγγραφέας: ${escape(article.author || 'Σαλώμη Τζιντζινόγλου')}`;
    return `<article class="article-card reveal is-visible"><div class="article-card__top"><span class="article-card__badge article-card__badge--${republished ? 'external' : 'own'}">${republished ? 'Αναδημοσίευση' : 'Δικό μου άρθρο'}</span><span class="article-card__category">${escape(article.category)}</span></div><h2>${escape(article.title)}</h2><p>${escape(article.excerpt)}</p><div class="article-card__meta"><time datetime="${escape(article.published_at)}">${date(article.published_at)}</time><span>${source}</span></div><a class="text-link" href="${base}arthra/article/?slug=${encodeURIComponent(article.slug)}">Διαβάστε το άρθρο <span aria-hidden="true">→</span></a></article>`;
  };

  async function listing() {
    const target = document.querySelector('[data-articles-list]');
    if (!target) return;
    if (!cms.configured) return state(target, 'Η ενότητα άρθρων ετοιμάζεται', 'Η σύνδεση με τη δημοσίευση άρθρων δεν έχει ρυθμιστεί ακόμη.');
    state(target, 'Φόρτωση άρθρων…', 'Παρακαλώ περιμένετε.');
    const { data, error } = await cms.client.from('articles').select('id,type,title,slug,category,excerpt,author,original_author,source_name,published_at,cover_image_url').eq('status','published').order('published_at', { ascending:false });
    if (error) return state(target, 'Δεν ήταν δυνατή η φόρτωση', 'Δοκιμάστε ξανά σε λίγο.', true);
    if (!data.length) return state(target, 'Δεν υπάρχουν άρθρα ακόμη', 'Σύντομα θα προστεθούν νέα κείμενα και επιλεγμένες αναδημοσιεύσεις.');
    target.innerHTML = data.map(card).join('');
  }

  async function detail() {
    const target = document.querySelector('[data-article-detail]');
    if (!target) return;
    const slug = new URLSearchParams(location.search).get('slug');
    if (!slug) return state(target, 'Το άρθρο δεν βρέθηκε', 'Επιστρέψτε στη λίστα άρθρων.', true);
    if (!cms.configured) return state(target, 'Η σύνδεση δεν έχει ρυθμιστεί', 'Το άρθρο δεν είναι διαθέσιμο ακόμη.', true);
    state(target, 'Φόρτωση άρθρου…', 'Παρακαλώ περιμένετε.');
    const { data: article, error } = await cms.client.from('articles').select('*').eq('slug', slug).eq('status','published').maybeSingle();
    if (error || !article) return state(target, 'Το άρθρο δεν βρέθηκε', 'Ίσως έχει μετακινηθεί ή δεν είναι πλέον δημοσιευμένο.', true);
    document.title = `${article.title} | Σαλώμη Τζιντζινόγλου`;
    const description = document.querySelector('meta[name="description"]'); if (description) description.content = article.excerpt || '';
    const ogTitle = document.querySelector('meta[property="og:title"]'); if (ogTitle) ogTitle.content = article.title;
    const ogDescription = document.querySelector('meta[property="og:description"]'); if (ogDescription) ogDescription.content = article.excerpt || '';
    const ogImage = document.querySelector('meta[property="og:image"]'); if (ogImage && article.cover_image_url) ogImage.content = article.cover_image_url;
    const canonical = document.querySelector('link[rel="canonical"]'); if (canonical) canonical.href = location.href;
    const republished = article.type === 'republished';
    const sourceUrl = safeUrl(article.source_url);
    target.innerHTML = `<a class="text-link article-back" href="${base}arthra/">← Επιστροφή στα Άρθρα</a><article><div class="article-kicker"><span class="article-card__badge article-card__badge--${republished ? 'external' : 'own'}">${republished ? 'Αναδημοσίευση' : 'Δικό μου άρθρο'}</span><span>${escape(article.category)}</span></div><h1>${escape(article.title)}</h1><p class="article-byline">${republished ? `Αρχικός συγγραφέας: ${escape(article.original_author)}` : `Συγγραφέας: ${escape(article.author || 'Σαλώμη Τζιντζινόγλου')}`} · <time datetime="${escape(article.published_at)}">${date(article.published_at)}</time></p>${article.cover_image_url ? `<img class="article-cover" src="${escape(article.cover_image_url)}" alt="Εικόνα για το άρθρο: ${escape(article.title)}">` : ''}<div class="article-body">${window.renderSafeArticleContent(article.content)}</div>${republished ? `<aside class="article-source"><p><strong>Αρχικός συγγραφέας:</strong> ${escape(article.original_author)}</p><p><strong>Πηγή:</strong> ${escape(article.source_name)}</p>${sourceUrl ? `<a class="button button--small" href="${escape(sourceUrl)}" target="_blank" rel="noopener noreferrer">Διαβάστε το πρωτότυπο άρθρο <span aria-hidden="true">↗</span></a>` : ''}</aside>` : ''}</article>`;
  }
  if (page === 'articles') listing();
  if (page === 'article') detail();
})();
