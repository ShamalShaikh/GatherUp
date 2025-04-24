FROM node:18

WORKDIR /app

# Install dependencies and build the app
COPY package*.json ./
RUN npm install

COPY . .

ENV NEXT_PUBLIC_API_BASE_URL=https://gatherup-api-16273825216.us-central1.run.app
RUN npm run build

# Expose the port and serve the app
EXPOSE 3000
CMD ["npm", "start"]