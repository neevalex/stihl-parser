const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");

const express = require("express");
const app = express();

const adapter = new FileSync("db.json");
const db = low(adapter);

var request = require("request-promise");
const cheerio = require("cheerio");
var html;

const { convertArrayToCSV } = require("convert-array-to-csv");
const converter = require("convert-array-to-csv");

db.defaults({ settings: {}, products: [] }).write();

var get_products = async function(url) {
  var html = [];
  var data = [];

  db.set("products", []).write();

  const options = {
    method: "GET",
    uri: url
  };

  console.log(url);
  await request(options).then(async function(response) {
    var $ = cheerio.load(response);
    // console.log(response);

    $(".js-productContent .article").each(function(i, element) {
      id = $(this).attr("data-productid");
      title = $(this)
        .find(".productName a")
        .text();
      url = $(this)
        .find(".productName a")
        .attr("href");
      image = $(this)
        .find(".imageContainer img")
        .attr("src");

      if (
        $(this)
          .find(".technicalInfo")
          .html()
      ) {
        smallDesc = $(this)
          .find(".technicalInfo")
          .html();
      } else {
        smallDesc = "";
      }

      var cat = " ";
      $(".breadcrumb li").each(function(i, elem) {
        if (!($(this).text() == "Home" || $(this).text() == "Product Range")) {
          cat += $(this).text() + "/";
        }
      });

      price = $(this)
        .find(".priceLabel span")
        .html();
      price = price.replace("$", "");

      db.get("products")
        .push({
          id: id,
          title: title,
          url: "https://www.stihlshop.co.nz" + url,
          image: "https://www.stihlshop.co.nz" + image,
          smallDesc: smallDesc,
          cat: cat,
          price: parseInt(price)
        })
        .write();
    });
  });

  return data;
};

var get_moreData = async function(url) {
  var html = [];
  var id = "";

  const options = {
    method: "GET",
    uri: url
  };

  // console.log(url);
  await request(options).then(async function(response) {
    var $ = cheerio.load(response);

    id = $("#ProductId").attr("value");
    sku = $(".productDetail .productCode span").text();
    description = $(".productDetail p:nth-of-type(2)").text();

    var related = " ";
    $(".relatedProducts article").each(function(i, elem) {
      related += $(this).attr("data-productid") + ",";
    });

    if (id) {
      db.get("products")
        .find({ id: id })
        .assign({ sku: sku, description: description, related: related })
        .write();
    }
  });

  return id;
};

app.use(express.static("html"));

app.get("/api", async function(req, res) {
  console.log(req.query.cmd);

  if (req.query.cmd == "setURLS") {
    urls = JSON.parse(req.query.data);
    console.log(urls);
    db.set("settings.urls", urls).write();
  }

  if (req.query.cmd == "getURLS") {
    res.send({ cmd: "getURLS", data: db.get("settings.urls").value() });
  }

  if (req.query.cmd == "getPRODUCTS") {
    res.send({ cmd: "getPRODUCTS", data: db.get("products").value() });
  }

  if (req.query.cmd == "status") {
    res.send({ cmd: "status", data: global.status });
  }

  if (req.query.cmd == "export") {
    const csvFromArrayOfObjects = convertArrayToCSV(db.get("products").value());

    res.setHeader(
      "Content-disposition",
      "attachment; filename=stihl-export.csv"
    );
    res.set("Content-Type", "text/csv");
    res.status(200).send(csvFromArrayOfObjects);
  }

  if (req.query.cmd == "scanPRODUCTS") {
    source_urls = db.get("settings.urls").value();
    source_urls.forEach(url => {
      // console.log(url);
      get_products(url)
        .then(function(result) {
          //console.log(result);
          //res.send({ cmd: 'scanPRODUCTS', data: '' } );
        })
        .catch(function(error) {
          console.log(error);
        });
    });
  }

  if (req.query.cmd == "moreDATA") {
    products = db.get("products").value();
    products.forEach(product => {
      // console.log(url);
      get_moreData(product.url)
        .then(function(result) {
          //console.log(result);
        })
        .catch(function(error) {
          console.log(error);
        });
    });
  }
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3222;
}
console.log("Parser is running on: " + port);
app.listen(port);
