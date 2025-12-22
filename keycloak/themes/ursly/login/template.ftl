<#macro registrationLayout bodyClass="" displayInfo=false displayMessage=true displayRequiredFields=false>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="robots" content="noindex, nofollow">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    
    <#if properties.meta?has_content>
        <#list properties.meta?split(' ') as meta>
            <meta name="${meta?split('==')[0]}" content="${meta?split('==')[1]}"/>
        </#list>
    </#if>
    
    <title>${msg("loginTitle",(realm.displayName!''))}</title>
    <link rel="icon" href="${url.resourcesPath}/img/favicon.ico" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    
    <#if properties.stylesCommon?has_content>
        <#list properties.stylesCommon?split(' ') as style>
            <link href="${url.resourcesCommonPath}/${style}" rel="stylesheet" />
        </#list>
    </#if>
    <#if properties.styles?has_content>
        <#list properties.styles?split(' ') as style>
            <link href="${url.resourcesPath}/${style}" rel="stylesheet" />
        </#list>
    </#if>
    
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        :root {
            /* Cyberpunk Theme */
            --cyber-bg: #08080c;
            --cyber-bg-subtle: #0a0a0f;
            --cyber-surface: #0e0e14;
            --cyber-surface-elevated: #14141c;
            --cyber-cyan: #00f5ff;
            --cyber-magenta: #ff00ea;
            --cyber-text: #e8e8f0;
            --cyber-text-secondary: #a0a0b0;
            --cyber-text-muted: #6a6a7a;
            --cyber-text-dim: #4a4a5a;
            --cyber-border: rgba(255, 255, 255, 0.08);
            --cyber-success: #00ff88;
            --cyber-error: #ff3366;
            --glow-cyan: rgba(0, 245, 255, 0.3);
            --glow-magenta: rgba(255, 0, 234, 0.3);
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--cyber-bg);
            background-image: 
                radial-gradient(ellipse at 20% 20%, rgba(0, 245, 255, 0.03) 0%, transparent 50%),
                radial-gradient(ellipse at 80% 80%, rgba(255, 0, 234, 0.03) 0%, transparent 50%);
            min-height: 100vh;
            display: flex;
            align-items: flex-start;
            justify-content: center;
            padding: 120px 20px 30px 20px;
            position: relative;
            overflow-x: hidden;
        }
        
        /* Grid overlay */
        body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: 
                linear-gradient(90deg, rgba(0, 245, 255, 0.02) 1px, transparent 1px),
                linear-gradient(rgba(0, 245, 255, 0.02) 1px, transparent 1px);
            background-size: 60px 60px;
            animation: gridPulse 4s ease-in-out infinite;
            pointer-events: none;
            z-index: 0;
        }
        
        /* Scanlines */
        body::after {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                rgba(0, 245, 255, 0.015) 2px,
                rgba(0, 245, 255, 0.015) 4px
            );
            pointer-events: none;
            z-index: 0;
        }
        
        @keyframes gridPulse {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 0.7; }
        }
        
        .login-container {
            width: 100%;
            max-width: 480px;
            position: relative;
            z-index: 1;
        }
        
        .login-card {
            background: rgba(14, 14, 20, 0.95);
            backdrop-filter: blur(20px);
            border: 1px solid var(--cyber-border);
            border-radius: 4px;
            box-shadow: 
                0 25px 50px -12px rgba(0, 0, 0, 0.6),
                0 0 40px rgba(0, 245, 255, 0.05);
            padding: 48px 48px;
            position: relative;
            overflow: hidden;
        }
        
        /* Corner accents */
        .login-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 24px;
            height: 24px;
            border-left: 2px solid var(--cyber-cyan);
            border-top: 2px solid var(--cyber-cyan);
            box-shadow: -2px -2px 8px var(--glow-cyan);
        }
        
        .login-card::after {
            content: '';
            position: absolute;
            bottom: 0;
            right: 0;
            width: 24px;
            height: 24px;
            border-right: 2px solid var(--cyber-magenta);
            border-bottom: 2px solid var(--cyber-magenta);
            box-shadow: 2px 2px 8px var(--glow-magenta);
        }
        
        .logo-container {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 14px;
            margin-bottom: 28px;
        }
        
        .logo-icon {
            width: 48px;
            height: 48px;
            border-radius: 4px;
            background: linear-gradient(135deg, var(--cyber-cyan) 0%, var(--cyber-magenta) 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 
                0 0 20px var(--glow-cyan),
                0 0 40px var(--glow-magenta);
            position: relative;
        }
        
        .logo-icon::before {
            content: '';
            position: absolute;
            inset: 2px;
            background: var(--cyber-bg);
            border-radius: 2px;
        }
        
        .logo-icon svg {
            width: 24px;
            height: 24px;
            position: relative;
            z-index: 1;
        }
        
        .logo-text {
            font-family: 'JetBrains Mono', monospace;
            font-weight: 700;
            font-size: 1.5rem;
            background: linear-gradient(135deg, var(--cyber-cyan) 0%, #fff 50%, var(--cyber-magenta) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            letter-spacing: 0.02em;
            text-transform: uppercase;
        }
        
        .page-title {
            text-align: center;
            color: var(--cyber-text);
            font-family: 'JetBrains Mono', monospace;
            font-weight: 700;
            font-size: 1.1rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 8px;
        }
        
        .page-subtitle {
            text-align: center;
            color: var(--cyber-text-muted);
            font-size: 0.85rem;
            margin-bottom: 28px;
        }
        
        .form-group {
            margin-bottom: 18px;
        }
        
        .form-label {
            display: block;
            color: var(--cyber-cyan);
            font-family: 'JetBrains Mono', monospace;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin-bottom: 8px;
        }
        
        .form-control {
            width: 100%;
            background: var(--cyber-surface);
            border: 1px solid var(--cyber-border);
            border-radius: 2px;
            color: var(--cyber-text);
            padding: 14px 16px;
            font-size: 14px;
            font-family: 'Inter', sans-serif;
            transition: all 0.15s ease;
            outline: none;
        }
        
        .form-control:focus {
            border-color: var(--cyber-cyan);
            box-shadow: 
                0 0 0 1px var(--cyber-cyan),
                0 0 20px var(--glow-cyan),
                inset 0 0 20px rgba(0, 245, 255, 0.05);
            background: var(--cyber-surface-elevated);
        }
        
        .form-control:hover {
            border-color: rgba(0, 245, 255, 0.3);
        }
        
        .form-control::placeholder {
            color: var(--cyber-text-dim);
        }
        
        .password-wrapper {
            position: relative;
        }
        
        .password-wrapper .form-control {
            padding-right: 50px;
        }
        
        .password-toggle {
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: var(--cyber-text-muted);
            cursor: pointer;
            padding: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.15s ease;
        }
        
        .password-toggle:hover {
            color: var(--cyber-cyan);
            filter: drop-shadow(0 0 6px var(--cyber-cyan));
        }
        
        .form-options {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            flex-wrap: wrap;
            gap: 8px;
        }
        
        .checkbox-wrapper {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .checkbox-wrapper input[type="checkbox"] {
            appearance: none;
            -webkit-appearance: none;
            width: 18px;
            height: 18px;
            background: var(--cyber-surface);
            border: 1px solid var(--cyber-border);
            border-radius: 2px;
            cursor: pointer;
            position: relative;
            transition: all 0.15s ease;
        }
        
        .checkbox-wrapper input[type="checkbox"]:checked {
            background: var(--cyber-cyan);
            border-color: var(--cyber-cyan);
            box-shadow: 0 0 10px var(--glow-cyan);
        }
        
        .checkbox-wrapper input[type="checkbox"]:checked::after {
            content: '';
            position: absolute;
            top: 3px;
            left: 6px;
            width: 4px;
            height: 8px;
            border: solid var(--cyber-bg);
            border-width: 0 2px 2px 0;
            transform: rotate(45deg);
        }
        
        .checkbox-wrapper label {
            color: var(--cyber-text-secondary);
            font-size: 13px;
            cursor: pointer;
        }
        
        .forgot-password {
            color: var(--cyber-cyan);
            font-size: 13px;
            text-decoration: none;
            transition: all 0.15s ease;
        }
        
        .forgot-password:hover {
            color: var(--cyber-magenta);
            text-shadow: 0 0 10px var(--glow-magenta);
        }
        
        .btn-primary {
            width: 100%;
            background: linear-gradient(135deg, var(--cyber-cyan) 0%, var(--cyber-magenta) 100%);
            color: var(--cyber-bg);
            border: none;
            border-radius: 2px;
            padding: 16px 24px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            cursor: pointer;
            transition: all 0.15s ease;
            box-shadow: 
                0 0 20px var(--glow-cyan),
                0 0 40px var(--glow-magenta);
            position: relative;
            overflow: hidden;
        }
        
        .btn-primary::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 50%);
            opacity: 0;
            transition: opacity 0.15s ease;
        }
        
        .btn-primary:hover {
            box-shadow: 
                0 0 30px rgba(0, 245, 255, 0.5),
                0 0 60px rgba(255, 0, 234, 0.5);
            transform: translateY(-2px);
        }
        
        .btn-primary:hover::before {
            opacity: 1;
        }
        
        .btn-primary:active {
            transform: translateY(0);
        }
        
        .btn-primary:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }
        
        .btn-secondary {
            width: 100%;
            background: transparent;
            color: var(--cyber-text-secondary);
            border: 1px solid var(--cyber-border);
            border-radius: 2px;
            padding: 14px 24px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            cursor: pointer;
            transition: all 0.15s ease;
            margin-top: 12px;
            position: relative;
        }
        
        .btn-secondary::before {
            content: '';
            position: absolute;
            top: -1px;
            left: -1px;
            width: 8px;
            height: 8px;
            border-left: 1px solid var(--cyber-cyan);
            border-top: 1px solid var(--cyber-cyan);
            opacity: 0;
            transition: opacity 0.15s ease;
        }
        
        .btn-secondary:hover {
            background: rgba(0, 245, 255, 0.05);
            border-color: var(--cyber-cyan);
            color: var(--cyber-cyan);
            box-shadow: 0 0 15px var(--glow-cyan);
        }
        
        .btn-secondary:hover::before {
            opacity: 1;
        }
        
        .instruction {
            text-align: center;
            color: var(--cyber-text-muted);
            font-size: 0.9rem;
            line-height: 1.6;
            padding: 16px;
            background: var(--cyber-surface);
            border-radius: 2px;
            border: 1px solid var(--cyber-border);
        }
        
        .instruction p {
            margin: 0;
        }
        
        .social-providers {
            margin-top: 20px;
        }
        
        .social-divider {
            display: flex;
            align-items: center;
            text-align: center;
            margin-bottom: 16px;
        }
        
        .social-divider::before,
        .social-divider::after {
            content: '';
            flex: 1;
            height: 1px;
            background: linear-gradient(90deg, transparent, var(--cyber-border), transparent);
        }
        
        .social-divider span {
            color: var(--cyber-text-dim);
            font-family: 'JetBrains Mono', monospace;
            font-size: 10px;
            padding: 0 16px;
            text-transform: uppercase;
            letter-spacing: 0.1em;
        }
        
        .social-links {
            list-style: none;
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
            gap: 10px;
        }
        
        .social-links li {
            flex: 1;
            min-width: 120px;
        }
        
        .social-link {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            width: 100%;
            padding: 14px 16px;
            background: var(--cyber-surface);
            border: 1px solid var(--cyber-border);
            border-radius: 2px;
            color: var(--cyber-text);
            font-size: 13px;
            font-weight: 500;
            text-decoration: none;
            transition: all 0.15s ease;
            position: relative;
        }
        
        .social-link::before {
            content: '';
            position: absolute;
            top: -1px;
            left: -1px;
            width: 8px;
            height: 8px;
            border-left: 1px solid var(--cyber-cyan);
            border-top: 1px solid var(--cyber-cyan);
            opacity: 0;
            transition: opacity 0.15s ease;
        }
        
        .social-link:hover {
            background: var(--cyber-surface-elevated);
            border-color: var(--cyber-cyan);
            transform: translateY(-2px);
            box-shadow: 0 0 15px var(--glow-cyan);
        }
        
        .social-link:hover::before {
            opacity: 1;
        }
        
        .social-link svg {
            flex-shrink: 0;
        }
        
        #kc-registration {
            text-align: center;
            margin-top: 24px;
            padding-top: 24px;
            border-top: 1px solid var(--cyber-border);
            color: var(--cyber-text-muted);
            font-size: 0.9rem;
            position: relative;
        }
        
        #kc-registration::before {
            content: '';
            position: absolute;
            top: -1px;
            left: 50%;
            transform: translateX(-50%);
            width: 60px;
            height: 1px;
            background: linear-gradient(90deg, var(--cyber-cyan), var(--cyber-magenta));
        }
        
        #kc-registration a {
            color: var(--cyber-cyan);
            text-decoration: none;
            font-weight: 500;
            margin-left: 4px;
            transition: all 0.15s ease;
        }
        
        #kc-registration a:hover {
            color: var(--cyber-magenta);
            text-shadow: 0 0 10px var(--glow-magenta);
        }
        
        .alert {
            padding: 14px 16px;
            border-radius: 2px;
            margin-bottom: 20px;
            font-size: 13px;
        }
        
        .alert-error, .alert-warning {
            background: rgba(255, 51, 102, 0.1);
            border: 1px solid rgba(255, 51, 102, 0.3);
            color: var(--cyber-error);
            box-shadow: 0 0 15px rgba(255, 51, 102, 0.1);
        }
        
        .alert-success {
            background: rgba(0, 255, 136, 0.1);
            border: 1px solid rgba(0, 255, 136, 0.3);
            color: var(--cyber-success);
            box-shadow: 0 0 15px rgba(0, 255, 136, 0.1);
        }
        
        .alert-info {
            background: rgba(0, 245, 255, 0.1);
            border: 1px solid rgba(0, 245, 255, 0.3);
            color: var(--cyber-cyan);
            box-shadow: 0 0 15px rgba(0, 245, 255, 0.1);
        }
        
        .input-error {
            display: block;
            color: var(--cyber-error);
            font-size: 12px;
            margin-top: 6px;
        }
        
        .copyright {
            text-align: center;
            color: var(--cyber-text-dim);
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            margin-top: 24px;
            letter-spacing: 0.05em;
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .login-card {
            animation: fadeInUp 0.4s ease-out;
        }
        
        .back-link {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            color: var(--cyber-text-muted);
            font-size: 13px;
            text-decoration: none;
            margin-bottom: 20px;
            transition: all 0.15s ease;
        }
        
        .back-link:hover {
            color: var(--cyber-cyan);
        }
        
        .back-link svg {
            transition: transform 0.15s ease;
        }
        
        .back-link:hover svg {
            transform: translateX(-3px);
            filter: drop-shadow(0 0 4px var(--cyber-cyan));
        }
        
        /* Selection */
        ::selection {
            background: var(--glow-cyan);
            color: var(--cyber-text);
        }
        
        @media (max-width: 480px) {
            body {
                padding: 60px 16px 20px 16px;
            }
            
            .login-container {
                max-width: 100%;
            }
            
            .login-card {
                padding: 24px 20px;
                border-radius: 4px;
            }
            
            .logo-container {
                margin-bottom: 24px;
            }
            
            .logo-icon {
                width: 40px;
                height: 40px;
            }
            
            .logo-icon svg {
                width: 20px;
                height: 20px;
            }
            
            .logo-text {
                font-size: 1.25rem;
            }
            
            .page-title {
                font-size: 1rem;
            }
            
            .page-subtitle {
                font-size: 0.8rem;
                margin-bottom: 24px;
            }
            
            .form-group {
                margin-bottom: 16px;
            }
            
            .form-label {
                font-size: 9px;
                margin-bottom: 6px;
            }
            
            .form-control {
                padding: 12px 14px;
                font-size: 16px;
            }
            
            .form-options {
                flex-direction: column;
                align-items: flex-start;
                gap: 12px;
            }
            
            .btn-primary {
                padding: 14px 20px;
                font-size: 11px;
            }
            
            .social-providers {
                margin-top: 20px;
            }
            
            .social-links li {
                flex: 1 1 100%;
            }
            
            .social-link {
                padding: 12px 16px;
                font-size: 13px;
            }
            
            #kc-registration {
                margin-top: 20px;
                padding-top: 20px;
                font-size: 0.85rem;
            }
            
            .copyright {
                font-size: 10px;
                margin-top: 20px;
            }
        }
        
        @media (max-width: 360px) {
            body {
                padding: 40px 12px 16px 12px;
            }
            
            .login-card {
                padding: 20px 16px;
            }
            
            .logo-text {
                font-size: 1.1rem;
            }
            
            .form-control {
                padding: 10px 12px;
            }
        }
        
        @media (min-width: 481px) and (max-width: 768px) {
            .login-container {
                max-width: 420px;
            }
            
            .login-card {
                padding: 36px 32px;
            }
        }
    </style>
</head>

<body>
    <div class="login-container">
        <div class="login-card">
            <#-- Only show back link during IDP broker flows (first-broker-login, post-broker-login, or IDP errors) -->
            <#if (brokerContext?? || (auth?? && auth.attemptedUsername?has_content && social?? && social.providers??)) && url.loginUrl??>
                <a href="${url.loginUrl}" class="back-link">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                    Back to login
                </a>
            </#if>
            <div class="logo-container">
                <div class="logo-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="url(#cyberGradient)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <defs>
                            <linearGradient id="cyberGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stop-color="#00f5ff"/>
                                <stop offset="100%" stop-color="#ff00ea"/>
                            </linearGradient>
                        </defs>
                        <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                        <path d="M2 17l10 5 10-5"></path>
                        <path d="M2 12l10 5 10-5"></path>
                    </svg>
                </div>
                <span class="logo-text">URSLY.IO</span>
            </div>
            
            <h1 class="page-title"><#nested "header"></h1>
            <p class="page-subtitle">Secure Authentication Portal</p>
            
            <#if displayMessage && message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
                <div class="alert alert-${message.type}">
                    ${kcSanitize(message.summary)?no_esc}
                </div>
            </#if>
            
            <#nested "form">
            
            <#nested "socialProviders">
            
            <#if displayInfo>
                <#nested "info">
            </#if>
        </div>
        
        <p class="copyright">// URSLY.IO ${.now?string('yyyy')}</p>
    </div>
</body>
</html>
</#macro>
