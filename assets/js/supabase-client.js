(function () {
  const config = window.SUPABASE_CONFIG || {};
  const configured = /^https:\/\/.+\.supabase\.co$/i.test(config.url || '') &&
    typeof config.anonKey === 'string' && config.anonKey.length > 20 &&
    !config.anonKey.includes('YOUR_');

  if (!configured || !window.supabase) {
    window.cms = { configured: false, client: null };
    return;
  }

  window.cms = {
    configured: true,
    client: window.supabase.createClient(config.url, config.anonKey, {
      auth: {
        storage: window.sessionStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  };
})();
