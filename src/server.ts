import app from './app';
import config from './config';

async function main() {
  try {
    app.listen(config.port, () => {
      console.log(`Medi Store app listening on port ${config.port}`);
    });
  } catch (err) {
    console.log(err);
  }
}

main();
