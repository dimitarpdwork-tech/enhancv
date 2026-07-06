# Signal Check (Enhancv version) - deployment guide

This is the full version: job legitimacy check, employer posting grader, CV/motivational
letter generation, and a real "people also looked up this" counter.

## What you need before starting

1. A free [Vercel](https://vercel.com) account (sign up with GitHub - fastest option).
2. An Anthropic API key from [console.anthropic.com](https://console.anthropic.com) -
   this is billed to your own Anthropic account, separate from any Claude.ai subscription.
3. (Optional, only for the "X people also looked up this" counter) A free
   [Upstash](https://upstash.com) Redis database via Vercel's marketplace integration.
   Skip this and the counter simply won't appear - everything else works without it.

## Steps

### 1. Get your files onto GitHub
Create a new GitHub repository and push this whole folder to it (or use GitHub's
"upload files" button in the browser if you don't want to use git directly).

### 2. Import the project into Vercel
- Go to vercel.com -> "Add New" -> "Project" -> import the GitHub repo you just created.
- Framework preset: choose "Other" (this isn't a framework, just static HTML + API functions).
- Click Deploy. It will succeed even without the API key set yet, but the tool won't
  work until you add it (next step).

### 3. Add your API key
- In the Vercel project -> Settings -> Environment Variables.
- Add a variable named `ANTHROPIC_API_KEY` with your real key as the value.
- Redeploy (Vercel -> Deployments -> click the three dots on the latest one -> Redeploy)
  so the function picks up the new variable.

### 4. (Optional) Add the lookup counter
- In the Vercel project -> Storage tab -> Browse Marketplace -> search "Upstash" ->
  install the Redis integration -> create a database -> connect it to this project.
- This automatically adds the right environment variables. Redeploy once more.
- If you skip this step entirely, the "X people also looked up this" line just never
  appears - nothing else breaks.

### 5. Test it
Visit the URL Vercel gives you (something like `signal-check-enhancv.vercel.app`).
Run a real scan. If something's wrong, check Vercel -> your project -> Deployments ->
the latest one -> Functions tab, which shows logs for `/api/claude` and `/api/lookup`.

## What changed from the version tested inside Claude

- Both AI calls now go through `/api/claude`, a serverless function that holds the
  real API key server-side. Nothing calls Anthropic directly from the browser anymore.
- The lookup counter now uses real Redis with an atomic increment (`INCR`), fixing a
  race condition the earlier in-browser version had. A random ID is stored in the
  browser's `localStorage` to recognize repeat visits - normal and expected for a real
  website (this is different from the Claude preview environment, where browser storage
  isn't available at all).
- The "network blocked, show an example instead" fallback from the in-Claude version
  is gone - it existed specifically to work around Claude's sandboxing, which doesn't
  apply here. If something fails now, you'll see a real error instead.

## Honest limitations, unchanged from before

- No caching - every scan is a fresh, billed API call with up to 3 web searches.
- Job-matching for the lookup counter is still text-based (company + title, or the
  posting URL) and can undercount if people phrase the same job slightly differently.
- No rate limiting. If you're sending this to real people, keep an eye on your
  Anthropic usage dashboard, especially early on.
