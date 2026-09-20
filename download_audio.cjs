const https = require('https');
const fs = require('fs');
const path = require('path');

const files = {
  'lofi.mp3': 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
  'rain.mp3': 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_8bbbc3cbce.mp3',
  'coffee.mp3': 'https://cdn.pixabay.com/download/audio/2022/11/02/audio_73bb6c79a9.mp3',
  'fireplace.mp3': 'https://cdn.pixabay.com/download/audio/2022/02/07/audio_678248c823.mp3',
  'ocean.mp3': 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_03d9876a4f.mp3',
  'wind.mp3': 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_75f3e9c683.mp3',
  'keyboard.mp3': 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_243085523a.mp3'
};

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
         return download(response.headers.location, dest).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
};

async function run() {
  const targetDir = path.join(__dirname, 'public', 'audio');
  for (const [filename, url] of Object.entries(files)) {
    const dest = path.join(targetDir, filename);
    console.log(`Downloading ${filename}...`);
    try {
      await download(url, dest);
      console.log(`Saved ${filename}`);
    } catch (e) {
      console.error(`Error downloading ${filename}: ${e.message}`);
    }
  }
}

run();
