# Setting up the daily check dashboard

Three parts: deploy the Edge Function (does the password check + data
fetch), set the shared password, then host the HTML page somewhere with
a URL. All done through the Supabase dashboard UI - no command line
needed.

## 1. Deploy the Edge Function

1. In your Supabase project (the wtm-trainerize-sync one), find "Edge
   Functions" in the left sidebar.
2. Click "Create a new function" (or "Deploy a new function").
3. Name it `dashboard-data` exactly - this name is used in the URL.
4. When the code editor opens, delete whatever's there and paste in the
   full contents of `dashboard-data.ts` from this folder.
5. **Before deploying**, look for a setting called "Verify JWT" or
   "Enforce JWT verification" (sometimes a toggle during creation,
   sometimes in the function's settings afterward) and turn it OFF. The
   function does its own password check - if JWT verification stays on,
   the page will never be able to reach it.
6. Click Deploy.
7. Once deployed, copy the function's URL - it'll look like
   `https://xxxxx.supabase.co/functions/v1/dashboard-data`. You'll need
   this for the HTML page in step 3.

## 2. Set the password as a secret

1. Still in Edge Functions, find "Manage secrets" (sometimes under
   Settings within the Edge Functions area, sometimes a separate "Secrets"
   tab).
2. Add a new secret: Name `DASHBOARD_PASSWORD`, value whatever shared
   password you want the team to use.
3. Save.

Note: don't reuse your Trainerize or Supabase passwords for this - since
it's a shared team password typed into a page, treat it as low-security
and separate from anything that matters, and be ready to change it if it
ever gets shared more widely than intended.

## 3. Fill in and host the HTML page

1. Open `dashboard/index.html` in a text editor.
2. Near the top of the `<script>` section, replace:
   - `PASTE_YOUR_EDGE_FUNCTION_URL_HERE` with the URL from step 1.7
   - `PASTE_YOUR_SUPABASE_ANON_KEY_HERE` with your project's anon/
     publishable key (Project Settings -> API -> the "anon" or
     "publishable" key, NOT the secret/service_role one - this one is
     safe to put in a public HTML file, that's what it's for)
3. Save the file.

Now host it somewhere with a URL. Simplest option, staying inside
Supabase:

1. In Supabase, find "Storage" in the left sidebar.
2. Create a new bucket, name it something like `dashboard`, and mark it
   **Public** when creating it.
3. Upload your edited `index.html` into that bucket.
4. Click on the uploaded file, find "Get URL" or "Copy URL" - that's your
   dashboard's public web address.

Bookmark that URL. Anyone who opens it sees the password prompt first;
without the correct password, the Edge Function returns nothing.

## How it fits together

```
Browser opens the page (from Supabase Storage)
   -> types password
   -> page sends password to the Edge Function
        -> function checks it against DASHBOARD_PASSWORD secret
        -> if correct, function queries trainerize_daily_snapshot
           using the service role key (never sent to the browser)
        -> returns the rows as JSON
   -> page renders the client list, flagged clients first
```

## Updating the page later

If you ever want to change the layout or add something to what's shown,
edit `index.html` and re-upload it to the same Storage bucket (overwrite
the existing file) - no redeploy of the Edge Function needed unless
you're changing what data it returns.
