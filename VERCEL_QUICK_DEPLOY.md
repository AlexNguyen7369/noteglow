# Quick Vercel Deployment - 5 Minutes

Your NoteGlow app IS ready to deploy to Vercel right now. Follow these steps:

## Step 1: Push Code to GitHub

```bash
cd c:\Users\alex\Desktop\GitHub\noteglow
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

## Step 2: Deploy on Vercel

1. Go to https://vercel.com
2. Click **"New Project"**
3. Connect your GitHub account
4. Select **`noteglow`** repository
5. Click **"Import"**
6. Vercel auto-detects Next.js ✅
7. **DO NOT CLICK DEPLOY YET** - go to Step 3 first

## Step 3: Add Environment Variable (IMPORTANT)

Before deploying, you MUST add your HuggingFace token:

1. In the Vercel import screen, click **"Environment Variables"**
2. Click **"Add"**
3. Set:
   - **Name**: `HF_TOKEN`
   - **Value**: `hf_your_token_here` (get from https://huggingface.co/settings/tokens)
   - **Environments**: Check `Production`, `Preview`, `Development`
4. Click **"Save"**

## Step 4: Deploy

Now click **"Deploy"** button

**That's it!** Your app will be live in 2-3 minutes at `https://noteglow-xxxx.vercel.app`

---

## If You Don't Have HuggingFace Token

**Option A**: Get a free HuggingFace token
1. Go to https://huggingface.co/signup
2. Create account
3. Go to https://huggingface.co/settings/tokens
4. Create new token (read-only is fine)
5. Copy token
6. Use in Step 3 above

**Option B**: Deploy without AI features (demo mode)
1. Skip adding HF_TOKEN
2. Deploy
3. App works but transform feature shows a message
4. You can add HF_TOKEN later

---

## Verify Deployment Works

Once deployed:
1. Open your app URL
2. Write some notes
3. Click "Transform"
4. Select options and click "Apply Transformation"
5. Should see results in sidebar

If transform fails:
- Check HF_TOKEN was added correctly
- Wait a moment (first deploy takes time)
- Refresh page

---

## Troubleshooting

**"Transform doesn't work"**
- Make sure HF_TOKEN was added to Vercel Environment Variables
- Check it was set for Production environment
- Try again in a few moments

**"Still doesn't work"**
1. Go to Vercel Dashboard
2. Select your project
3. Go to Deployments tab
4. Click latest deployment
5. View logs for error messages
6. Copy error and ask for help

---

## That's All!

Your app is now deployed on Vercel and will auto-update whenever you push to GitHub.

