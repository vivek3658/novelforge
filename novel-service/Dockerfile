# Stage 1: Build stage
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder
WORKDIR /app

# 1. Install shared common library
COPY novelforge-common ./novelforge-common
RUN cd novelforge-common && mvn clean install -DskipTests

# 2. Install shared security library
COPY novelforge-security ./novelforge-security
RUN cd novelforge-security && mvn clean install -DskipTests

# 3. Build novel-service
COPY novel-service/pom.xml ./novel-service/
COPY novel-service/src ./novel-service/src
RUN cd novel-service && mvn clean package -DskipTests

# Stage 2: Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Run as non-root user for security
RUN addgroup -S spring && adduser -S spring -G spring

COPY --from=builder /app/novel-service/target/*.jar app.jar

USER spring:spring

EXPOSE 8083

ENV JAVA_OPTS="-Xmx300m -Xms128m -XX:+UseG1GC -XX:+ExitOnOutOfMemoryError"

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
