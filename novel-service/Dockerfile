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

# Limit JVM memory for cloud/Render free tier (0.1 vCPU / 512MB RAM)
ENV JAVA_OPTS="-Xms96m -Xmx200m -XX:MaxMetaspaceSize=110m -XX:ReservedCodeCacheSize=48m -Xss256k -XX:+UseSerialGC -XX:+ExitOnOutOfMemoryError -Djava.security.egd=file:/dev/./urandom"

ENTRYPOINT ["sh", "-c", "if [ -n \"$DATABASE_URL\" ] && [ -z \"$SPRING_DATASOURCE_URL\" ]; then clean_url=\"${DATABASE_URL#*://}\"; if echo \"$clean_url\" | grep -q \"@\"; then userpass=\"${clean_url%%@*}\"; hostportdb=\"${clean_url#*@}\"; export SPRING_DATASOURCE_URL=\"jdbc:postgresql://${hostportdb}\"; [ -z \"$SPRING_DATASOURCE_USERNAME\" ] && export SPRING_DATASOURCE_USERNAME=\"${userpass%%:*}\"; [ -z \"$SPRING_DATASOURCE_PASSWORD\" ] && export SPRING_DATASOURCE_PASSWORD=\"${userpass#*:}\"; else case \"$DATABASE_URL\" in postgres://*|postgresql://*) export SPRING_DATASOURCE_URL=\"jdbc:postgresql://${clean_url}\" ;; jdbc:postgresql://*) export SPRING_DATASOURCE_URL=\"$DATABASE_URL\" ;; *) echo 'ERROR: Unsupported DATABASE_URL format' >&2; exit 1 ;; esac; fi; fi; exec java $JAVA_OPTS -Dserver.port=${PORT:-8083} -Dspring.profiles.active=${SPRING_PROFILES_ACTIVE:-prod} -jar app.jar"]
