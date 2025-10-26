# NoteGlow - Vercel Deployment Guide

This guide walks you through deploying NoteGlow to Vercel in minutes.

---

## Prerequisites

- **GitHub Account** - Your code must be in a GitHub repository
- **Vercel Account** - Free tier available at [vercel.com](https://vercel.com)
- **HuggingFace API Token** - For AI features (free at [huggingface.co](https://huggingface.co/settings/tokens))

---

## Step 1: Push Code to GitHub

If you haven't already, push your NoteGlow repository to GitHub:

```bash
# Navigate to your project
cd path/to/noteglow

# Initialize git if needed
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: NoteGlow application"

# Add GitHub remote (replace YOUR_USERNAME and YOUR_REPO)
git remote add origin https://github.com/YOUR_USERNAME/noteglow.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## Step 2: Create Vercel Account & Connect GitHub

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"** and choose **"Continue with GitHub"**
3. Authorize Vercel to access your GitHub account
4. You'll be taken to the Vercel dashboard

---

## Step 3: Deploy Your Project

### Option A: Deploy from Vercel Dashboard (Easiest)

1. In Vercel dashboard, click **"Add New..."** → **"Project"**
2. Find and click on **`noteglow`** repository
3. Click **"Import"**
4. Vercel will auto-detect Next.js framework ✅
5. Click **"Deploy"** to deploy with default settings

The deployment will take 1-2 minutes.

### Option B: Deploy with Vercel CLI

```bash
# Install Vercel CLI globally
npm i -g vercel

# Navigate to your project
cd path/to/noteglow

# Deploy
vercel

# Follow the prompts:
# - Link to existing project? No
# - Set project name: noteglow
# - Confirm production deploy? Yes
```

---

## Step 4: Set Environment Variables

After deployment, you need to add your HuggingFace token:

### Via Vercel Dashboard:

1. Go to your project on [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click on **`noteglow`** project
3. Go to **Settings** → **Environment Variables**
4. Click **"Add New"**
5. Set:
   - **Name**: `HF_TOKEN`
   - **Value**: Your HuggingFace API token (from [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens))
   - **Environments**: Select `Production`, `Preview`, and `Development`
6. Click **"Save"**

### Via Vercel CLI:

```bash
vercel env add HF_TOKEN
# Paste your HuggingFace token when prompted
# Select all environments: Production, Preview, Development
```

---

## Step 5: Redeploy with Environment Variables

After adding environment variables, you need to redeploy:

### Via Vercel Dashboard:

1. Go to **Deployments**
2. Click the three dots on your latest deployment
3. Click **"Redeploy"**
4. Wait for redeployment to complete

### Via Vercel CLI:

```bash
vercel --prod
```

---

## Step 6: Verify Deployment

1. Your project will be live at: `https://noteglow-<random>.vercel.app`
2. Or use a custom domain (add in Settings → Domains)
3. Test the application:
   - ✅ Write some notes
   - ✅ Click "Transform"
   - ✅ Select options and click "Apply Transformation"
   - ✅ Click a key term to see definition

---

## Important: Environment Variables Reference

Your app needs this environment variable to function:

| Variable | Required | Description | Where to Get |
|----------|----------|-------------|--------------|
| `HF_TOKEN` | Yes | HuggingFace API token | [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) |

**Note**: Make sure to keep your token private. Never commit `.env.local` to GitHub.

---

## Troubleshooting

### 1. Build Fails with "HF_TOKEN not found"

**Problem**: Deployment fails because HF_TOKEN is not set.

**Solution**:
1. Go to Vercel Settings → Environment Variables
2. Verify `HF_TOKEN` is added
3. Make sure it's selected for Production environment
4. Redeploy with `vercel --prod`

### 2. Transform API Returns 401 Error

**Problem**: "HuggingFace API authentication failed"

**Solution**:
1. Verify your HuggingFace token is valid at [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
2. Copy the token again (full value)
3. Update the environment variable in Vercel
4. Redeploy

### 3. App Loads But Transform Doesn't Work

**Problem**: The transform button works but returns errors.

**Solution**:
- Open browser DevTools (F12) → Console
- Look for error messages
- Common issues:
  - HF_TOKEN not set → Add to Vercel env vars
  - HuggingFace API down → Check [huggingface.co/status](https://huggingface.co/status)
  - Rate limiting → Wait a few minutes and retry

### 4. Definitions Not Loading

**Problem**: Clicking key terms shows "Loading..." indefinitely.

**Solution**:
- Check browser DevTools → Network tab
- Verify `/api/term-definition` requests are succeeding (200 status)
- If failing, check HuggingFace API status
- May need to increase timeout if using free tier

---

## Production Best Practices

### 1. Custom Domain

1. Go to Vercel Dashboard → Project Settings → Domains
2. Click "Add Domain"
3. Enter your domain (e.g., `noteglow.com`)
4. Update DNS records as instructed
5. Vercel provides free SSL certificate automatically

### 2. Monitor Deployments

1. Enable notifications in Vercel Settings
2. Get alerts for failed deployments
3. Check Analytics tab for traffic insights

### 3. Automatic Deployments

- Vercel automatically deploys on every push to `main` branch
- Pull requests get preview deployments
- Add status checks to prevent bad merges

### 4. Environment Variables for Different Stages

You can set different values for Production, Preview, and Development:

1. Go to Settings → Environment Variables
2. Click on a variable
3. Use dropdown to select which environment it applies to

**Example**:
- **Production**: Your main HF_TOKEN
- **Preview**: Same or different token for testing
- **Development**: Local only (use `.env.local`)

---

## Performance Tips

### 1. Vercel Analytics

Vercel automatically tracks:
- Page load times
- Core Web Vitals
- Error rates

Check in Analytics tab to monitor performance.

### 2. Edge Functions (Optional)

The transform API runs on serverless functions. Performance is good, but if you scale:
- Consider moving to Edge Functions for lower latency
- Requires minimal code changes

### 3. Caching

Vercel caches static files automatically:
- Next.js assets (JS, CSS, images)
- API responses can be cached with `revalidate`

---

## Rollback & Revert

### Rollback to Previous Deployment

1. Go to Vercel Dashboard → Deployments
2. Find the deployment you want
3. Click three dots → "Promote to Production"

### Revert Code

If you deployed bad code:
```bash
# Revert to previous commit
git revert HEAD

# Push to GitHub
git push origin main

# Vercel will auto-redeploy with previous version
```

---

## Next Steps

After deployment:

1. ✅ **Share your app** - Send the URL to friends
2. ✅ **Add custom domain** - Make it look professional
3. ✅ **Set up analytics** - Monitor usage in Vercel dashboard
4. ✅ **Plan features** - Use the workplan in README.md
5. ✅ **Scale infrastructure** - Upgrade Vercel plan if needed

---

## FAQ

### Q: Is Vercel free?
**A**: Yes! Vercel free tier includes:
- Unlimited deployments
- Serverless function calls
- 12 GB-hours of function execution monthly
- Perfect for small projects

### Q: Can I use a custom domain?
**A**: Yes! Add it in Settings → Domains. SSL certificate is free and automatic.

### Q: What happens to my data?
**A**: Notes are stored in browser localStorage. No data is sent to servers (except API calls to HuggingFace). When user closes browser, data stays in their browser only.

### Q: Can I change environment variables later?
**A**: Yes! Update in Vercel Settings → Environment Variables. Need to redeploy for changes to take effect.

### Q: What if HuggingFace API goes down?
**A**: Your app will show errors. Users can still write notes, but transform won't work. HuggingFace is very reliable (99.9% uptime).

### Q: Can I host on other platforms?
**A**: Yes! Since it's a Next.js app, it can deploy to:
- Netlify
- Railway
- Render
- AWS
- Docker containers

But Vercel is easiest (built by Next.js creators).

---

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **HuggingFace Docs**: https://huggingface.co/docs
- **GitHub Issues**: Create an issue in your repo for bugs

---

## Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Vercel account created
- [ ] Project imported to Vercel
- [ ] HF_TOKEN environment variable added
- [ ] Project redeployed after adding env var
- [ ] App loads and runs at `https://noteglow-*.vercel.app`
- [ ] Transform feature works (with HF_TOKEN)
- [ ] Definitions load correctly
- [ ] localStorage persistence works
- [ ] Can download notes as text file

Once all checkboxes are ✅, your app is live!

