'use strict';

const request = require('request-promise');
const CronJob = require('cron').CronJob;

const reqOptions = {
  method: 'GET',
  json: true,
  uri: 'https://webapi.segundamano.mx/nga/api/v1/public/klfst?lang=es&category=1000&company_ad=0&region=11&lim=36',
};

let crawlRequest = request(reqOptions).then(res => {
  console.log('Succesfull request… now get data');

  let ads = res.list_ads.map( ad => { // Get only the ad details. Cuz each ad comes with something called `labelmap` that we don't need
    return ad.ad;
  });

  for(let i = 0; i < ads.length; i++) {
    let ad = ads[i];

    let adData = {
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

  };

}).catch(err => {
  console.log(err);
});

// Runs every 15 minutes
let crawlJob = new CronJob({
  cronTime: '*/15 * * * *',
  onTick: crawlRequest, 
  onComplete() { // Run when the job stops
    console.log('Finished crawling');
  },
  start: true, // Run right now
  timeZone: 'America/Mexico_City',
});
