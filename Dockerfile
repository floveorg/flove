FROM nginx:stable-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY apps/ /usr/share/nginx/html/
COPY docs/ /usr/share/nginx/html/docs/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
