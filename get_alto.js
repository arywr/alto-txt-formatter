const readline = require("readline");
let Client = require("ssh2-sftp-client");
const moment = require("moment");
const fs = require("fs");

let sftp = new Client();

const REMOTE_PATH = "/home/ftp/alto-settlement";
const LOCAL_PATH = "upload";
const FILENAME = "TELKOM-ALTO_Transfer-Acquirer-Transaction.rpt";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const getFromSFTP = (day) => {
  sftp
    .connect({
      host: "10.1.87.48",
      port: "22",
      username: "alto-settlement",
      password: "4lt0@tmoney.co.id",
      privateKey: fs.readFileSync("/Users/aryawahyu/.ssh/id_rsa"),
      readyTimeout: 20000, // integer How long (in ms) to wait for the SSH handshake
      retries: 2, // integer. Number of times to retry connecting
      retry_factor: 2, // integer. Time factor used to calculate time between retries
      retry_minTimeout: 2000, // integer. Minimum timeout between attempts
    })
    .then(() => {
      console.log("Connected to SFTP Server...");

      return sftp.list("/home/ftp/alto-settlement");
    })
    .then(async () => {
      for (let i = day; i >= 1; i--) {
        const folder_today = moment().subtract(i, "days").format("YYYY-MM-DD");
        const folder = `${REMOTE_PATH}/${folder_today}`;

        const file_today = moment().subtract(i, "days").format("YY-MM-DD");
        const file = `${folder}/${file_today}_${FILENAME}`;

        const localfile = `${LOCAL_PATH}/${file_today}_${FILENAME}`;

        await sftp.fastGet(file, localfile);

        console.log(`Sukses Download Data: ${file}`);
      }

      await sftp.end();
      console.log("\n");
      console.log("Closing Connections...");
    })
    .catch((err) => {
      console.log(err, "catch error");
    });
};

const Main = () => {
  console.log("\n");
  console.log("===================================");
  console.log("\n");
  console.log("      Download ALTO from SFTP");
  console.log("\n");
  console.log("===================================");
  console.log("\n");

  rl.question(
    "H- berapa transaksi yang mau didownload: ",
    async function (day) {
      console.log("\n");
      if (!isNaN(day)) {
        console.log("Donwload Data from SFTP...");

        getFromSFTP(day);
      } else {
        console.log("TRY AGAIN!! \n");

        if (isNaN(day)) console.log("HINT: Please input number");
      }
      rl.close();
    }
  );
};

Main();
