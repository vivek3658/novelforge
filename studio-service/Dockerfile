# Build from the repository root: docker build -f studio-service/Dockerfile .
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
ENV JAVA_OPTS="-Xmx350m -Xms200m -XX:+UseG1GC -XX:+ExitOnOutOfMemoryError"
ENTRYPOINT ["sh", "-c", "if [ -n \"$DATABASE_URL\" ]; then export SPRING_DATASOURCE_URL=\"jdbc:${DATABASE_URL#*://}\"; fi; exec java $JAVA_OPTS -Dserver.port=${PORT:-8087} -jar /app/app.jar"]
