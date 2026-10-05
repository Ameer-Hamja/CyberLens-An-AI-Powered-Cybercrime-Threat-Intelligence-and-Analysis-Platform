FROM eclipse-temurin:25-jdk-alpine AS build
WORKDIR /app
RUN apk add --no-cache maven
COPY backend/pom.xml .
COPY backend/src ./src
RUN --mount=type=cache,target=/root/.m2 mvn -U clean package -DskipTests -q

FROM eclipse-temurin:25-jre-alpine
RUN apk add --no-cache curl
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
RUN addgroup -S crimelens && adduser -S crimelens -G crimelens
USER crimelens
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Djava.security.egd=file:/dev/./urandom -jar app.jar"]
