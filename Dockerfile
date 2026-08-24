FROM openresty/openresty:1.25.3.1-alpine

# Install tools and lua-resty-http
RUN apk add --no-cache curl tzdata \
    && /usr/local/openresty/bin/opm get ledgetech/lua-resty-http || true

# Create directory structure
RUN mkdir -p /usr/local/openresty/nginx/lua \
    && mkdir -p /usr/local/openresty/nginx/logs

# Copy custom Nginx configuration and Lua scripts
COPY conf/nginx.conf /usr/local/openresty/nginx/conf/nginx.conf
COPY conf/mime.types /usr/local/openresty/nginx/conf/mime.types
COPY lua/ /usr/local/openresty/nginx/lua/

EXPOSE 80

CMD ["/usr/local/openresty/bin/openresty", "-g", "daemon off;"]
