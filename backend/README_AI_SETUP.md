# AI Service Setup Guide

This guide explains how to configure AI services for the FlowBitAi LLM nodes.

## Required Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

### Google Gemini AI (Recommended - Default Service)
```bash
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
GEMINI_MAX_TOKENS=2048
GEMINI_TEMPERATURE=0.7
```

**How to get Gemini API key:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key

### OpenAI (Optional)
```bash
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=2048
OPENAI_TEMPERATURE=0.7
```

**How to get OpenAI API key:**
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the generated key

### Anthropic (Optional)
```bash
ANTHROPIC_API_KEY=your_anthropic_api_key_here
ANTHROPIC_MODEL=claude-3-sonnet-20240229
ANTHROPIC_MAX_TOKENS=2048
ANTHROPIC_TEMPERATURE=0.7
```

**How to get Anthropic API key:**
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign in or create an account
3. Navigate to API Keys
4. Click "Create Key"
5. Copy the generated key

## Configuration Options

### Models Available
- **Gemini**: gemini-1.5-flash, gemini-1.5-pro, gemini-2.0-flash, gemini-2.0-pro
- **OpenAI**: gpt-3.5-turbo, gpt-4, gpt-4-turbo
- **Anthropic**: claude-3-sonnet-20240229, claude-3-opus-20240229, claude-3-haiku-20240307

### Parameters
- **maxTokens**: Maximum number of tokens in the response (default: 2048)
- **temperature**: Controls randomness (0.0 = deterministic, 1.0 = very random, default: 0.7)

## Usage

1. **Copy the example environment variables above**
2. **Replace the placeholder values with your actual API keys**
3. **Save the file as `.env` in the backend directory**
4. **Restart your backend server**

## Security Notes

- Never commit your `.env` file to version control
- Keep your API keys secure and don't share them
- Consider using environment-specific keys for production
- Monitor your API usage to avoid unexpected charges

## Testing

After setup, you can test the AI services:

1. **Check service status**: `GET /api/llm/status`
2. **Test LLM processing**: `POST /api/llm/process`
3. **View capabilities**: `GET /api/llm/capabilities`

## Troubleshooting

- **"API key not configured"**: Check that your `.env` file is in the correct location
- **"Service not available"**: Verify your API key is valid and has sufficient credits
- **Rate limiting errors**: Check your API provider's rate limits and billing status

