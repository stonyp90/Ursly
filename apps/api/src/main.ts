import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [
    'http://localhost:1420',
    'http://localhost:4200',
    'http://localhost:4201',
    'http://localhost:3000',
    'tauri://localhost',        // Tauri 1.x
    'http://tauri.localhost',   // Tauri 2.x
  ];
  
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Agent Orchestrator API')
    .setDescription('API for managing AI agents and tasks with Ollama')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentication and token exchange')
    .addTag('Agents', 'Agent management')
    .addTag('Models', 'Ollama model management')
    .addTag('Tasks', 'Task execution and monitoring')
    .addTag('Audit', 'Audit log querying')
    .addTag('Health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.min.js',
      '/api/docs/swagger-init.js',
    ],
    customSiteTitle: 'Agent Orchestrator API',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
    customCss: `
      /* Dark theme for Swagger UI */
      body { background-color: #1a1a2e; }
      .swagger-ui { background: #1a1a2e; }
      .swagger-ui .topbar { background-color: #16213e; border-bottom: 1px solid #0f3460; }
      .swagger-ui .info .title { color: #e94560; }
      .swagger-ui .info { margin: 20px 0; }
      .swagger-ui .info .description, .swagger-ui .info li, .swagger-ui .info p { color: #a0a0b0; }
      .swagger-ui .opblock-tag { color: #e8e8e8; border-bottom: 1px solid #0f3460; }
      .swagger-ui .opblock-tag:hover { background: #16213e; }
      .swagger-ui .opblock { background: #16213e; border: 1px solid #0f3460; box-shadow: none; }
      .swagger-ui .opblock .opblock-summary { border: none; }
      .swagger-ui .opblock .opblock-summary-method { background: #e94560; }
      .swagger-ui .opblock.opblock-get .opblock-summary-method { background: #61affe; }
      .swagger-ui .opblock.opblock-post .opblock-summary-method { background: #49cc90; }
      .swagger-ui .opblock.opblock-put .opblock-summary-method { background: #fca130; }
      .swagger-ui .opblock.opblock-delete .opblock-summary-method { background: #f93e3e; }
      .swagger-ui .opblock.opblock-patch .opblock-summary-method { background: #50e3c2; }
      .swagger-ui .opblock .opblock-summary-path, .swagger-ui .opblock .opblock-summary-description { color: #e8e8e8; }
      .swagger-ui .opblock .opblock-section-header { background: #0f3460; box-shadow: none; }
      .swagger-ui .opblock .opblock-section-header h4 { color: #e8e8e8; }
      .swagger-ui .opblock-body pre { background: #0d1b2a; color: #a0a0b0; }
      .swagger-ui .parameter__name { color: #e8e8e8; }
      .swagger-ui .parameter__type { color: #61affe; }
      .swagger-ui .parameter__in { color: #a0a0b0; }
      .swagger-ui table thead tr th { color: #e8e8e8; border-bottom: 1px solid #0f3460; }
      .swagger-ui table tbody tr td { color: #a0a0b0; border-bottom: 1px solid #0f3460; }
      .swagger-ui .model-box { background: #16213e; }
      .swagger-ui .model { color: #e8e8e8; }
      .swagger-ui .model-title { color: #e8e8e8; }
      .swagger-ui section.models { border: 1px solid #0f3460; }
      .swagger-ui section.models h4 { color: #e8e8e8; }
      .swagger-ui .model-container { background: #16213e; }
      .swagger-ui .prop-type { color: #61affe; }
      .swagger-ui .prop-format { color: #a0a0b0; }
      .swagger-ui .response-col_status { color: #e8e8e8; }
      .swagger-ui .response-col_description { color: #a0a0b0; }
      .swagger-ui .responses-inner h4, .swagger-ui .responses-inner h5 { color: #e8e8e8; }
      .swagger-ui .btn { background: #0f3460; color: #e8e8e8; border: 1px solid #e94560; }
      .swagger-ui .btn:hover { background: #e94560; }
      .swagger-ui .btn.execute { background: #e94560; border: none; }
      .swagger-ui .btn.cancel { background: #0f3460; border: 1px solid #f93e3e; }
      .swagger-ui select { background: #0f3460; color: #e8e8e8; border: 1px solid #0f3460; }
      .swagger-ui input[type=text], .swagger-ui textarea { background: #0d1b2a; color: #e8e8e8; border: 1px solid #0f3460; }
      .swagger-ui .dialog-ux .modal-ux { background: #1a1a2e; border: 1px solid #0f3460; }
      .swagger-ui .dialog-ux .modal-ux-header h3 { color: #e8e8e8; }
      .swagger-ui .dialog-ux .modal-ux-content { color: #a0a0b0; }
      .swagger-ui .auth-wrapper .authorize { border-color: #49cc90; color: #49cc90; }
      .swagger-ui .auth-wrapper .authorize svg { fill: #49cc90; }
      .swagger-ui .authorization__btn { fill: #49cc90; }
      .swagger-ui .scheme-container { background: #16213e; box-shadow: none; }
      .swagger-ui .loading-container .loading:after { color: #e94560; }
      .swagger-ui .response-control-media-type__title { color: #a0a0b0; }
      .swagger-ui .markdown p, .swagger-ui .markdown code { color: #a0a0b0; }
      .swagger-ui .renderedMarkdown p { color: #a0a0b0; }
      .swagger-ui .wrapper { background: transparent; }
      .swagger-ui .servers > label { color: #e8e8e8; }
      .swagger-ui .servers > label select { background: #0f3460; color: #e8e8e8; }
      .swagger-ui .copy-to-clipboard { background: #0f3460; }
      .swagger-ui .copy-to-clipboard button { background: #0f3460; }
    `,
    jsonDocumentUrl: '/api/docs-json',
  });

  // Serve custom JS for token auto-injection
  app.use('/api/docs/swagger-init.js', (req, res) => {
    res.type('application/javascript');
    res.send(`
      window.addEventListener('load', function() {
        setTimeout(function() {
          // Try to get token from various storage locations
          const tokenKeys = [
            'oidc.user:',  // OIDC client storage pattern
            'access_token',
            'token',
            'auth_token',
            'bearer_token'
          ];
          
          let token = null;
          
          // Check localStorage
          for (const key of Object.keys(localStorage)) {
            if (tokenKeys.some(tk => key.includes(tk))) {
              try {
                const value = localStorage.getItem(key);
                const parsed = JSON.parse(value);
                token = parsed.access_token || parsed.token || value;
                if (token && typeof token === 'string' && token.length > 20) break;
              } catch (e) {
                const value = localStorage.getItem(key);
                if (value && typeof value === 'string' && value.length > 20) {
                  token = value;
                  break;
                }
              }
            }
          }
          
          // Check sessionStorage if not found
          if (!token) {
            for (const key of Object.keys(sessionStorage)) {
              if (tokenKeys.some(tk => key.includes(tk))) {
                try {
                  const value = sessionStorage.getItem(key);
                  const parsed = JSON.parse(value);
                  token = parsed.access_token || parsed.token || value;
                  if (token && typeof token === 'string' && token.length > 20) break;
                } catch (e) {
                  const value = sessionStorage.getItem(key);
                  if (value && typeof value === 'string' && value.length > 20) {
                    token = value;
                    break;
                  }
                }
              }
            }
          }
          
          // If token found, authorize Swagger UI
          if (token && window.ui) {
            window.ui.preauthorizeApiKey('bearer', token);
            console.log('Swagger UI: Token auto-configured from storage');
          }
        }, 1000);
      });
    `);
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log('Agent Orchestrator API running on http://localhost:' + port);
  console.log('Swagger documentation available at http://localhost:' + port + '/api/docs');
}

bootstrap();

