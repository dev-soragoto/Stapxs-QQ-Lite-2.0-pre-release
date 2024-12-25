# ssqq quick start nginx dockerfile
# 请确保项目已经构建完成存在 dist 目录

FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*
COPY dist /usr/share/nginx/html

# 修改nginx配置文件，将端口改为8080，以免影响已有用户的配置
RUN sed -i 's/listen       80;/listen       8080;/' /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
