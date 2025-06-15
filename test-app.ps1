# Check backend status
Write-Host "Testing backend health..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/api/health" -Method GET
    if ($response.StatusCode -eq 200) {
        Write-Host "Backend is running and healthy" -ForegroundColor Green
    } else {
        Write-Host "Backend responded but may have issues (Status: $($response.StatusCode))" -ForegroundColor Red
    }
} catch {
    Write-Host "Backend is not running or has issues: $_" -ForegroundColor Red
}

# Check frontend dev server
Write-Host "`nTesting frontend dev server..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET
    if ($response.StatusCode -eq 200) {
        Write-Host "Frontend dev server is running" -ForegroundColor Green
    } else {
        Write-Host "Frontend responded but may have issues (Status: $($response.StatusCode))" -ForegroundColor Red
    }
} catch {
    Write-Host "Frontend dev server is not running or has issues: $_" -ForegroundColor Red
}

# Test auth endpoints
Write-Host "`nTesting auth endpoints..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/health" -Method GET
    if ($response.StatusCode -eq 200) {
        Write-Host "Auth endpoints are accessible" -ForegroundColor Green
    } else {
        Write-Host "Auth endpoints responded but may have issues (Status: $($response.StatusCode))" -ForegroundColor Red
    }
} catch {
    Write-Host "Auth endpoints are not accessible: $_" -ForegroundColor Red
}
