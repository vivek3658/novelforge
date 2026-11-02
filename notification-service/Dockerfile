# Stage 1: Build stage
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder
WORKDIR /app

COPY novelforge-common ./novelforge-common
RUN cd novelforge-common && mvn clean install -DskipTests

COPY notification-service/pom.xml ./notification-service/
COPY notification-service/src ./notification-service/src
RUN cd notification-service && mvn clean package -DskipTests

# Stage 2: Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

COPY --from=builder /app/notification-service/target/*.jar app.jar

ENV SERVER_PORT=8082
EXPOSE 8082

# Limit JVM memory for cloud/Render free tier (0.1 vCPU / 512MB RAM)
ENV JAVA_OPTS="-Xms64m -Xmx160m -XX:MaxMetaspaceSize=96m -XX:ReservedCodeCacheSize=32m -Xss256k -XX:+UseSerialGC -XX:+ExitOnOutOfMemoryError -Djava.security.egd=file:/dev/./urandom"
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -Dserver.port=${PORT:-8082} -Dspring.profiles.active=${SPRING_PROFILES_ACTIVE:-prod} -jar app.jar"]
