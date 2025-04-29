FROM node:18

WORKDIR /app

# Install dependencies and build the app
COPY package*.json ./
RUN npm install

COPY . .

ENV NEXT_PUBLIC_API_BASE_URL=https://gatherup-api-16273825216.us-central1.run.app
ENV NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.eyJ1Ijoic2hhbWFsc2hhaWtoIiwiYSI6ImNtOXlwb2gxaTEyMHQyanB5YjVjNnV3Z2UifQ.LU8yhs6w3KbFSTNHyckXXw
RUN npm run build

# Expose the port and serve the app
EXPOSE 3000
CMD ["npm", "start"]