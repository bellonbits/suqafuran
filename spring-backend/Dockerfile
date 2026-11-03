# ==============================================================================
# Suqafuran Spring Boot Business Service (Multi-stage Build)
# Enforces JVM heap boundaries (-Xms256m -Xmx512m) to prevent droplet OOM
# ==============================================================================

# Stage 1: Build & Package
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /build

COPY gradlew settings.gradle build.gradle ./
COPY gradle/ gradle/
RUN chmod +x gradlew && ./gradlew --no-daemon dependencies

COPY src/ src/
RUN ./gradlew --no-daemon bootJar -x test

# Stage 2: Minimal Production JRE Runtime
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

RUN addgroup -S suqafuran && adduser -S suqafuran -G suqafuran

COPY --from=builder /build/build/libs/*.jar /app/app.jar
RUN chown -R suqafuran:suqafuran /app && chmod 755 /app && chmod 644 /app/app.jar

USER suqafuran

EXPOSE 8080

ENV JAVA_OPTS="-XX:+UseG1GC -XX:MaxRAMPercentage=75.0 -Xms256m -Xmx512m -Djava.security.egd=file:/dev/./urandom"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]

