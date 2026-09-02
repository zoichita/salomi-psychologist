# Εξέλιξη — website και διαχείριση άρθρων

## Αρχιτεκτονική

Το site είναι static HTML/CSS/vanilla JavaScript και δημοσιεύεται από το GitHub Pages. Η δημόσια ενότητα άρθρων (`/arthra/`) διαβάζει αποκλειστικά δημοσιευμένα records από Supabase PostgreSQL. Η διαχείριση βρίσκεται εκτός του public menu στις διευθύνσεις:

- `/admin/login/`
- `/admin/dashboard/`
- `/admin/editor/`

Το browser χρησιμοποιεί μόνο το Supabase Project URL και το public anon/publishable key. Δεν υπάρχει password ή service-role key στο repository. Το Supabase Auth εκδίδει το session και οι πραγματικές άδειες ελέγχονται από τις RLS policies της βάσης. Το session αποθηκεύεται μόνο για την τρέχουσα καρτέλα (`sessionStorage`) από το Supabase SDK· δεν χρησιμοποιείται localStorage ή frontend role flag ως μηχανισμός ασφάλειας.

Οι dynamic article URLs χρησιμοποιούν `/arthra/article/?slug=...`. Αυτό είναι συμβατό με refresh σε GitHub Pages χωρίς server-side routing. Το GitHub Pages δεν μπορεί να δημιουργεί νέο physical directory για κάθε database record σε πραγματικό χρόνο.

## Ρύθμιση Supabase

1. Δημιουργήστε νέο project στο [Supabase](https://supabase.com/).
2. Από **SQL Editor → New query**, εκτελέστε ολόκληρο το [001_articles_cms.sql](supabase/migrations/001_articles_cms.sql).
3. Από **Authentication → Providers**, ενεργοποιήστε Email/Password. Στις **URL Configuration** προσθέστε:
   - `https://zoichita.github.io/salomi-psychologist/admin/login/`
   - το localhost URL που θα χρησιμοποιείτε για δοκιμές, π.χ. `http://localhost:4174/admin/login/`
4. Από **Authentication → Users**, δημιουργήστε τον πρώτο χρήστη με email και password. Μετά εκτελέστε στο SQL Editor, αντικαθιστώντας το email:

   ```sql
   update public.profiles set role = 'admin' where email = 'your-admin-email@example.com';
   ```

5. Το migration δημιουργεί αυτόματα public Storage bucket `article-images` και τις RLS policies του. Μην αλλάξετε το bucket σε private, γιατί οι δημοσιευμένες εικόνες προβάλλονται στο public site.
6. Από **Project Settings → API**, αντιγράψτε το **Project URL** και το **anon/publishable key**. Αυτά είναι public client values, όχι secrets. Ποτέ μην χρησιμοποιήσετε το `service_role` key στον browser.
7. Αντιγράψτε `assets/js/supabase-config.example.js` σε `assets/js/supabase-config.js` και συμπληρώστε μόνο τα δύο public values. Το αρχείο υπάρχει ήδη με κενές τιμές, ώστε το site να εμφανίζει ασφαλές setup state μέχρι να ρυθμιστεί.

## Δημοσίευση στο GitHub Pages

Μετά τη ρύθμιση του config, κάντε commit και push στο `main`:

```powershell
git add assets/js/supabase-config.js
git commit -m "Configure Supabase public client"
git push origin main
```

Στο GitHub: **Settings → Pages → Deploy from a branch → main / root**. Οι τιμές στο config είναι client-side public values και η προστασία των δεδομένων προέρχεται από RLS, όχι από την απόκρυψη του anon key.

## Τοπική δοκιμή

Από τον φάκελο του project:

```powershell
python -m http.server 4174
```

Ανοίξτε `http://localhost:4174/arthra/` και `http://localhost:4174/admin/login/`.

## Έλεγχος ασφάλειας

- Public visitors: `SELECT` μόνο άρθρα με `status = 'published'`.
- Απλοί authenticated users: δεν μπορούν να γράψουν, αλλάξουν ή διαγράψουν records.
- Μόνο user με `profiles.role = 'admin'`: insert/update/delete άρθρων και upload/delete εικόνων.
- Μην παρακάμπτετε το migration ή τις RLS policies.
