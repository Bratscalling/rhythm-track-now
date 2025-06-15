
# Deployment Guide

## Prerequisites
Make sure you have `package-lock.json` in your root directory:
```bash
npm install
```

## Vercel Deployment

### Option 1: Automatic (Recommended)
1. Connect your GitHub repository to Vercel
2. Vercel will auto-detect settings from `vercel.json`
3. Deploy automatically

### Option 2: Manual Settings
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Framework**: Vite

### Custom Domain (Requires Pro Plan - $20/month)
- Add your domain in Vercel dashboard
- Configure DNS records as instructed

## Render Deployment

### Static Site Setup
1. Create account at [render.com](https://render.com)
2. Click "New" → "Static Site"
3. Connect your GitHub repository
4. Render will use `render.yaml` configuration automatically

### Manual Settings (if needed)
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Environment**: Node 18

### Custom Domain (FREE on Render!)
- Add custom domain in Render dashboard
- No additional cost for custom domains

## Platform Comparison

| Feature | Vercel Free | Vercel Pro | Render Free |
|---------|-------------|------------|-------------|
| Custom Domain | ❌ | ✅ ($20/mo) | ✅ (Free) |
| Build Minutes | 6,000/mo | Unlimited | 500/mo |
| Bandwidth | 100GB/mo | 1TB/mo | 100GB/mo |
| Sites | 10 | Unlimited | 10 |

## Recommended Choice
- **For Free Deployment**: Use Render (includes free custom domains)
- **For Enterprise**: Use Vercel Pro (better performance and features)

## Environment Variables
Both platforms support environment variables:
- Add them in platform dashboard
- Use for API keys, database URLs, etc.
