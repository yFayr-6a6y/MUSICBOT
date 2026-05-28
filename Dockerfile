# 1. Сборка проекта
FROM eclipse-temurin:17-jdk-alpine AS build
COPY . .
# Даем права на выполнение скрипта сборки
RUN chmod +x gradlew
RUN ./gradlew clean build

# 2. Финальный запуск
FROM eclipse-temurin:17-jre-alpine
# Копируем любой найденный jar файл из папки build/libs в app.jar
RUN cp /build/libs/*.jar /app.jar
ENTRYPOINT ["java", "-jar", "/app.jar"]