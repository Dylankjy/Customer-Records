var http = require('http');
var mysql = require('mysql');
var fs = require('fs');
var url = require('url');

var results;
var totalrows = 0;

var customerresults;
var totalcustomerrows = 0;

var productresults;
var totalproductrows = 0;
var productprice;


var con = mysql.createConnection({
  host: "play.pulsarmc.com",
  user: "endylan",
  password: "Password-123",
});

createDatabase();

function createDatabase() {
  con.connect(function(err) {
    if (err) throw err;
    console.log("[SQL] Connection Successful.");
    console.log("[SQL] Preparing database.");
    con.query("CREATE DATABASE nodejs_customer", function(err, result) {
      if (err) {
        createTable()
        console.log("[LOG] Database already exists! Skipping creation.");
      } else {
        console.log("[SQL] This is the first time this application is runned, therefore a database has been created.");
        createTable();
      }
    })
  })
}

function createTable() {
  con = mysql.createConnection({
    host: "play.pulsarmc.com",
    user: "endylan",
    password: "Password-123",
    database: "nodejs_customer"
  });
  con.connect(function(err) {
    if (err) throw err;
    //tables
    //console.log("CREATE TABLE productorder (id INT AUTO_INCREMENT PRIMARY KEY, custid VARCHAR(255), productid VARCHAR(255), quantity VARCHAR(255), totalprice VARCHAR(255))");
    con.query("CREATE TABLE productorder (id INT AUTO_INCREMENT PRIMARY KEY, custid VARCHAR(255), productid VARCHAR(255), quantity VARCHAR(255), totalprice VARCHAR(255))", function(err, result) {
      if (err) {
        //throw err;
        main();
        console.log("[SQL] Table already exists! Skipping creation.");
      } else {
        console.log("[SQL] Tables created - First run.");
        main()
      }
    });
  });
}

function main() {
  console.log("[Webserver] Starting web interface.");
  http.createServer(function(req, res) {
    fs.readFile('order.html', function(err, data) {
      res.writeHead(200, {
        'Content-Type': 'text/html'
      });

      var conn = mysql.createConnection({
        host: "play.pulsarmc.com",
        user: "endylan",
        password: "Password-123",
        database: "nodejs_customer"
      });


      conn.query("SELECT custid, fname, lname FROM customer", function(err, result, fields) {
        if (err) throw err;

        customerresults = result;
        totalcustomerrows = result.length;
        console.log("Total no of rows : " + totalcustomerrows);

      })


      conn.query("SELECT id, product, price FROM product", function(err, result, fields) {
        if (err) throw err;

        productresults = result;
        totalproductrows = result.length;
        console.log("Total no of rows : " + totalproductrows);

      })

      var i;
      res.write(data)
      res.write('<form action="querystring" method="get" enctype="multipart/form-data">');
      res.write('<h3>Order Details</h3>')
      res.write('Customer Name: <select name="custname" required>')
      for (i = 0; i < totalcustomerrows; i++) {
        res.write('<option value=' + customerresults[i].custid + '>' + customerresults[i].fname + ' ' + customerresults[i].lname + '</option>');
      }
      res.write('</select><br>')


      res.write('Product Name: <select name="productname" required>')
      for (i = 0; i < totalproductrows; i++) {
        res.write('<option value=' + productresults[i].id + '>' + productresults[i].product + '</option>');
      }
      res.write('</select><br>')

      res.write('Quantity: <input name="quantity" type="number" required><br>')
      res.write('<br><button type="submit" class="right mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--accent" style="color: white;">Submit</button></form><br><br></div></body></html>')


      conn.query("SELECT c.fname, c.lname, p.product, o.quantity, o.totalprice FROM productorder o left outer join customer c on o.custid=c.custid left outer join product p on o.productid = p.id", function(err, result, fields) {
        if (err) throw err;

        results = result;
        totalrows = result.length;
        //console.log("First Name : " + results[0].fname);
        console.log("Total no of rows : " + totalrows);

      })
      res.write('<center><table style="width:20%; margin-bottom:20px;" class="mdl-data-table mdl-js-data-table mdl-shadow--2dp">')
      res.write('<thead><tr>')
      res.write('<th class="mdl-data-table__cell--non-numeric">Customer Name</th>')
      res.write('<th>Product Name</th>')
      res.write('<th>Quantity</th>')
      res.write('<th>Total Price</th>')
      res.write('</tr></thead>')

      res.write('<tbody>')

      if (totalrows > 0) {
        for (i = 0; i < totalrows; i++) {
          if (results[i].custname != 'undefined') {
            res.write('<tr>')
            res.write('<td class="mdl-data-table__cell--non-numeric">' + results[i].fname + " " + results[i].lname + '</td>')
            res.write('<td>' + results[i].product + '</td>')
            res.write('<td>' + results[i].quantity + '</td>')
            res.write('<td>' + results[i].totalprice + '</td>')
            res.write('</tr>')
          }
        }
      }
      res.write('</tbody>')
      res.write('</table></center>')



      res.end();

      var q = url.parse(req.url, true).query; //querystring

      if (q.custname != "" && q.productname != "") {

        if (q.productname != undefined) {
          conn.query("SELECT price FROM product WHERE id=" + q.productname, function(err, result, fields) {
            if (err) throw err;

            productprice = result[0].price
            console.log("Price : " + productprice);

          })
        }
console.log("Customer ID : " +  q.custname);
console.log("Product ID : " + q.productname);
//querystring?custname=7&productname=73&quantity=3

        var data = '"' + q.custname + '"' + ", " + '"' + q.productname + '"' + ", " + '"' + q.quantity + '"' + ", " + '"' + q.quantity * productprice + '"';
        var sqlcommand = "INSERT INTO nodejs_customer.productorder (custid, productid, quantity, totalprice) VALUES (" + data + ")";
        console.log(sqlcommand);
        con.query(sqlcommand, function(err, result) {
          if (err) throw err;
          console.log("[SQL] Added a record");
          //con.end();
        });
      } else {
        console.log('Rejected data')
      }
    });

    var sqlcommand = "DELETE FROM nodejs_customer.productorder where custid= 'undefined'";
    con.query(sqlcommand, function(err, result) {
      if (err) throw err;
      //con.end();
    });




  }).listen(8080);
  console.log("[Webserver] Started.");
}
