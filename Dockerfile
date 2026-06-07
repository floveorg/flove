FROM nginx:stable-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN mkdir -p /usr/share/nginx/html

COPY apps/ /usr/share/nginx/html/
RUN mv /usr/share/nginx/html/index.html /usr/share/nginx/html/apps.html

COPY docs/ /usr/share/nginx/html/docs/

COPY index.html /usr/share/nginx/html/index.html
COPY bubbles.html /usr/share/nginx/html/bubbles.html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
