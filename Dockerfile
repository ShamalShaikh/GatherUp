FROM node:18

WORKDIR /app

# Install dependencies and build the app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Expose the port and serve the app
EXPOSE 3000
CMD ["npm", "start"]