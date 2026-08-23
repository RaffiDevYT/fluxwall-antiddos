FROM openresty/openresty:1.25.3.1-alpine

# Install tools
RUN apk add --no-cache curl tzdata

# Create directory structure
RUN mkdir -p /usr/local/openresty/nginx/lua \
    && mkdir -p /usr/local/openresty/nginx/admin \
    && mkdir -p /usr/local/openresty/nginx/logs

# Copy custom Nginx configuration, Lua scripts, and Admin UI
COPY conf/nginx.conf /usr/local/openresty/nginx/conf/nginx.conf
COPY conf/mime.types /usr/local/openresty/nginx/conf/mime.types
COPY lua/ /usr/local/openresty/nginx/lua/
COPY admin/ /usr/local/openresty/nginx/admin/

EXPOSE 80

CMD ["/usr/local/openresty/bin/openresty", "-g", "daemon off;"]
