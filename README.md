# Chartie - AI-Powered Chart Generator

A production-ready web application that uses Google Gemini AI to generate detailed chart descriptions and recommendations. Built with a secure Node.js/Express backend and a clean, responsive frontend.

## 📋 Features

### Backend
- ✅ Secure Gemini API proxy with API key protection
- ✅ Rate limiting (100 requests per 15 minutes per IP)
- ✅ Response caching for improved performance
- ✅ CORS configuration for secure cross-origin requests
- ✅ Helmet.js security headers
- ✅ Health check endpoint
- ✅ Environment-based configuration
- ✅ Error handling and validation

### Frontend
- ✅ Clean, modern UI with responsive design
- ✅ Chart type selection (bar, line, pie, scatter, area, donut)
- ✅ Real-time character counter
- ✅ Loading states and error handling
- ✅ Result caching indicator
- ✅ Mobile-friendly interface

## 🏗️ Project Structure

```
chartie-production/
├── backend/
│   ├── server.js           # Express server with all middleware
│   ├── package.json        # Backend dependencies
│   └── .env.example        # Environment variable template
├── frontend/
│   ├── index.html          # Main HTML file
│   ├── styles.css          # Styling
│   └── app.js              # Frontend JavaScript
├── render.yaml             # Render deployment configuration
├── DEPLOYMENT.md           # Detailed deployment guide
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18 or higher
- A Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/GMalvern/chartie-production.git
   cd chartie-production
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   PORT=3000
   NODE_ENV=development
   ALLOWED_ORIGINS=http://localhost:3000
   ```

4. **Start the server**
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

5. **Access the application**
   Open your browser and navigate to: `http://localhost:3000`

## 🌐 Deployment

### Deploy to Render.com (Free Tier Available)

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

**Quick Deploy:**
1. Fork this repository
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Click "New +" → "Blueprint"
4. Connect your forked repository
5. Set the `GEMINI_API_KEY` environment variable
6. Click "Apply"

Your app will be live at `https://your-app-name.onrender.com`

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `GEMINI_API_KEY` | Your Google Gemini API key | - | ✅ Yes |
| `PORT` | Server port | 3000 | No |
| `NODE_ENV` | Environment (development/production) | production | No |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | http://localhost:3000 | No |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in milliseconds | 900000 (15 min) | No |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 | No |
| `CACHE_TTL_SECONDS` | Cache time-to-live in seconds | 3600 (1 hour) | No |

### Security Features

1. **Rate Limiting**: Prevents API abuse by limiting requests per IP
2. **API Key Protection**: Never exposes API key to frontend
3. **CORS Configuration**: Controls which origins can access the API
4. **Helmet.js**: Sets secure HTTP headers
5. **Input Validation**: Validates and sanitizes all user inputs
6. **Caching**: Reduces redundant API calls

## 📡 API Endpoints

### `POST /api/generate`
Generate a chart description using Gemini AI.

**Request Body:**
```json
{
  "prompt": "Create a bar chart showing Q1 sales data",
  "chartType": "bar"
}
```

**Response:**
```json
{
  "success": true,
  "description": "Detailed chart description...",
  "chartType": "bar",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "cached": false
}
```

### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "cache_stats": {
    "keys": 5,
    "hits": 10,
    "misses": 5
  }
}
```

### `GET /api/cache/stats`
Get cache statistics.

### `DELETE /api/cache/clear`
Clear all cached responses.

## 🧪 Testing

The application includes basic validation and error handling. To test:

1. **Test the health endpoint:**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Test chart generation:**
   ```bash
   curl -X POST http://localhost:3000/api/generate \
     -H "Content-Type: application/json" \
     -d '{"prompt": "Create a bar chart", "chartType": "bar"}'
   ```

3. **Test rate limiting:**
   Make multiple requests rapidly to trigger rate limiting.

## 🛠️ Development

### Backend Dependencies
- `express`: Web framework
- `cors`: Cross-origin resource sharing
- `helmet`: Security headers
- `express-rate-limit`: Rate limiting middleware
- `node-cache`: In-memory caching
- `dotenv`: Environment variable management
- `@google/generative-ai`: Google Gemini AI SDK

### Frontend
- Pure HTML, CSS, and JavaScript (no build step required)
- Modern ES6+ JavaScript
- Responsive CSS with CSS variables
- Fetch API for HTTP requests

## 📝 Usage Examples

1. **Generate a bar chart:**
   - Select "Bar Chart" from the dropdown
   - Enter: "Monthly sales for 2024: Jan $50k, Feb $65k, Mar $80k"
   - Click "Generate Chart Description"

2. **Generate a pie chart:**
   - Select "Pie Chart"
   - Enter: "Market share: Company A 45%, Company B 30%, Company C 25%"
   - Click "Generate Chart Description"

3. **Auto-detect chart type:**
   - Select "Auto-detect"
   - Enter any chart description
   - The AI will recommend the best chart type

## 🔒 Security Best Practices

1. Never commit `.env` files or API keys to version control
2. Regularly rotate your API keys
3. Monitor API usage in Google Cloud Console
4. Set appropriate rate limits for your use case
5. Use HTTPS in production (automatically provided by Render)
6. Keep dependencies updated

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

**Issue: "API key not configured"**
- Ensure `GEMINI_API_KEY` is set in your `.env` file or Render environment variables

**Issue: CORS errors**
- Check that your frontend URL is in `ALLOWED_ORIGINS`

**Issue: Rate limit exceeded**
- Wait 15 minutes or adjust `RATE_LIMIT_MAX_REQUESTS`

**Issue: Slow initial response on Render (free tier)**
- Free tier services sleep after inactivity; first request takes ~30-60 seconds

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/GMalvern/chartie-production/issues)
- **Documentation**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Render Support**: [Render Documentation](https://render.com/docs)

---

Built with ❤️ using Google Gemini AI