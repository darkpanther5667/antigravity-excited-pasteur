FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl

# Copy all source
COPY package*.json ./
COPY backend/ ./backend/
COPY database/ ./database/
COPY start.sh ./

# Install root deps (for prisma CLI)
RUN npm install

# Install backend deps
RUN cd backend && npm install

# Generate Prisma client
RUN npx prisma generate --schema=database/schema.prisma

EXPOSE 3001

CMD ["bash", "start.sh"]
