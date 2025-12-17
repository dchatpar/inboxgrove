#!/bin/bash
# Local deployment script - Run this after making changes

set -e

echo "🔨 Building project..."
npm run build

echo "🚀 Deploying to Cloudflare Pages..."
npx wrangler pages deploy dist --project-name=inboxgrove --commit-dirty=true

echo "✅ Deployment complete!"
echo "📱 View your app at: https://932b9f83.inboxgrove.pages.dev"
echo ""
echo "📝 Or push to GitHub for automatic deployment:"
echo "   git add ."
echo "   git commit -m 'Your changes'"
echo "   git push origin main"
