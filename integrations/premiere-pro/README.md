# Ursly AI Assistant - Adobe Premiere Pro Plugin

A TypeScript-based UXP (Unified Extensibility Platform) plugin that integrates Ursly's local AI capabilities directly into Adobe Premiere Pro for video editing assistance.

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| TypeScript | ~5.3.3 | Type-safe development |
| Node.js | 24.x | Runtime environment |
| Zod | ^3.22.4 | Runtime schema validation |
| Jest | ^29.7.0 | Unit testing |
| ts-jest | ^29.1.0 | TypeScript Jest transformer |

## Features

- **Generate Captions**: Automatically generate accurate, well-timed captions using local AI models
- **Analyze Scene**: Get AI-powered insights about the current scene including mood, technical observations, and editing suggestions
- **Smart Cut**: Receive intelligent cut point suggestions and pacing recommendations
- **Chat Interface**: Interact with AI for custom editing guidance and questions
- **Privacy First**: All processing happens locally through your Ursly API - no cloud required

## Requirements

- Adobe Premiere Pro 2024 (v25.0) or later
- Node.js 24.x or later
- Ursly API running locally (default: `http://localhost:3000`)
- At least one Ollama model pulled (e.g., `llama3`, `mistral`)

## Installation

### Development Setup

1. **Install Dependencies**
   ```bash
   cd integrations/premiere-pro
   npm install
   ```

2. **Build the Plugin**
   ```bash
   npm run build
   ```

3. **Enable Developer Mode in Premiere Pro**
   - Go to `Preferences > General`
   - Enable "Enable Developer Mode"
   - Restart Premiere Pro

4. **Load the Plugin**
   - In Premiere Pro, go to `Plugins > Development > Show Logs`
   - Go to `Plugins > Development > Load a UXP Plugin...`
   - Navigate to `integrations/premiere-pro` and select `manifest.json`

### Production Build

```bash
# Build for production
npm run build

# Package the plugin (requires Adobe UXP Developer Tools)
npx @adobe/ccx-plugin-packager pack manifest.json
```

## Configuration

### API Endpoint

1. Open the Ursly AI panel in Premiere Pro
2. Click the Settings toggle
3. Enter your Ursly API endpoint (default: `http://localhost:3000`)
4. Click "Save Settings"
5. Click "Connect" to establish connection

### Model Selection

After connecting:
1. Use the Model dropdown to select your preferred AI model
2. Recommended models:
   - **llama3** - General purpose, good for captions and analysis
   - **mistral** - Fast inference, good for chat
   - **codellama** - Technical descriptions

## Project Structure

```
integrations/premiere-pro/
  __tests__/                     # Unit tests (TypeScript + Jest)
    main.spec.ts                # Plugin controller tests
    premiere-api.spec.ts        # Premiere Pro API tests
    ursly-api.spec.ts           # Ursly API client tests
    setup.ts                    # Test environment setup
  dist/                          # Compiled JavaScript output
  icons/                         # Plugin icons (24px, 48px)
  src/                           # TypeScript source files
    lib/                        # Infrastructure layer
      index.ts                  # Library exports
      premiere-api.ts           # Premiere Pro UXP adapter
      ursly-api.ts              # Ursly API HTTP adapter
    schemas/                    # Zod validation schemas
      api.schemas.ts            # API request/response schemas
      index.ts                  # Schema exports
    types/                      # TypeScript type definitions
      premiere.types.ts         # Premiere Pro UXP types
      index.ts                  # Type exports
    main.ts                     # Plugin controller (Application Layer)
  index.html                     # Plugin panel UI
  manifest.json                  # UXP plugin manifest
  package.json                   # Node.js config
  README.md                      # This file
  styles.css                     # Dark theme styling
  tsconfig.json                  # TypeScript configuration
  tsconfig.spec.json             # TypeScript test configuration
```

## Architecture

This plugin follows **Clean Architecture** principles as defined in the Ursly project's `agents.md`:

### Layers

1. **Presentation Layer** (`index.html`, `styles.css`)
   - DOM manipulation and event handling
   - User interface components

2. **Application Layer** (`src/main.ts`)
   - Use case orchestration
   - Business logic coordination
   - Prompt builders and response parsers

3. **Infrastructure Layer** (`src/lib/`)
   - `ursly-api.ts` - HTTP adapter for Ursly API
   - `premiere-api.ts` - UXP adapter for Premiere Pro

### Design Patterns

- **Ports & Adapters**: API modules implement adapter interfaces
- **Observer Pattern**: Event-driven UI updates
- **Singleton**: Plugin controller instance
- **Zod Validation**: Runtime type checking for API contracts

## Development

### Available Scripts

```bash
# Build TypeScript to JavaScript
npm run build

# Build in watch mode
npm run build:watch

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Lint TypeScript files
npm run lint

# Format code with Prettier
npm run format

# Clean build output
npm run clean
```

### Adding New Features

1. Define types in `src/types/`
2. Add Zod schemas in `src/schemas/`
3. Implement infrastructure adapters in `src/lib/`
4. Add use cases in `src/main.ts`
5. Create tests in `__tests__/`

### Type Safety

All API contracts are validated at runtime using Zod:

```typescript
import { CompletionOptionsSchema } from './schemas';

// Validated at runtime
const options = CompletionOptionsSchema.parse({
  temperature: 0.7,
  maxTokens: 2048,
});
```

## API Reference

### Ursly API Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Check API connectivity |
| `/models` | GET | List available models |
| `/models/{model}/generate` | POST | Generate completion |
| `/api/tasks/execute` | POST | Execute AI tasks |

### Premiere Pro UXP APIs Used

| API | Description |
|-----|-------------|
| `premierepro.app` | Application access |
| `premierepro.project` | Project management |
| `premierepro.sequence` | Sequence manipulation |
| `uxp.storage` | Settings persistence |

## Troubleshooting

### TypeScript Build Errors

```bash
# Clean and rebuild
npm run clean && npm run build
```

### Plugin Won't Load

1. Ensure Developer Mode is enabled
2. Verify `dist/main.js` exists (run `npm run build`)
3. Check that `manifest.json` is valid JSON
4. Verify Premiere Pro version is 25.0+

### Connection Failed

1. Verify Ursly API is running: `curl http://localhost:3000/health`
2. Check firewall settings
3. Ensure CORS is configured in the API

### Captions Not Appearing

1. Verify you have audio on the timeline
2. Check that a CC track exists
3. Review the console for errors

### Models Not Loading

1. Verify Ollama is running: `ollama list`
2. Pull at least one model: `ollama pull llama3`
3. Check API connection status

## Contributing

1. Follow the coding standards in `agents.md`
2. Use TypeScript strict mode
3. Add Zod schemas for new API contracts
4. Add unit tests for new features (80%+ coverage)
5. Update this README for new functionality
6. Test in Premiere Pro before submitting

## License

MIT License - See LICENSE file in the project root.

## Support

- Documentation: https://ursly.io/docs/integrations/premiere-pro
- Issues: https://github.com/ursly/ursly/issues
- API Docs: http://localhost:3000/api/docs (when running locally)
