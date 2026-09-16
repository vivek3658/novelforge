# =========================
# Stage 1: Build
# =========================
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder

WORKDIR /app

# Install common library
COPY novelforge-common ./novelforge-common
RUN cd novelforge-common && mvn clean install -DskipTests

# Install security library
COPY novelforge-security ./novelforge-security
RUN cd novelforge-security && mvn clean install -DskipTests

# Build identity service
COPY identity-service/pom.xml ./identity-service/
COPY identity-service/src ./identity-service/src

RUN cd identity-service && mvn clean package -DskipTests


# =========================
# Stage 2: Runtime
# =========================
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

RUN addgroup -S spring && adduser -S spring -G spring

COPY --from=builder /app/identity-service/target/*.jar app.jar

USER spring:spring

EXPOSE 8081

ENV JAVA_OPTS="-Xmx300m -Xms128m -XX:+UseG1GC -XX:+ExitOnOutOfMemoryError"

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]