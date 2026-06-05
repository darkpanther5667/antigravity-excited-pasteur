FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
COPY backend/ ./backend/
COPY database/ ./database/
COPY start.sh ./

RUN npm install
RUN cd backend && npm install
RUN npx prisma generate --schema=database/schema.prisma

EXPOSE 3001

ENTRYPOINT []
CMD ["/bin/sh", "start.sh"]
