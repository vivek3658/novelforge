@echo off
REM =============================================================
REM NovelForge Microservices Build Script for Windows
REM =============================================================

echo [1/11] Installing shared common library (novelforge-common)...
cd novelforge-common
call mvnw.cmd clean install -DskipTests
if %errorlevel% neq 0 exit /b %errorlevel%
cd ..

echo [2/11] Installing shared security library (novelforge-security)...
cd novelforge-security
call mvnw.cmd clean install -DskipTests
if %errorlevel% neq 0 exit /b %errorlevel%
cd ..

echo [3/11] Packaging eureka-server...
cd eureka-server
call mvnw.cmd clean package -DskipTests
if %errorlevel% neq 0 exit /b %errorlevel%
cd ..

echo [4/11] Packaging api-gateway...
cd api-gateway
call mvnw.cmd clean package -DskipTests
if %errorlevel% neq 0 exit /b %errorlevel%
cd ..

echo [5/11] Packaging identity-service...
cd identity-service
call mvnw.cmd clean package -DskipTests
if %errorlevel% neq 0 exit /b %errorlevel%
cd ..

echo [6/11] Packaging notification-service...
cd notification-service
call mvnw.cmd clean package -DskipTests
if %errorlevel% neq 0 exit /b %errorlevel%
cd ..

echo [7/11] Packaging novel-service...
cd novel-service
call mvnw.cmd clean package -DskipTests
if %errorlevel% neq 0 exit /b %errorlevel%
cd ..

echo [8/11] Packaging engagement-service...
cd engagement-service
call mvnw.cmd clean package -DskipTests
if %errorlevel% neq 0 exit /b %errorlevel%
cd ..

echo [9/11] Packaging ai-service...
cd ai-service
call mvnw.cmd clean package -DskipTests
if %errorlevel% neq 0 exit /b %errorlevel%
cd ..

echo [10/11] Packaging analytics-service...
cd analytics-service
call mvnw.cmd clean package -DskipTests
if %errorlevel% neq 0 exit /b %errorlevel%
cd ..

echo [11/11] Building frontend client (novelforge-client)...
cd novelforge-client
call npm run build
if %errorlevel% neq 0 exit /b %errorlevel%
cd ..

echo.
echo =============================================================
echo All NovelForge microservices built successfully!
echo You can now run: docker compose up -d --build
echo =============================================================
