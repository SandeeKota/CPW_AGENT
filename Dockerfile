FROM node:24-alpine
ARG ENV_TYPE
WORKDIR /apps
COPY ./package*.json /apps
RUN npm install -g next
RUN npm install
COPY . /apps
RUN if [ "$ENV_TYPE" = "prod" ]; then \
    npm run build:prod; \
    elif [ "$ENV_TYPE" = "beta" ]; then \
    npm run build:beta; \
    else \
    npm run build; \
    fi
EXPOSE 3000
CMD [ "npm", "run", "start" ]
