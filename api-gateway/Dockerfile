# Stage 1: Build stage
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder
WORKDIR /app

COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

COPY --from=builder /app/target/*.jar app.jar

ENV SERVER_PORT=8080
EXPOSE 8080

# Limit JVM memory for cloud/Render free tier (0.1 vCPU / 512MB RAM)
ENV JAVA_OPTS="-Xms96m -Xmx200m -XX:MaxMetaspaceSize=110m -XX:ReservedCodeCacheSize=48m -XX:MaxDirectMemorySize=64m -Xss256k -XX:+UseSerialGC -XX:+ExitOnOutOfMemoryError -Dio.netty.eventLoopThreads=2 -Dreactor.netty.ioWorkerCount=2 -Djava.security.egd=file:/dev/./urandom"
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -Dserver.port=${PORT:-8080} -Dspring.profiles.active=${SPRING_PROFILES_ACTIVE:-prod} -jar app.jar"]
