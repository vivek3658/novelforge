#!/usr/bin/env bash
set -e

# =============================================================
# NovelForge Microservices Build Script for Linux / macOS
# =============================================================

echo "[1/11] Installing shared common library (novelforge-common)..."
(cd novelforge-common && ./mvnw clean install -DskipTests)

echo "[2/11] Installing shared security library (novelforge-security)..."
(cd novelforge-security && ./mvnw clean install -DskipTests)

echo "[3/11] Packaging eureka-server..."
(cd eureka-server && ./mvnw clean package -DskipTests)

echo "[4/11] Packaging api-gateway..."
(cd api-gateway && ./mvnw clean package -DskipTests)

echo "[5/11] Packaging identity-service..."
(cd identity-service && ./mvnw clean package -DskipTests)

echo "[6/11] Packaging notification-service..."
(cd notification-service && ./mvnw clean package -DskipTests)

echo "[7/11] Packaging novel-service..."
(cd novel-service && ./mvnw clean package -DskipTests)

echo "[8/11] Packaging engagement-service..."
(cd engagement-service && ./mvnw clean package -DskipTests)

echo "[9/11] Packaging ai-service..."
(cd ai-service && ./mvnw clean package -DskipTests)

echo "[10/11] Packaging analytics-service..."
(cd analytics-service && ./mvnw clean package -DskipTests)

echo "[11/11] Building frontend client (novelforge-client)..."
(cd novelforge-client && npm run build)

echo ""
echo "============================================================="
echo "All NovelForge microservices built successfully!"
echo "You can now run: docker compose up -d --build"
echo "============================================================="
