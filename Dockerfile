# Stage 1: Build the application
FROM node:21-alpine AS builder

# Create app directory
RUN mkdir -p /app
WORKDIR /app
# Install app dependencies by copying
# package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Bundle app source
COPY . .

# set arguments and env variables
# ARG GOOGLE_ID
# ARG GOOGLE_SECRET
# ARG SECRET
# ARG MONGO_URL

# ENV GOOGLE_ID=${GOOGLE_ID}
# ENV GOOGLE_SECRET=${GOOGLE_SECRET}
# ENV SECRET=${SECRET}
# ENV MONGO_URL=${MONGO_URL}

RUN npm run build
RUN npm prune --production

# Stage 2: Serve the app with Nginx
FROM nginxinc/nginx-unprivileged:alpine3.18-slim-test

WORKDIR /app
COPY package.json .

# Copy the build output to replace the default nginx contents.
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy the custom nginx configuration file
COPY custom_nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 to the Docker host, so we can access it
# from the outside.
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
