'use strict';

const AWS = require("aws-sdk");
const request = require('request-promise');
const CronJob = require('cron').CronJob;
const shortid = require('shortid');

// Configure AWS
AWS.config.loadFromPath('./aws-config.json');

const table = 'segundamano_ads';
const docClient = new AWS.DynamoDB.DocumentClient()


const reqOptions = {
  method: 'GET',
  json: true,
  uri: 'https://webapi.segundamano.mx/nga/api/v1/public/klfst?lang=es&category=1000&company_ad=0&region=11&lim=36',
};

let parseAd = (ads, index) => {

  if(ads[index] !== undefined) {

    let ad = ads[index];
    console.log('Parsing Ad ', index);
    console.log(ad);

    // Get ad ID
    let adId = ad.list_id;

    // Prepare query to check if ad already exists
    let getQuery = {
      TableName: table,
      Key: {
        adId,
      },
    };

    // Send request to DB to check if ad already exists
    docClient.get(getQuery, (err,data) => {
      if(err) {
        console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
      } else {


        // If Ad doesn't exist in the DB yet
        if (JSON.stringify(data) === '{}') {

          let _id = shortid.generate();

          let adData = {
            _id,
            adId: ad.list_id,
            type: ad.type.label,
            category: ad.category.label,
            price: ad.list_price,
          };

          // Get location: region
          if (ad.locations !== undefined) {
            adData[ad.locations[0].key] = ad.locations[0].label;

            // Get location: municipality
            if (ad.locations[0].locations !== undefined) {
              adData[ad.locations[0].locations[0].key] = ad.locations[0].locations[0].label;

              // Get location: area
              if (ad.locations[0].locations[0].locations !== undefined) {
                adData[ad.locations[0].locations[0].locations[0].key] = ad.locations[0].locations[0].locations[0].label;
              }
            }
          }

          if(ad.ad_details !== undefined) {
            // Get estate type
            if(ad.ad_details.estate_type !== undefined) {
              adData['estate_type'] = ad.ad_details.estate_type.single.label;
            }

            // Get rooms
            if(ad.ad_details.rooms !== undefined) {
              adData['rooms'] = ad.ad_details.rooms.single.code;
            }

            // Get size
            if(ad.ad_details.size !== undefined) {
              adData['size'] = ad.ad_details.size.single.code;
            }
          }

          // Prepare query to check if ad already exists
          let putQuery = {
            TableName: table,
            Item: adData,
          };

          docClient.put(putQuery, (err,data) => {
            if (err) {
              console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
            } else {
              console.log("Added item:", JSON.stringify(data, null, 2));

              parseAd(ads, index+1);
            }
          });
        }
      }
    });
  }
};

let crawlRequest = () => {
  request(reqOptions).then(res => {
    console.log('Succesfull request… now let\' get some data');

    let ads = res.list_ads.map( ad => { // Get only the ad details. Cuz each ad comes with something called `labelmap` that we don't need
      return ad.ad;
    });

    parseAd(ads, 0);

  }).catch(err => {
    console.log(err);
  });
};

// Runs every 15 minutes
let crawlJob = new CronJob({
  cronTime: '*/15 * * * *',
  onTick: crawlRequest, 
  onComplete() { // Run when the job stops
    console.log('Job stopped');
  },
  start: true, // Run right now
  timeZone: 'America/Mexico_City',
});
