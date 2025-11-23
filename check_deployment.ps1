#!/usr/bin/env pwsh
# Render Deployment Verification Script
# Run this to check when Render deployment completes

Write-Host "🔍 Checking Render deployment status..." -ForegroundColor Cyan
Write-Host ""

$maxAttempts = 20
$attempt = 0
$deployed = $false

while ($attempt -lt $maxAttempts -and -not $deployed) {
    $attempt++
    Write-Host "[$attempt/$maxAttempts] Testing /election endpoint..." -NoNewline
    
    try {
        $response = Invoke-WebRequest -Uri "https://univote-backend.onrender.com/election" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            Write-Host " ✅ SUCCESS!" -ForegroundColor Green
            Write-Host ""
            Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
            Write-Host "Backend is now serving election data correctly." -ForegroundColor Green
            Write-Host ""
            Write-Host "✅ Next steps:" -ForegroundColor Cyan
            Write-Host "   1. Visit https://soy56.github.io/UniVote/"
            Write-Host "   2. The 'Unable to sync data' error should be gone"
            Write-Host "   3. Election data should load successfully"
            $deployed = $true
        }
    }
    catch {
        if ($_.Exception.Response.StatusCode -eq 404) {
            Write-Host " ❌ Still 404" -ForegroundColor Yellow
        } else {
            Write-Host " ⏳ Server warming up..." -ForegroundColor Yellow
        }
        
        if ($attempt -lt $maxAttempts) {
            Write-Host "   Waiting 30 seconds before retry..."
            Start-Sleep -Seconds 30
        }
    }
}

if (-not $deployed) {
    Write-Host ""
    Write-Host "⚠️  Deployment hasn't completed after $($maxAttempts * 30 / 60) minutes" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Manual check required:" -ForegroundColor Cyan
    Write-Host "1. Go to https://dashboard.render.com/"
    Write-Host "2. Check your univote-backend service"
    Write-Host "3. Look for active deployment or errors in logs"
    Write-Host "4. If no deployment running, click 'Manual Deploy'"
}

Write-Host ""
Write-Host "To test manually, run:"
Write-Host "  curl https://univote-backend.onrender.com/election"
