const express = require("express");
const https = require("https");
const fs = require("fs");
const path = require("path");
const forge = require("node-forge");
const md5 = require("md5");
const cors = require("cors");

const port = 3000;

const options = {
  // ca: fs.readFileSync(path.resolve(__dirname, "./certs/ca.crt")),
  cert: fs.readFileSync(path.resolve(__dirname, "./certs/server.crt")),
  key: fs.readFileSync(path.resolve(__dirname, "./certs/server.key")),
  rejectUnauthorized: false,
  requestCert: true,
};

const app = express();

const server = https.createServer(options, app);
server.listen(port, () => {
  console.log(`.. server up and running and listening on ${port} ..`);
});

app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

// Socket Begin
const io = require("socket.io")();

const servIo = io.listen(server, {
  cors: true,
  origin: "*",
  credentials: true,
  forceBase64: true,
});

servIo.on("connection", function (socket) {
  // console.log({ socket });

  setInterval(function () {
    socket.emit("second", { second: new Date().getTime() });
  }, 1000);
});
// Socket End

app.get("/", (req, res) => {
  if (!isEmpty(req.socket.getPeerCertificate())) {
    console.log("Inside IF");
    return verify_certificate(req, res);
  }

  // if (req.header("ssl_client_verify") !== "SUCCESS") return res.status(403).send("Forbidden - please provide valid certificate.");
  // TLSVersion,Ciphers,Extensions,EllipticCurves,EllipticCurvePointFormats

  let ellipticCurvesArr = req.header("ssl_curves")?.split(":");
  let cipherArr = req.header("ssl_cipher");
  let ciphersArr = req.header("ssl_ciphers")?.split(":");
  let tls_version = req.header("X-HTTPS-Protocol");

  let ellipticCurves = "";
  let ciphers = "";

  ellipticCurvesArr.forEach((item) => {
    ellipticCurves += `${item}-`;
  });

  ciphersArr.forEach((item) => {
    ciphers += `${item}-`;
  });

  ellipticCurves = ellipticCurves.slice(0, -1) + "";
  ciphers = ciphers.slice(0, -1) + "";

  const ja3_str = `${tls_version},${ellipticCurves},${ciphers}`;
  const ja3hash = md5(ja3_str);

  console.log("outside if");
  console.log(ja3_str);
  console.log(ja3hash);

  res.sendFile("./index.html", { root: __dirname });
});

function verify_certificate(request, response) {
  const cert = request.socket.getPeerCertificate();

  if (request.client.authorized) {
    return response.send(`Hello 2 ${cert.subject.CN}, your certificate was issued by ${cert.issuer.CN}!`);
  }

  if (cert.subject) {
    return response.status(403).send(`Sorry 1 ${cert.subject.CN}, certificates from ${cert.issuer.CN} are not welcome here.`);
  } else {
    return response.status(401).send(`Sorry 2, but you need to provide a client certificate to continue.`);
  }
}

function isEmpty(obj) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) return false;
  }
  return true;
}
