#!/bin/bash
# Deploy static website to S3 and invalidate CloudFront cache

set -e

# Configuration
BUCKET_NAME="ursly-io-website"
DISTRIBUTION_ID="${CLOUDFRONT_DISTRIBUTION_ID:-}"
WEBSITE_DIR="$(dirname "$0")/../usrly"

echo "=== Deploying ursly.io website to S3 ==="

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "Error: AWS CLI is not installed"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "Error: AWS credentials not configured"
    exit 1
fi

echo "Uploading files to S3..."

# Sync HTML files with specific cache headers
aws s3 cp "$WEBSITE_DIR/index.html" "s3://$BUCKET_NAME/index.html" \
    --content-type "text/html" \
    --cache-control "max-age=300, must-revalidate" \
    --metadata-directive REPLACE

# Sync CSS files
aws s3 cp "$WEBSITE_DIR/styles.css" "s3://$BUCKET_NAME/styles.css" \
    --content-type "text/css" \
    --cache-control "max-age=31536000, immutable" \
    --metadata-directive REPLACE

echo "Files uploaded successfully!"

# Invalidate CloudFront cache if distribution ID is provided
if [ -n "$DISTRIBUTION_ID" ]; then
    echo "Invalidating CloudFront cache..."
    aws cloudfront create-invalidation \
        --distribution-id "$DISTRIBUTION_ID" \
        --paths "/*" \
        --output text
    echo "Cache invalidation initiated!"
else
    echo "Note: Set CLOUDFRONT_DISTRIBUTION_ID to invalidate cache"
fi

echo ""
echo "=== Deployment Complete ==="
echo "Website URL: https://ursly.io"
echo ""


