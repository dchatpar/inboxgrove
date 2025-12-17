@echo off
REM Local deployment script for Windows - Run this after making changes

echo.
echo 🔨 Building project...
call npm run build

if errorlevel 1 (
    echo ❌ Build failed!
    exit /b 1
)

echo.
echo 🚀 Deploying to Cloudflare Pages...
call npx wrangler pages deploy dist --project-name=inboxgrove --commit-dirty=true

if errorlevel 1 (
    echo ❌ Deployment failed!
    exit /b 1
)

echo.
echo ✅ Deployment complete!
echo 📱 View your app at: https://932b9f83.inboxgrove.pages.dev
echo.
echo 📝 Or push to GitHub for automatic deployment:
echo    git add .
echo    git commit -m "Your changes"
echo    git push origin main
