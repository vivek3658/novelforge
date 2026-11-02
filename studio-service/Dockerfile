# Build from the repository root:
# docker build -f studio-service/Dockerfile .

FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder

WORKDIR /workspace

COPY novelforge-common/pom.xml novelforge-common/pom.xml
COPY novelforge-common/src novelforge-common/src

COPY novelforge-security/pom.xml novelforge-security/pom.xml
COPY novelforge-security/src novelforge-security/src

COPY studio-service/pom.xml studio-service/pom.xml
COPY studio-service/src studio-service/src

RUN mvn -f novelforge-common/pom.xml clean install -DskipTests \
    && mvn -f novelforge-security/pom.xml clean install -DskipTests \
    && mvn -f studio-service/pom.xml clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

RUN addgroup -S spring && adduser -S spring -G spring

COPY --from=builder /workspace/studio-service/target/*.jar /app/app.jar

USER spring:spring

EXPOSE 8087

# Limit JVM memory for cloud/Render free tier (0.1 vCPU / 512MB RAM)
ENV JAVA_OPTS="-Xms96m -Xmx200m -XX:MaxMetaspaceSize=110m -XX:ReservedCodeCacheSize=48m -Xss256k -XX:+UseSerialGC -XX:+ExitOnOutOfMemoryError -Djava.security.egd=file:/dev/./urandom"

ENTRYPOINT ["sh", "-c", "if [ -n \"$DATABASE_URL\" ] && [ -z \"$SPRING_DATASOURCE_URL\" ]; then clean_url=\"${DATABASE_URL#*://}\"; if echo \"$clean_url\" | grep -q \"@\"; then userpass=\"${clean_url%%@*}\"; hostportdb=\"${clean_url#*@}\"; export SPRING_DATASOURCE_URL=\"jdbc:postgresql://${hostportdb}\"; [ -z \"$SPRING_DATASOURCE_USERNAME\" ] && export SPRING_DATASOURCE_USERNAME=\"${userpass%%:*}\"; [ -z \"$SPRING_DATASOURCE_PASSWORD\" ] && export SPRING_DATASOURCE_PASSWORD=\"${userpass#*:}\"; else case \"$DATABASE_URL\" in postgres://*|postgresql://*) export SPRING_DATASOURCE_URL=\"jdbc:postgresql://${clean_url}\" ;; jdbc:postgresql://*) export SPRING_DATASOURCE_URL=\"$DATABASE_URL\" ;; *) echo 'ERROR: Unsupported DATABASE_URL format' >&2; exit 1 ;; esac; fi; fi; exec java $JAVA_OPTS -Dserver.port=${PORT:-8087} -Dspring.profiles.active=${SPRING_PROFILES_ACTIVE:-prod} -jar /app/app.jar"]
