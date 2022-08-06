const fs = require('fs');
const request = require('request');
const axios = require("axios");


module.exports = function (api) {
  return {
    name: ['memegenerator'],
    admin: false,
    description: '😏',
    function: async function (messageObj, query) {

      const [topText, bottomText] = query.split(',')
      const savePrefix = Date.now()
      
      if(query === 'upload'){
        const options = {
          method: 'POST',
          url: 'https://ronreiter-meme-generator.p.rapidapi.com/images',
          headers: {
            'content-type': 'multipart/form-data; boundary=---011000010111000001101001',
          'X-RapidAPI-Key': 'fd46def047msh0a93e8a87537b61p1713e3jsn91e6e16f47c6',
          'X-RapidAPI-Host': 'ronreiter-meme-generator.p.rapidapi.com',
          useQueryString: true
        },
        formData: {
          image: {
            value: fs.createReadStream('./images/bonk.jpeg'),
            options: {
              filename: 'bonk.jpeg',
              contentType: 'application/octet-stream'
            }
          }
        }
      };
      request(options, function (error, response, body) {
        if (error) throw new Error(error);
        
        console.log(body);
      });
    }

    const options = {
      method: 'GET',
      url: 'https://ronreiter-meme-generator.p.rapidapi.com/meme',
      params: {
        top: decodeURIComponent(escape(topText.trim())),
        bottom: decodeURIComponent(escape(bottomText.trim())),
        meme: 'Condescending-Wonka',
        font_size: '50',
        font: 'Impact'
      },
      headers: {
        'X-RapidAPI-Key': 'fd46def047msh0a93e8a87537b61p1713e3jsn91e6e16f47c6',
        'X-RapidAPI-Host': 'ronreiter-meme-generator.p.rapidapi.com',
      },
      responseType: 'stream',
    };

      await axios.request(options).then(function (response) {
        const w = response.data.pipe(fs.createWriteStream(`./generated_memes/${savePrefix}-doodle.jfif`));
        w.on('finish', () => {
          console.log('Successfully downloaded file!');
        });
      }).catch(function (error) {
        console.error(error);
      });

      return { 
        type: 'image',
        path: `./generated_memes/${savePrefix}-doodle.jfif`
      }
    }
  }
}
