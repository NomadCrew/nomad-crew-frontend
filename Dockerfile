FROM node:17-alpine AS builder
RUN mkdir -p /app
WORKDIR /app
COPY package*.json /app
RUN npm ci
COPY . .

ARG GOOGLE_ID
ARG GOOGLE_SECRET
ARG SECRET
ARG MONGO_URL

ENV GOOGLE_ID=${GOOGLE_ID}
ENV GOOGLE_SECRET=${GOOGLE_SECRET}
ENV SECRET=${SECRET}
ENV MONGO_URL=${MONGO_URL}

RUN npx prisma generate
RUN npm run build
RUN npm prune --production

FROM node:17-alpine

RUN adduser -D nodeuser
RUN mkdir -p /app
RUN chown nodeuser:nodeuser /app
USER nodeuser
WORKDIR /app
COPY --from=builder --chown=nodeuser:nodeuser /app/build build/
COPY --from=builder --chown=nodeuser:nodeuser /app/node_modules node_modules/
COPY package.json .

EXPOSE 8001
CMD [ "node", "build" ]