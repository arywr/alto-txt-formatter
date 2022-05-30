const fs = require("fs");
const readline = require("readline");

const processLineByLine = async () => {
  let store = [];
  let realRows = [];
  let convertedData = [];

  const fileStream = fs.createReadStream("sample-alto-0529.rpt");

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  rl.on("line", function (line) {
    store.push(line);
  });

  rl.on("close", function () {
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
    column.length = column.length - 2;
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
        object["INTERCHANGE FEE TELKOM"] = Number(item[10].replace(/,/g, ""));
        object["ISSUER"] = 6500;
        object["Net Off Beban"] = 6500 - Number(item[10].replace(/,/g, ""));

        data.push(object);
      }
    });

    convertedData = data;

    const grandTotal = convertedData.reduce(function (acc, obj) {
      return Number(acc) + Number(obj["AMOUNT"]);
    }, 0);

    const grandInterchange = convertedData.reduce(function (acc, obj) {
      return Number(acc) + Number(obj["Net Off Beban"]);
    }, 0);

    console.log(
      `TOTAL TRANSACTION READED : ${convertedData.length} Transactions`
    );
    console.log(
      `TOTAL AMOUNT : ${new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
      }).format(grandTotal + grandInterchange)}`
    );
  });
};

processLineByLine();
