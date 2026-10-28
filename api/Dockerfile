FROM php:8.3-apache

RUN docker-php-ext-install pdo_mysql \
    && a2enmod headers

# Send every request that isn't a real file to index.php (clean URLs like /api/records)
COPY apache.conf /etc/apache2/conf-available/api.conf
RUN a2enconf api

COPY . /var/www/html/

# Don't show PHP errors to visitors; they go to the container log instead
RUN { echo "display_errors=Off"; echo "log_errors=On"; } > /usr/local/etc/php/conf.d/prod.ini

EXPOSE 80
