#!/bin/bash
# Test if API returns apply_url

echo "Testing /api/jobs endpoint..."
echo ""

response=$(curl -s http://localhost:3000/api/jobs)

if [ -z "$response" ]; then
  echo "❌ No response from API - is the server running?"
  echo "Run: npm run dev"
  exit 1
fi

echo "✅ API is responding"
echo ""

# Check if jobs array exists
if echo "$response" | grep -q '"jobs"'; then
  echo "✅ Jobs array found"
else
  echo "❌ No jobs array in response"
  exit 1
fi

# Check for apply_url in first job
if echo "$response" | grep -q '"apply_url"'; then
  echo "✅ apply_url field exists in response"
  
  # Extract first apply_url
  first_url=$(echo "$response" | grep -o '"apply_url":"[^"]*"' | head -1 | cut -d'"' -f4)
  
  if [ -n "$first_url" ]; then
    echo "✅ Sample apply_url: $first_url"
  else
    echo "⚠️  apply_url field exists but is empty/null"
  fi
else
  echo "❌ apply_url field NOT found in response"
  echo ""
  echo "This means the API is not returning the apply_url field."
  echo "Check server.ts to ensure apply_url is in the SELECT query."
fi

echo ""
echo "Full response (first 500 chars):"
echo "$response" | head -c 500
echo ""
