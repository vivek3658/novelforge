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

# Limit JVM memory for cloud/Render free tier (0.1 vCPU / 512MB RAM)
ENV JAVA_OPTS="-Xms96m -Xmx200m -XX:MaxMetaspaceSize=110m -XX:ReservedCodeCacheSize=48m -Xss256k -XX:+UseSerialGC -XX:+ExitOnOutOfMemoryError -Djava.security.egd=file:/dev/./urandom"

ENTRYPOINT ["sh", "-c", "if [ -n \"$DATABASE_URL\" ] && [ -z \"$SPRING_DATASOURCE_URL\" ]; then clean_url=\"${DATABASE_URL#*://}\"; if echo \"$clean_url\" | grep -q \"@\"; then userpass=\"${clean_url%%@*}\"; hostportdb=\"${clean_url#*@}\"; export SPRING_DATASOURCE_URL=\"jdbc:postgresql://${hostportdb}\"; [ -z \"$SPRING_DATASOURCE_USERNAME\" ] && export SPRING_DATASOURCE_USERNAME=\"${userpass%%:*}\"; [ -z \"$SPRING_DATASOURCE_PASSWORD\" ] && export SPRING_DATASOURCE_PASSWORD=\"${userpass#*:}\"; else case \"$DATABASE_URL\" in postgres://*|postgresql://*) export SPRING_DATASOURCE_URL=\"jdbc:postgresql://${clean_url}\" ;; jdbc:postgresql://*) export SPRING_DATASOURCE_URL=\"$DATABASE_URL\" ;; *) echo 'ERROR: Unsupported DATABASE_URL format' >&2; exit 1 ;; esac; fi; fi; exec java $JAVA_OPTS -Dserver.port=${PORT:-8084} -Dspring.profiles.active=${SPRING_PROFILES_ACTIVE:-prod} -jar app.jar"]
