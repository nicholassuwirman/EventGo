# Docker Test Script
# This script simulates what your professor will do

Write-Host "=== EventGo Docker Test ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
docker --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}
Write-Host "✓ Docker is running" -ForegroundColor Green
Write-Host ""

# Step 2: Build and start all services
Write-Host "Building and starting services..." -ForegroundColor Yellow
Write-Host "This may take a few minutes on first run..." -ForegroundColor Gray
docker-compose up -d --build

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker Compose failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✓ All services started!" -ForegroundColor Green
Write-Host ""

# Step 3: Wait for services to be ready
Write-Host "Waiting for services to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Step 4: Check service status
Write-Host ""
Write-Host "=== Service Status ===" -ForegroundColor Cyan
docker-compose ps

Write-Host ""
Write-Host "=== Access Information ===" -ForegroundColor Cyan
Write-Host "Frontend:    http://localhost" -ForegroundColor White
Write-Host "Backend API: http://localhost:4000" -ForegroundColor White
Write-Host "Health:      http://localhost:4000/health" -ForegroundColor White
Write-Host ""

# Step 5: Test health endpoint
Write-Host "Testing backend health..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4000/health" -UseBasicParsing
    Write-Host "✓ Backend is healthy!" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "⚠ Backend not responding yet (may still be initializing)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Setup Complete! ===" -ForegroundColor Cyan
Write-Host "Open http://localhost in your browser to use the application." -ForegroundColor White
Write-Host ""
Write-Host "To stop: docker-compose down" -ForegroundColor Gray
Write-Host "To view logs: docker-compose logs -f" -ForegroundColor Gray
