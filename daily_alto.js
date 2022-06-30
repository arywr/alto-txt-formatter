const fs = require("fs");
const readline = require("readline");
const json2xls = require("p3x-json2xls-worker-thread");
const moment = require("moment");
const nodemailer = require("nodemailer");

var mailOptions = {
  from: "arya.wahyu502@gmail.com",
  to: "arya.wahyu502@gmail.com",
  cc: "destinurfitria24@gmail.com",
};

let DEFAULT_DAY_READ = 1;
let transactions = [];
let transporter = null;

const DIR_PATHNAME = "download/";
const DIR_SOURCENAME = "upload/";

const DOWNLOAD_FILENAME = `${DIR_PATHNAME}${moment()
  .subtract(1, "days")
  .format("YYMMDD")}-ALTO_FORMATTED.xlsx`;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const processLineByLine = async (day) => {
  const TODAY_DATE = moment().subtract(day, "days").format("YY-MM-DD");

  const UPLOAD_FILENAME = `${TODAY_DATE}_TELKOM-ALTO_Transfer-Acquirer-Transaction.rpt`;
  const SOURCE_UPLOAD = `${DIR_SOURCENAME}${UPLOAD_FILENAME}`;

  let store = [];
  let realRows = [];
  let convertedData = [];

  try {
    if (fs.existsSync(SOURCE_UPLOAD)) {
      const fileStream = fs.createReadStream(SOURCE_UPLOAD);

      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      });

      rl.on("line", function (line) {
        store.push(line);
      });

      rl.on("close", async function () {
        let hasColumn = false;
        let column = null;

        store.forEach((item, index, array) => {
          if (item.includes("TERMINAL") && hasColumn === false) {
            column = item.split("  ").filter(Boolean);
          }

          if (item.includes("ACQ / SWT") && hasColumn === false) {
            const readedColumn = item.split("  ").filter(Boolean);
            column = column.map(
              (list, index) =>
                `${list} ${readedColumn[index] ? readedColumn[index] : ""}`
            );
            hasColumn = true;
          }

          if (
            item.includes("--------") &&
            !array[index + 1].includes("PAGE TOTAL")
          ) {
            let nextIndex = index + 1;
            let nextLine = array[nextIndex];
            let rows = [];
            let count = 0;

            do {
              rows.push(array[nextIndex]);
              nextIndex++;
            } while (!array[nextIndex].split(" ").includes("--------"));

            realRows = [...realRows, ...rows];
          }
        });

        column = column.map((value) => value.trim()?.replace(/ +(?= )/g, ""));

        let generatedRows = realRows.map((value) =>
          value.split("  ").filter(Boolean)
        );

        generatedRows = generatedRows.map((list) => {
          return list.map((value) => value.trim());
        });

        let data = [];

        generatedRows.forEach((item, row_index) => {
          let object = {};

          if (item != null) {
            object["TERMINAL"] = item[0];
            object["REFFNO ALTO"] = `${item[1].split("/")[0].replace(" ", "")}${
              item[3]
            }`;
            object["TRACE-ACQ"] = item[1].split("/")[0].replace(" ", "");
            object["TRACE-ACQ FIX"] = item[1].split("/")[0].replace(" ", "");
            object["CARD-SWT"] = item[1].split("/")[1]?.trim();
            object["ACCOUNT NUMBER"] = item[2];
            object["RCPT NUMB"] = item[3];
            object["RCPT NUMB FIX"] = item[3];
            object["RCPT DATE"] = moment()
              .subtract(day, "days")
              .format("YYYY-MM-DD");
            object["RCPT TIME"] = item[5];
            object["TRANS TYPE"] = item[6].split(" ")[0];
            object["SA"] = item[6].split(" ")[1];
            object["AKUN"] = item[7];
            object["TO ACC"] = item[8];
            object["AMOUNT"] = Number(item[9].replace(/,/g, ""));
            object["INTERCHANGE FEE TELKOM"] = Number(
              item[10].replace(/,/g, "")
            );
            object["ISSUER"] = 6500;
            object["Net Off Beban"] = 6500 - Number(item[10].replace(/,/g, ""));
            if (
              typeof item[item?.length - 1] === "string" &&
              item[item?.length - 1]?.includes("TRX TO")
            ) {
              object["BANK NAME"] = item[item?.length - 1]?.replace(
                "TRX TO ",
                ""
              );
            } else {
              object["BANK NAME"] = "-";
            }
            object["PERIODE SETTLEMENT"] = moment()
              .subtract(day, "days")
              .format("YYYY-MM-DD");

            object["NOMINAL SETTLEMENT"] =
              Number(item[9].replace(/,/g, "")) +
              6500 -
              Number(item[10].replace(/,/g, ""));

            object["STATUS REKON"] = "";
            object["STATUS UPDATE"] = "";

            data.push(object);
          }
        });

        convertedData = data;
        transactions = [...transactions, ...data];
      });
    } else {
      console.log(`Warning!! File tidak ditemukan: ${UPLOAD_FILENAME} \n \n`);
    }
  } catch (error) {}
};

const exportFormattedFile = async () => {
  const FILE_GENERATED = await json2xls(transactions);

  await fs.writeFileSync(DOWNLOAD_FILENAME, FILE_GENERATED, "binary", (err) => {
    if (err) {
      console.log("writeFileSync error :", err);
    }
    console.log("The file has been saved!");
  });
};

const Main = () => {
  rl.question("H- berapa transaksi yang mau dibaca: ", async function (day) {
    console.log("\n");
    if (!isNaN(day)) {
      DEFAULT_DAY_READ = day;

      for (let index = DEFAULT_DAY_READ; index >= 1; index--) {
        await processLineByLine(index);
      }

      await setTimeout(() => {
        exportFormattedFile();
      }, 500);
    } else {
      console.log("TRY AGAIN!! \n");

      if (isNaN(day)) console.log("HINT: Please input number");
    }
    rl.close();
  });
};

Main();
