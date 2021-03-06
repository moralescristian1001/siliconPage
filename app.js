// Include the cluster module
var cluster = require('cluster');

// Express minify
var minify = require('express-minify');

// Express minify html
var minifyHTML = require('express-minify-html');

// Express Compress
var compression = require('compression')

// Code to run if we're in the master process
if (cluster.isMaster) {

    // Count the machine's CPUs
    var cpuCount = require('os').cpus().length;

    // Create a worker for each CPU
    for (var i = 0; i < cpuCount; i += 1) {
        cluster.fork();
    }

    // Listen for terminating workers
    cluster.on('exit', function (worker) {

        // Replace the terminated workers
        console.log('Worker ' + worker.id + ' died :(');
        cluster.fork();

    });

    // Code to run if we're in a worker process
} else {

    var express = require('express');
    var bodyParser = require('body-parser');
    var path = require("path");
    var nodemailer = require('nodemailer');
    var app = express();

    // compress responses
    app.use(compression());

    // minify
    app.use(minify({cache: __dirname + '/cache'}));

    // minify html
    app.use(minifyHTML({
        override:      true,
        exception_url: false,
        htmlMinifier: {
            removeComments:            true,
            collapseWhitespace:        true,
            collapseBooleanAttributes: true,
            removeAttributeQuotes:     true,
            removeEmptyAttributes:     true,
            minifyJS:                  true
        }
    }));

    app.set('view engine', 'ejs');
    app.set('views', __dirname + '/views');
    console.log(__dirname + '/views');
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(express.static(__dirname + '/static'));
    app.use(express.static(__dirname + '/static/bootstrap/css'));
    app.use(express.static(__dirname + '/static/bootstrap/js'));
    app.use(express.static(__dirname + '/static/bootstrap/fonts'));
    app.use(express.static(__dirname + '/static/google'));
    app.use(express.static(__dirname + '/static/main'));
    app.use(express.static(__dirname + '/static/jquery'));
    app.use(bodyParser.json());
    
    app.use("/static", express.static( __dirname + '/static'));
    app.get('/', function (req, res) {
        res.setHeader('Cache-Control', 'public, max-age=31622400');
        res.render('index', {
            static_path: 'static',
            theme: process.env.THEME || 'flatly',
            flask_debug: process.env.FLASK_DEBUG || 'false'
        });
    });

    app.post('/sendEmail', function (req, res) {
            var reqJson = req.body;
            var destArray = reqJson.dest;
            var title = "Silicon contact form";
            var message = reqJson.name +": " + reqJson.message;
            try{
                sendMailUser(destArray, title, message, res);
            }catch(err){
                res.send(error);
            }
            res.send('{"message":"ok"}');
        }
    );

    app.post('/sendWhitelist', function (req, res) {
            var reqJson = req.body;
            var destArray = reqJson.dest;
            var name = reqJson.name;
            var message = "Request for whitelist " + reqJson.contribution;
            var contribution = reqJson.contribution;
            var email = reqJson.email;
            var country = reqJson.country;
            try{
                sendMailWhitelist(destArray, name, message, email, contribution, country, res);
            }catch(err){
                res.send(error);
            }
            res.send('{"message":"ok"}');
        }
    );

    var port = process.env.PORT || 3000;

    var server = app.listen(port, function () {
        console.log('Server running at http://127.0.0.1:' + port + '/');
    });
}

function sendMailUser(dest, title, message,res) {
    nodemailer.createTestAccount((err, account) => {
      // create reusable transporter object using the default SMTP transport
      let transporter = nodemailer.createTransport({
        host: process.env.SENDGRID_SMTP_URL,
        port: process.env.SENDGRID_SMTP_PORT,
        secure: false, // true for 465, false for other ports 587
        auth: {
          user: process.env.SENDGRID_USERNAME, // generated ethereal user
          pass: process.env.SENDGRID_PASSWORD  // generated ethereal password
        },
        tls: {
          // do not fail on invalid certs
          rejectUnauthorized: false
        }
      });

      // setup email data with unicode symbols
      let mailOptions = {
        from: '"Silicon contact form-No Reply" <' + process.env.FROM_EMAIL + '>', // sender address
        to: process.env.RECIPIENTS_LIST, // list of receivers
        subject: 'Silicon contact form', // Subject line
        // plain text body
        html: '<h1> Silicon contact form </h1></br><p>' + message + '</p></br><p> '+dest+'</p>',   // html body
        attachments: []
      };

      // send mail with defined transport object
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          res.send({ "message": "error" });
          return console.log(error);
        }
        res.send({ "message": "ok" });
        console.log('Message sent: %s', info.messageId);
        // Preview only available when sending through an Ethereal account
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
      });
    });
}

function sendMailWhitelist(dest, name, message, email, contribution, country, res) {
    nodemailer.createTestAccount((err, account) => {
    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
      host: process.env.SENDGRID_SMTP_URL,
      port: process.env.SENDGRID_SMTP_PORT,
      secure: false, // true for 465, false for other ports 587
      auth: {
        user: process.env.SENDGRID_USERNAME, // generated ethereal user
        pass: process.env.SENDGRID_PASSWORD // generated ethereal password
      },
      tls: {
        // do not fail on invalid certs
        rejectUnauthorized: false
      }
    });

    // setup email data with unicode symbols
    let mailOptions = {
      from: '"Silicon contact form-No Reply" <' + process.env.FROM_EMAIL + '>', // sender address
      to: process.env.RECIPIENTS_LIST, // list of receivers
      subject: 'White List', // Subject line
      // plain text body
      html: '<h1> White List </h1></br><p>' + message + '</p></br><p> '+dest+'</p>', // html body
      attachments: []
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        res.send({ "message": "error" });
        return console.log(error);
      }
      res.send({ "message": "ok" });
      console.log('Message sent: %s', info.messageId);
      // Preview only available when sending through an Ethereal account
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    });
  });
}