const readline = require("readline");
let Client = require("ssh2-sftp-client");
let sftp = new Client();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const getFromSFTP = () => {
  sftp
    .connect({
      host: "10.1.87.48",
      port: "22",
      username: "alto-settlement",
      password: "4lt0@tmoney.co.id",
    })
    .then(() => {
      console.log("A");
      //   console.log(sftp.list());
      //   return sftp.list("/pathname");
    });
  // .then((data) => {
  //   console.log(data, "the data info");
  // })
  // .catch((err) => {
  //   console.log(err, "catch error");
  // });
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

        getFromSFTP();
      } else {
        console.log("TRY AGAIN!! \n");

        if (isNaN(day)) console.log("HINT: Please input number");
      }
      rl.close();
    }
  );
};

Main();
