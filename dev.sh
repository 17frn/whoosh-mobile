#!/bin/bash

# Development environment loader
# Usage: source dev.sh
# atau: bash dev.sh

set -a

# Load .env.local
if [ -f .env.local ]; then
    echo "📂 Loading .env.local..."
    # Parse .env.local and export variables
    while IFS='=' read -r key value; do
        # Skip comments and empty lines
        [[ "$key" =~ ^#.*$ ]] && continue
        [[ -z "$key" ]] && continue
        
        # Remove surrounding whitespace
        key=$(echo "$key" | xargs)
        value=$(echo "$value" | xargs)
        
        # Expand $HOME variable
        value="${value/\$HOME/$HOME}"
        
        echo "  ✅ $key=$value"
        export "$key=$value"
    done < .env.local
else
    echo "❌ .env.local not found!"
    echo "Please create .env.local with ANDROID_HOME path"
    exit 1
fi

set +a

echo ""
echo "✅ Environment loaded!"
echo ""
echo "Verify:"
echo "  ANDROID_HOME=$ANDROID_HOME"
echo "  PATH=$PATH" | grep -o "[^:]*platform-tools[^:]*"
echo ""
echo "Ready to run:"
echo "  npm run dev"
echo "  npx cap run android -l"
echo ""
