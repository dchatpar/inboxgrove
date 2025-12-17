# InboxGrove - Quick Deployment Guide

## 🚀 Deployment Options

### Option 1: Automatic Deployment via GitHub (Recommended)

Every time you push to GitHub, your app automatically deploys to Cloudflare Pages!

**Setup (One-time):**
1. Go to: https://github.com/dchatpar/inboxgrove/settings/secrets/actions
2. Create these secrets:
   - **CLOUDFLARE_API_TOKEN**: Your Cloudflare API token
   - **CLOUDFLARE_ACCOUNT_ID**: Your Cloudflare Account ID

**To deploy changes:**
```bash
git add .
git commit -m "Your change description"
git push origin main
```

✅ GitHub Actions will automatically build and deploy (watch the "Actions" tab on GitHub)

---

### Option 2: Local Deployment (Windows)

Deploy directly from your machine without pushing to GitHub.

**Run this after making changes:**
```powershell
.\deploy.bat
```

Or manually:
```powershell
npm run build
npx wrangler pages deploy dist --project-name=inboxgrove --commit-dirty=true
```

---

### Option 3: Local Deployment (Mac/Linux)

```bash
./deploy.sh
```

Or manually:
```bash
npm run build
npx wrangler pages deploy dist --project-name=inboxgrove --commit-dirty=true
```

---

## 📊 Current Deployment URLs

| Environment | URL |
|---|---|
| **Live (Latest)** | https://932b9f83.inboxgrove.pages.dev |
| **GitHub Repo** | https://github.com/dchatpar/inboxgrove |

---

## 📝 Workflow: Make Changes → Deploy → View

### Fast Local Loop:
1. Edit files in VS Code
2. Run: `.\deploy.bat` (Windows) or `./deploy.sh` (Mac/Linux)
3. Refresh browser at: https://932b9f83.inboxgrove.pages.dev
4. See changes live ✨

### GitHub Loop (with CI/CD):
1. Edit files
2. `git add . && git commit -m "message" && git push origin main`
3. Watch: https://github.com/dchatpar/inboxgrove/actions
4. Auto-deployed when build completes!

---

## 🔑 Getting Cloudflare API Token

**To set up GitHub Actions deployment:**

1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Click **"Create Token"**
3. Use template: **"Edit Cloudflare Workers"** or create custom with:
   - Permissions: `Workers:Edit`, `Pages:Edit`
   - Resources: Include `inboxgrove` project
4. Copy the token
5. Go to: https://github.com/dchatpar/inboxgrove/settings/secrets/actions
6. Click **"New repository secret"**
7. Name: `CLOUDFLARE_API_TOKEN`
8. Paste the token

**To get Account ID:**
- Go to https://dash.cloudflare.com/
- Right sidebar → Copy "Account ID" or check URL: `dash.cloudflare.com/ACCOUNT_ID`

---

## 🎯 Example: Making Your First Change

**Let's test it:**

1. Open `components/Hero.tsx` and change some text
2. Save the file
3. Run: `.\deploy.bat`
4. Wait for "✅ Deployment complete!"
5. Refresh https://932b9f83.inboxgrove.pages.dev
6. See your changes live! 🎉

---

## 📊 Monitoring Deployments

### Via GitHub Actions:
- Go to: https://github.com/dchatpar/inboxgrove/actions
- See all deployment history
- Check build logs if something fails

### Via Cloudflare:
- Go to: https://dash.cloudflare.com/pages
- Select "inboxgrove" project
- View deployment history and rollback if needed

---

## ⚠️ Troubleshooting

**Build fails?** → Check logs: `npm run build`

**Deploy fails?** → Ensure `dist/` folder exists: `npm run build` first

**Changes not visible?** → Hard refresh: `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)

**SSL error?** → Clear browser cache or wait 5-10 minutes for cert to update

---

## 🚀 Next Steps

1. ✅ Test local deployment with: `.\deploy.bat`
2. ✅ Set up GitHub secrets (optional but recommended)
3. ✅ Make your first change and deploy!
4. ✅ Watch the deployment URL update in real-time

Happy coding! 🎉
