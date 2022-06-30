const moment = require("moment");
const nodemailer = require("nodemailer");

moment.locale("id");

const DIR_PATHNAME = "download/";
let transporter = null;

var mailOptions = {
  from: "destinurfitria24@gmail.com",
  to: "info.odissey@telkom.co.id",
  cc: "arya.wahyu502@gmail.com",
};

const sendDataToEmail = async () => {
  const subject = `Data Settlement Transaksi Alto Tanggal ${moment()
    .subtract(1, "days")
    .format("DD MMMM YYYY")}`;

  const text = `
    Dear Team Odissey,
  
    Terlampir adalah Transaksi Alto tanggal ${moment()
      .subtract(1, "days")
      .format("DD MMMM YYYY")}
  
    Terimakasih. 
  
    Best Regards,
    Desti Nurfitria`;

  console.log("\n");
  console.log("Sending Data to Odissey...");

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "destinurfitria24@gmail.com",
      // pass: "rpwraczvxvtidedt",
      pass: "brwqsmxwjtrcceri",
    },
  });

  mailOptions = {
    ...mailOptions,
    subject,
    text,
    attachments: [
      {
        filename: `${moment().subtract(1, "days").format("YYMMDD")}-ALTO.xlsx`,
        path: `${DIR_PATHNAME}${moment()
          .subtract(1, "days")
          .format("YYMMDD")}-ALTO_FORMATTED.xlsx`,
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    ],
  };

  await transporter.sendMail(mailOptions, (err, info) => {
    if (err) throw err;
    console.log("Email sent: " + info.response);
  });
};

sendDataToEmail();
