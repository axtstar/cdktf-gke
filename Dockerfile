FROM hashicorp/terraform

WORKDIR /app

RUN apk add --no-cache bash
RUN apk add nodejs npm
RUN apk add curl

COPY . /app/

RUN npm install --global cdktf-cli@latest

