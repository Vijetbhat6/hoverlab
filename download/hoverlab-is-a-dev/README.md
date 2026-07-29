# How to get `hoverlab.is-a.dev` for free — step by step

You'll get a free `hoverlab.is-a.dev` subdomain forever. Two paths below — pick one.
The only things I (the AI) cannot do for you are the parts that legally require **your identity**:
create your GitHub account, accept GitHub's ToS, click "Submit PR", and provide your email.

Everything else is already prepared for you in this folder.

---

## Path A — CNAME (recommended) — `hoverlab.is-a.dev` shows your site directly

Visitors see `hoverlab.is-a.dev` in their address bar — cleanest result.

### Step 1 — Create accounts (free, ~3 min)
1. GitHub account → https://github.com/signup
2. Vercel account → https://vercel.com/signup (sign in with GitHub — 1 click)

### Step 2 — Push Hoverlab to GitHub (~5 min)
1. Create a new repo at https://github.com/new — name it `hoverlab`, set to **Public**
2. In the project folder on your machine:
   ```bash
   cd /home/z/my-project
   git remote add origin https://github.com/YOUR_USERNAME/hoverlab.git
   git push -u origin main
   ```
   (If `main` doesn't exist, run `git branch -M main` first.)

### Step 3 — Deploy to Vercel (~3 min)
1. Go to https://vercel.com/new
2. Import your `hoverlab` GitHub repo
3. Vercel auto-detects Next.js — accept the defaults, click **Deploy**
4. After deploy finishes, you get a URL like `hoverlab-YOUR_USERNAME.vercel.app`
5. Note that URL — you'll paste it into the JSON file below

### Step 4 — Edit the prepared JSON file
Open `hoverlab.json` (in this folder) and replace 3 placeholders:
- `REPLACE_WITH_YOUR_GITHUB_USERNAME` → your GitHub username
- `REPLACE_WITH_YOUR_EMAIL@example.com` → your email
- `REPLACE_WITH_YOUR_DEPLOYED_HOST.vercel.app` → the Vercel URL from step 3 (without `https://`)

### Step 5 — Submit the is-a.dev pull request (~5 min)
1. Go to https://github.com/is-a-dev/register
2. Click **Fork** (top right) → create fork in your account
3. In your fork, navigate to `domains/` folder → click **Add file → Create new file**
4. Name the file `hoverlab.json`
5. Paste the edited contents of `hoverlab.json` from this folder
6. Click **Commit changes...** → commit to main
7. Go to the **Pull requests** tab → **New pull request**
8. Title: `Register hoverlab.is-a.dev`
9. In the description, paste this template (fill in the preview URL):

   ```
   ## Requirements
   - [x] I agree to the [Terms of Service](https://is-a.dev/terms).
   - [x] My file is following the domain structure.
   - [x] My website is reachable and completed.
   - [x] My website is software development related.
   - [x] My website is not for commercial use.
   - [x] I have provided contact information in the `owner` key.
   - [x] I have provided a preview of my website below.

   ## Website Preview
   Live at: https://hoverlab-YOUR_USERNAME.vercel.app
   (Screenshot attached)

   ## Website Purpose
   Hoverlab is an open-source library of pure-CSS effects (1,680 effects across
   13 categories: buttons, loaders, cards, text, backgrounds, navigation, dividers,
   badges, etc.) with live demos and copy-ready code. Free, no signup required to browse.
   ```

10. Click **Create pull request**

### Step 6 — Wait for review (usually 1-3 days)
A maintainer will review. If approved, they merge your PR and `hoverlab.is-a.dev` goes live within minutes — pointing to your Vercel deployment.

### Step 7 — Add the custom domain in Vercel
Once your PR is merged:
1. Vercel dashboard → your project → **Settings → Domains**
2. Add `hoverlab.is-a.dev`
3. Vercel auto-detects the is-a.dev CNAME — HTTPS provisions automatically

That's it. `hoverlab.is-a.dev` is now your site, free forever.

---

## Path B — URL redirect (faster, no Vercel deploy needed)

Visitors type `hoverlab.is-a.dev` → browser redirects to your current z.ai preview URL.

Downside: the address bar will show the long z.ai URL after redirect, not `hoverlab.is-a.dev`.

### Steps
Same as Path A but:
- Skip Steps 2-3 (no GitHub push, no Vercel deploy)
- In Step 4, use `hoverlab-redirect-only.json` instead
- Replace `REPLACE_WITH_BOT_ID` with your z.ai bot ID (visible in the URL bar of this chat)

### Why Path A is better
- Clean URL stays as `hoverlab.is-a.dev` in the address bar
- Vercel gives you free HTTPS, analytics, edge caching
- If z.ai sandbox ever goes down, your site stays up on Vercel
- Vercel is free for personal projects forever

---

## What I (the AI) cannot do
1. ❌ Create your GitHub account (needs your identity + ToS acceptance)
2. ❌ Create your Vercel account (needs GitHub OAuth consent from you)
3. ❌ Click "Submit pull request" (needs to be under your GitHub account)
4. ❌ Provide your email

## What I've already done for you
1. ✅ Renamed entire site to "Hoverlab" (all UI, metadata, OG image, favicon, manifest)
2. ✅ Built a branded favicon + 1200×630 social share card
3. ✅ Pre-wired `.env` with `NEXT_PUBLIC_SITE_URL` so OG URLs work the moment the domain points here
4. ✅ Pre-prepared the `hoverlab.json` is-a.dev domain file (Path A) — `download/hoverlab-is-a-dev/hoverlab.json`
5. ✅ Pre-prepared the redirect-only variant (Path B) — `download/hoverlab-is-a-dev/hoverlab-redirect-only.json`
6. ✅ Pre-wrote the PR description text (in this file, Step 5.9)
7. ✅ The Next.js app is already production-ready (`npm run build` verified, Vercel auto-detects Next.js)

## What you need to tell me to finish Path A
After you've done Steps 1-3, just paste me:
- Your GitHub username
- Your Vercel URL (e.g. `hoverlab-abc123.vercel.app`)

… and I'll finalize the `hoverlab.json` file with the exact contents to paste into the PR.
