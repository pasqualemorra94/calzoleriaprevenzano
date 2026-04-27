FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npx prisma generate
RUN npx vite build
RUN rm -rf node_modules/.cache
ENV NODE_ENV=production
RUN rm -rf .output/public/uploads && mkdir -p /data/uploads && ln -sf /data/uploads .output/public/uploads
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node .output/server/index.mjs"]
