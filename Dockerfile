# 1. Берем официальный образ с Java 17
FROM eclipse-temurin:17-jdk-alpine

# 2. Копируем наш jar-файл внутрь контейнера
COPY build/libs/musicbot-0.0.1-SNAPSHOT.jar app.jar

# 3. Указываем команду для запуска
ENTRYPOINT ["java", "-jar", "/app.jar"]