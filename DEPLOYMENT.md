# Chartie Deployment Guide for Render.com

## Prerequisites
- A Render.com account (free tier available)
- A Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))
- This repository forked or cloned

## Deployment Steps

### Option 1: Using Render Blueprint (Recommended)

1. **Connect Repository to Render**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Blueprint"
   - Connect your GitHub account if not already connected
   - Select the `chartie-production` repository
   - Render will automatically detect the `render.yaml` file

2. **Configure Environment Variables**
   After the blueprint is loaded, you'll need to set these environment variables:
   
   - `GEMINI_API_KEY` (Required): Your Google Gemini API key
   - `ALLOWED_ORIGINS` (Optional): Comma-separated list of allowed origins for CORS
     - Default: `http://localhost:3000`
     - For production: Use your Render URL, e.g., `https://chartie-app.onrender.com`

3. **Deploy**
   - Click "Apply" to create the service
   - Render will build and deploy your application
   - First deployment may take 5-10 minutes

### Option 2: Manual Deployment

1. **Create a New Web Service**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your repository

2. **Configure Service Settings**
   ```
   Name: chartie-app
   Region: Oregon (US West)
   Branch: main
   Root Directory: backend
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   Plan: Free
   ```

3. **Add Environment Variables**
   Go to the "Environment" tab and add:
   ```
   NODE_ENV=production
   PORT=10000
   GEMINI_API_KEY=your_actual_api_key_here
   ALLOWED_ORIGINS=https://your-app-name.onrender.com
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   CACHE_TTL_SECONDS=3600
   ```

4. **Configure Health Check** (Optional but recommended)
   - Path: `/health`
   - This helps Render monitor your service health

5. **Deploy**
   - Click "Create Web Service"
   - Render will automatically deploy your application

## Post-Deployment

### Update ALLOWED_ORIGINS
After your first deployment, update the `ALLOWED_ORIGINS` environment variable:
1. Go to your service settings in Render
2. Navigate to "Environment" tab
3. Update `ALLOWED_ORIGINS` to include your Render URL
4. Example: `https://chartie-app.onrender.com`
5. Save changes - Render will automatically redeploy

### Access Your Application
Your application will be available at:
```
https://your-app-name.onrender.com
```

### Monitor Your Service
- Check logs in the Render dashboard under "Logs" tab
- Monitor health at: `https://your-app-name.onrender.com/health`
- View cache statistics at: `https://your-app-name.onrender.com/api/cache/stats`

## Important Notes

### Free Tier Limitations
- Free tier services spin down after 15 minutes of inactivity
- First request after spin-down may take 30-60 seconds
- Upgrade to paid tier ($7/month) for always-on service

### Rate Limiting
Default configuration:
- 100 requests per 15 minutes per IP address
- Adjust `RATE_LIMIT_MAX_REQUESTS` and `RATE_LIMIT_WINDOW_MS` as needed

### Caching
- Responses are cached for 1 hour (3600 seconds) by default
- Adjust `CACHE_TTL_SECONDS` to change cache duration
- Cache reduces API calls to Gemini and improves response time

### Security Best Practices
1. Never commit your `.env` file or API keys to the repository
2. Use Render's environment variables for all sensitive data
3. Regularly rotate your API keys
4. Monitor API usage in Google Cloud Console

## Troubleshooting

### Service Won't Start
- Check logs in Render dashboard
- Verify all environment variables are set correctly
- Ensure `GEMINI_API_KEY` is valid

### CORS Errors
- Verify `ALLOWED_ORIGINS` includes your frontend domain
- For development, use: `http://localhost:3000`
- For production, use your Render URL

### Rate Limit Errors
- Increase `RATE_LIMIT_MAX_REQUESTS` if needed
- Consider implementing user authentication for higher limits

### API Key Errors
- Verify your Gemini API key is valid
- Check API key permissions in Google Cloud Console
- Ensure billing is enabled for your Google Cloud project

## Custom Domain (Optional)

To use a custom domain:
1. Go to your service settings in Render
2. Navigate to "Settings" → "Custom Domain"
3. Add your domain and follow DNS configuration instructions
4. Update `ALLOWED_ORIGINS` to include your custom domain

## Support

For issues specific to:
- **Render deployment**: [Render Documentation](https://render.com/docs)
- **Gemini API**: [Google AI Documentation](https://ai.google.dev/docs)
- **This application**: Open an issue on GitHub
