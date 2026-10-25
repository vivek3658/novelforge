# Stage 1: Build stage
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder
WORKDIR /app

COPY novelforge-common ./novelforge-common
COPY novelforge-security ./novelforge-security
RUN mvn -f novelforge-common/pom.xml clean install -DskipTests \
    && mvn -f novelforge-security/pom.xml clean install -DskipTests
COPY engagement-service/pom.xml ./engagement-service/pom.xml
COPY engagement-service/src ./engagement-service/src
RUN mvn -f engagement-service/pom.xml clean package -DskipTests

# Stage 2: Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

COPY --from=builder /app/engagement-service/target/*.jar app.jar

ENV SERVER_PORT=8084
EXPOSE 8084

# Limit JVM memory for cloud/Render free tier (512MB RAM)
ENV JAVA_OPTS="-Xmx350m -Xms200m"
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -Dserver.port=${PORT:-8084} -jar app.jar"]
