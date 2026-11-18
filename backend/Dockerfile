FROM mysql:8.4

ENV MYSQL_ROOT_PASSWORD=root \
    MYSQL_DATABASE=logistics \
    MYSQL_USER=user \
    MYSQL_PASSWORD=password

EXPOSE 3306

HEALTHCHECK --interval=10s --timeout=5s --start-period=40s --retries=12 \
    CMD mysqladmin ping -h 127.0.0.1 -uuser -ppassword --silent || exit 1
