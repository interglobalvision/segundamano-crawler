# Globie Segundamano Crawler

This is a small crawler that consumes SegundaMano.mx api, fetchs important data and saves it to a DynamoDB instance. Was made only for educational and recreative purposes. We intend to use the gathered data in the future to map hosing prices around CDMX and maybe find trends of gentrification and such.

## Getting Started

You need to use your own AWS keys in the config file
```
cp aws-config.json.example aws-config.json
npm install
node main.js
```
