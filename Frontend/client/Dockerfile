FROM node:24.15.0-alpine
WORKDIR /app
COPY package*.json ./
COPY . .
RUN npm install -g @angular/cli
RUN npm install
ENV NG_ALLOWED_HOSTS=localhost,127.0.0.1,172.19.0.2,192.168.1.3,192.168.1.2,192.168.1.7,192.168.1.6,192.168.1.4
CMD ["ng", "serve", "--host", "0.0.0.0"]