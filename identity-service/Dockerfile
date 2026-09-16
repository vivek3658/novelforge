# Stage 1: Build stage
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder
WORKDIR /app

# 1. Install shared common library
COPY novelforge-common ./novelforge-common
RUN cd novelforge-common && mvn clean install -DskipTests

# 2. Install shared security library
COPY novelforge-security ./novelforge-security
RUN cd novelforge-security && mvn clean install -DskipTests

# 3. Build identity-service
COPY identity-service/pom.xml ./identity-service/
COPY identity-service/src ./identity-service/src
RUN cd identity-service && mvn clean package -DskipTests

# Stage 2: Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Run as non-root user for security
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

COPY --from=builder /app/identity-service/target/*.jar app.jar

ENV SERVER_PORT=8081
EXPOSE 8081

# Limit JVM memory for cloud/Render free tier (512MB RAM)
ENV JAVA_OPTS="-Xmx350m -Xms200m"

ENTRYPOINT ["sh", "-c", "\
if [ -n \"$DATABASE_URL\" ]; then \
  export SPRING_DATASOURCE_URL=$(echo \"$DATABASE_URL\" | sed -e 's/^postgres:\\/\\//jdbc:postgresql:\\/\\//' -e 's/^postgresql:\\/\\//jdbc:postgresql:\\/\\//'); \
fi; \
if [ -n \"$REDIS_URL\" ]; then \
  export SPRING_DATA_REDIS_URL=\"$REDIS_URL\"; \
fi; \
exec java $JAVA_OPTS -Dserver.port=${PORT:-8081} -jar app.jar"]
