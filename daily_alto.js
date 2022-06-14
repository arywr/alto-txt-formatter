const fs = require("fs");
const readline = require("readline");
const json2xls = require("p3x-json2xls-worker-thread");
const moment = require("moment");

let DEFAULT_DAY_READ = 1;

// const TODAY_DATE = moment().subtract(1, "days").format("YY-MM-DD");
const DIR_PATHNAME = "download/";
const DIR_SOURCENAME = "upload/";

// const UPLOAD_FILENAME = `${TODAY_DATE}_TELKOM-ALTO_Transfer-Acquirer-Transaction.rpt`;
// const DOWNLOAD_FILENAME = `${DIR_PATHNAME}${moment().subtract(1, "days").format("YYMMDD")}-ALTO_FORMATTED.xlsx`;

// const source = `${DIR_SOURCENAME}${UPLOAD_FILE_NAME}`;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const processLineByLine = async (day) => {
  const TODAY_DATE = moment().subtract(day, "days").format("YY-MM-DD");

  const DOWNLOAD_FILENAME = `${DIR_PATHNAME}${moment()
    .subtract(day, "days")
    .format("YYMMDD")}-ALTO_FORMATTED.xlsx`;
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
            object["CARD-SWT"] = item[1].split("/")[1]?.trim();
            object["ACCOUNT NUMBER"] = item[2];
            object["RCPT NUMB"] = item[3];
            object["RCPT DATE"] = item[4];
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
              object["BANK NAME"] = "";
            }
            object["NOMINAL SETTLEMENT"] =
              Number(item[9].replace(/,/g, "")) +
              6500 -
              Number(item[10].replace(/,/g, ""));

            object["PERIODE SETTLEMENT"] = moment()
              .subtract(day, "days")
              .add(1, "days")
              .format("DD-MMM-YY");

            data.push(object);
          }
        });

        convertedData = data;

        const xlsBinary = await json2xls(convertedData);

        await fs.writeFileSync(
          DOWNLOAD_FILENAME,
          xlsBinary,
          "binary",
          (err) => {
            if (err) {
              console.log("writeFileSync error :", err);
            }
            console.log("The file has been saved!");
          }
        );
      });
    } else {
      console.log(`Warning!! File tidak ditemukan: ${UPLOAD_FILENAME} \n \n`);
    }
  } catch (error) {
    console.log(error);
  }
};

const Main = () => {
  rl.question("H- berapa transaksi yang mau dibaca: ", function (day) {
    console.log("\n");
    if (day) {
      DEFAULT_DAY_READ = day;

      for (let index = DEFAULT_DAY_READ; index >= 1; index--) {
        processLineByLine(index);
      }
    } else {
      console.log("TRY AGAIN!! \n");
    }

    rl.close();
  });
};

Main();
