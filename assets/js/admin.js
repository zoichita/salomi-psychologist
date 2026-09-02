(function () {
  const cms = window.cms || { configured:false };
  const page = document.body.dataset.adminPage;
  const root = document.querySelector('[data-admin-app]');
  const notice = (message, error = false) => { const el = document.querySelector('[data-admin-notice]'); if (el) { el.textContent = message; el.className = `admin-notice${error ? ' admin-notice--error' : ''}`; } };
  const escape = value => String(value || '').replace(/[&<>'"]/g, char => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' })[char]);
  const slugify = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9\s-]/g,'').trim().replace(/\s+/g,'-').replace(/-+/g,'-');
  const validUrl = value => { try { const url = new URL(value); return ['http:','https:'].includes(url.protocol); } catch { return false; } };
  const configured = () => { if (!cms.configured) { root.innerHTML = '<div class="admin-state" role="alert"><h1>Απαιτείται ρύθμιση Supabase</h1><p>Αντιγράψτε το <code>assets/js/supabase-config.example.js</code> ως <code>supabase-config.js</code> και εισαγάγετε το Project URL και το public anon key.</p></div>'; return false; } return true; };

  async function currentAdmin() {
    if (!configured()) return null;
    const { data:{ user } } = await cms.client.auth.getUser();
    if (!user) return null;
    const { data: profile } = await cms.client.from('profiles').select('role,email').eq('id', user.id).maybeSingle();
    return profile?.role === 'admin' ? { user, profile } : null;
  }
  async function protect() { const admin = await currentAdmin(); if (!admin) { location.replace('../login/'); return null; } return admin; }

  async function login() {
    if (!configured()) return;
    const form = document.querySelector('[data-login-form]');
    form.addEventListener('submit', async event => {
      event.preventDefault(); const button = form.querySelector('button'); button.disabled = true; notice('Γίνεται σύνδεση…');
      const { error } = await cms.client.auth.signInWithPassword({ email: form.email.value.trim(), password: form.password.value });
      if (error) { notice('Δεν ήταν δυνατή η σύνδεση. Ελέγξτε το email και τον κωδικό.', true); button.disabled = false; return; }
      const admin = await currentAdmin();
      if (!admin) { await cms.client.auth.signOut(); notice('Ο λογαριασμός αυτός δεν έχει δικαιώματα διαχειριστή.', true); button.disabled = false; return; }
      location.replace('../dashboard/');
    });
  }

  const articleRow = article => `<tr><td>${escape(article.title)}</td><td>${article.type === 'republished' ? 'Αναδημοσίευση' : 'Δικό μου άρθρο'}</td><td>${escape(article.category)}</td><td>${article.published_at || '—'}</td><td><span class="admin-status admin-status--${article.status}">${article.status === 'published' ? 'Δημοσιευμένο' : 'Πρόχειρο'}</span></td><td class="admin-actions"><a class="text-link" href="../editor/?id=${encodeURIComponent(article.id)}">Επεξεργασία</a><button class="text-button" data-toggle="${article.id}" data-status="${article.status}">${article.status === 'published' ? 'Απόσυρση' : 'Δημοσίευση'}</button><button class="text-button text-button--danger" data-delete="${article.id}" data-title="${escape(article.title)}">Διαγραφή</button></td></tr>`;
  async function dashboard() {
    const admin = await protect(); if (!admin) return;
    document.querySelector('[data-admin-email]').textContent = admin.profile.email;
    const table = document.querySelector('[data-articles-table]'); const filter = document.querySelector('[data-article-filter]');
    async function load() {
      notice('Φόρτωση άρθρων…'); let query = cms.client.from('articles').select('id,title,type,category,published_at,status').order('updated_at',{ascending:false});
      const value = filter.value; if (value === 'original' || value === 'republished') query = query.eq('type',value); if (value === 'draft' || value === 'published') query = query.eq('status',value);
      const { data, error } = await query; if (error) return notice('Δεν ήταν δυνατή η φόρτωση των άρθρων.', true);
      table.innerHTML = data.length ? data.map(articleRow).join('') : '<tr><td colspan="6">Δεν υπάρχουν άρθρα σε αυτή την κατηγορία.</td></tr>'; notice('');
    }
    filter.addEventListener('change',load); table.addEventListener('click', async event => {
      const target = event.target;
      if (target.dataset.toggle) { const status = target.dataset.status === 'published' ? 'draft' : 'published'; const { error } = await cms.client.from('articles').update({status, published_at: status === 'published' ? new Date().toISOString().slice(0,10) : null}).eq('id',target.dataset.toggle); if (error) notice('Η αλλαγή κατάστασης απέτυχε.',true); else load(); }
      if (target.dataset.delete) { if (!confirm(`Να διαγραφεί το άρθρο «${target.dataset.title}»; Η ενέργεια δεν αναιρείται.`)) return; const { error } = await cms.client.from('articles').delete().eq('id',target.dataset.delete); if (error) notice('Η διαγραφή απέτυχε.',true); else load(); }
    });
    document.querySelector('[data-logout]').addEventListener('click', async () => { await cms.client.auth.signOut(); location.replace('../login/'); }); load();
  }

  function field(name) { return document.querySelector(`[name="${name}"]`); }
  async function editor() {
    const admin = await protect(); if (!admin) return;
    const form = document.querySelector('[data-editor-form]'); let type = new URLSearchParams(location.search).get('type') === 'republished' ? 'republished' : 'original'; const id = new URLSearchParams(location.search).get('id');
    const setType = value => { type = value; field('type').value = type; document.querySelectorAll('[data-republished-only]').forEach(el => el.hidden = type !== 'republished'); };
    setType(type); document.querySelector('[data-editor-title]').textContent = id ? 'Επεξεργασία άρθρου' : type === 'republished' ? 'Νέα αναδημοσίευση' : 'Νέο άρθρο';
    if (id) { const { data, error } = await cms.client.from('articles').select('*').eq('id',id).maybeSingle(); if (error || !data) { notice('Το άρθρο δεν βρέθηκε.',true); return; } setType(data.type); Object.entries(data).forEach(([key,value]) => { const input=field(key); if(input && value !== null) input.value=value; }); if(data.cover_image_url) document.querySelector('[data-image-preview]').src=data.cover_image_url; }
    field('title').addEventListener('input', () => { if (!field('slug').dataset.edited) field('slug').value = slugify(field('title').value); }); field('slug').addEventListener('input',() => field('slug').dataset.edited='true');
    document.querySelectorAll('[data-markdown]').forEach(button => button.addEventListener('click',() => { const textarea=field('content'); const syntax=button.dataset.markdown; const start=textarea.selectionStart, end=textarea.selectionEnd, selection=textarea.value.slice(start,end)||'κείμενο'; const wrap={bold:`**${selection}**`,italic:`*${selection}*`,heading:`## ${selection}`,quote:`> ${selection}`,list:`- ${selection}`,link:`[${selection}](https://)`}[syntax]; textarea.setRangeText(wrap,start,end,'end'); textarea.focus(); }));
    field('cover').addEventListener('change', () => { const file=field('cover').files[0]; if(file) document.querySelector('[data-image-preview]').src=URL.createObjectURL(file); });
    async function save(status) {
      if (!form.reportValidity()) return; const data = Object.fromEntries(new FormData(form).entries()); delete data.cover; data.status=status; data.published_at = data.published_at || new Date().toISOString().slice(0,10); if (type === 'republished' && (!data.original_author.trim() || !data.source_name.trim() || !validUrl(data.source_url))) return notice('Συμπληρώστε αρχικό συγγραφέα, πηγή και έγκυρο URL που αρχίζει από http:// ή https://.',true);
      if (type === 'original') { data.original_author=null; data.source_name=null; data.source_url=null; } else data.author=null;
      const image = field('cover').files[0]; if (image) { const ext=(image.name.split('.').pop()||'jpg').replace(/[^a-z0-9]/gi,''); const path=`${crypto.randomUUID()}.${ext}`; const upload=await cms.client.storage.from('article-images').upload(path,image,{upsert:false,contentType:image.type}); if(upload.error) return notice('Το ανέβασμα της εικόνας απέτυχε.',true); data.cover_image_url=cms.client.storage.from('article-images').getPublicUrl(path).data.publicUrl; }
      notice(status === 'published' ? 'Γίνεται δημοσίευση…' : 'Γίνεται αποθήκευση…'); const result=id ? await cms.client.from('articles').update(data).eq('id',id) : await cms.client.from('articles').insert(data); if(result.error) return notice(`Η αποθήκευση απέτυχε: ${result.error.message}`,true); location.replace('../dashboard/');
    }
    document.querySelector('[data-save-draft]').addEventListener('click',()=>save('draft')); document.querySelector('[data-publish]').addEventListener('click',()=>save('published'));
  }
  if (page === 'login') login(); if (page === 'dashboard') dashboard(); if (page === 'editor') editor();
})();
