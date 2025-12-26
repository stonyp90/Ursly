#!/usr/bin/env node
/**
 * Extract public key from Tauri private key
 * This script reads the private key and extracts the public key for embedding in tauri.conf.json
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const privateKeyPath = path.join(__dirname, '..', '.tauri-keys', 'key');
const privateKeyEnv = process.env.TAURI_SIGNING_PRIVATE_KEY;

if (!fs.existsSync(privateKeyPath) && !privateKeyEnv) {
  console.error('❌ No private key found. Set TAURI_SIGNING_PRIVATE_KEY or create .tauri-keys/key');
  process.exit(1);
}

try {
  // Read private key
  const privateKey = privateKeyEnv || fs.readFileSync(privateKeyPath, 'utf8').trim();
  
  // Use Tauri CLI to extract public key
  // The signer can derive the public key from the private key
  const tempKeyPath = path.join(__dirname, '..', '.tauri-keys', 'temp-key');
  fs.mkdirSync(path.dirname(tempKeyPath), { recursive: true });
  fs.writeFileSync(tempKeyPath, privateKey);
  
  // Use Tauri signer to get public key
  // Note: Tauri signer doesn't have a direct "extract public key" command,
  // but we can use the signer's internal logic
  // For now, we'll use a workaround: generate a new keypair and use that,
  // OR better: read the public key from the private key file if it exists
  
  // Check if .tauri-keys/key.pub exists (created when key was generated)
  const publicKeyPath = path.join(__dirname, '..', '.tauri-keys', 'key.pub');
  
  let publicKey = '';
  
  if (fs.existsSync(publicKeyPath)) {
    publicKey = fs.readFileSync(publicKeyPath, 'utf8').trim();
    console.log('✅ Found existing public key file');
  } else {
    // Try to extract public key from private key using Node.js crypto
    // Tauri uses Ed25519 keys, so we can derive the public key
    try {
      const crypto = require('crypto');
      
      // Read the private key
      const keyContent = privateKey.trim();
      
      // Try to parse as PEM format
      if (keyContent.includes('BEGIN PRIVATE KEY') || keyContent.includes('BEGIN PRIVATE KEY')) {
        // For Ed25519 keys, we can extract the public key
        // Tauri uses Ed25519 which has the public key embedded in the private key
        try {
          // Create a key object from the private key
          const keyObject = crypto.createPrivateKey(keyContent);
          
          // Extract public key
          const publicKeyObject = crypto.createPublicKey(keyObject);
          publicKey = publicKeyObject.export({
            type: 'spki',
            format: 'pem'
          }).toString().replace(/-----BEGIN PUBLIC KEY-----/g, '').replace(/-----END PUBLIC KEY-----/g, '').replace(/\n/g, '').trim();
          
          console.log('✅ Extracted public key from private key using Node.js crypto');
        } catch (cryptoError) {
          // If crypto doesn't work, try using Tauri CLI as fallback
          console.log('⚠️  Node.js crypto extraction failed, trying Tauri CLI...');
          throw cryptoError;
        }
      } else {
        throw new Error('Private key format not recognized');
      }
    } catch (error) {
      // Fallback: Try to use Tauri CLI (though this generates a new keypair)
      console.error('⚠️  Could not extract public key from private key.');
      console.error('⚠️  Error:', error.message);
      console.error('⚠️  IMPORTANT: The public key must be saved when generating keys.');
      console.error('⚠️  Please ensure TAURI_SIGNING_PRIVATE_KEY includes both private and public keys,');
      console.error('⚠️  or generate keys with: npx @tauri-apps/cli signer generate --write-keys');
      console.error('⚠️  and save both keys separately.');
      process.exit(1);
    }
  }
  
  // Output the public key (for CI/CD to capture)
  console.log('\n✅ Public Key:');
  console.log(publicKey);
  
  // Clean up temp file
  if (fs.existsSync(tempKeyPath)) {
    fs.unlinkSync(tempKeyPath);
  }
  
  process.exit(0);
} catch (error) {
  console.error('❌ Error extracting public key:', error.message);
  process.exit(1);
}

