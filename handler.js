'use strict';

const db = require('./db_connect');
var crypto = require('crypto');
var moment = require('moment');
const { google } = require('googleapis');

module.exports.updateKey = async (event, context, callback) => {

  try {
    const client = await db.connect()

    console.log('create new key ,', query);
    let result = await client.query(query)
    console.log('result', result);

    client.release(true)
    console.log('release connection');

    callback(null, {
      statusCode: 200,
      body: "Create security key success"
    })
  } catch (err) {

    callback(null, {
      statusCode: 500,
      body: err
    })
  }

};

module.exports.releaseTable = async (event, context, callback) => {

  const query = {
    text: " UPDATE desk SET desk_status = $1 , users_id = null WHERE desk_name != $2 AND desk_name != $3 AND  desk_name != $4",
    values: ['available', 'RHK-KLB-022-0001', 'RHK-KLB-022-0084', 'RHK-KLB-022-0087']
  }

  const updatedDesk1 = {
    text: "UPDATE desk SET desk_status = $1 , users_id = 215 WHERE desk_name = $2 ",
    values: ['booked', 'RHK-KLB-022-0001']
  }

  let unavailableDesks = [
    'RHK-KWF-017-0111',
    'RHK-KWF-017-0112',
    'RHK-KWF-017-0115',
    'RHK-KWF-017-0116',
    'RHK-KWF-017-0117',
    'RHK-KWF-017-0118',
    'RHK-KWF-017-0119',
    'RHK-KWF-017-0120',
    'RHK-KWF-017-0121',
    'RHK-KWF-017-0122',
    'RHK-KWF-017-0123',
    'RHK-KWF-017-0125'
  ]


  try {

    //RHK-KLB-022-0001 with 215 userID

    const client = await db.connect()


    console.log("release table now");
    let result = await client.query(query)
    let result2 = await client.query(updatedDesk1)
    await Promise.all(
      unavailableDesks.map(async (desk) => {
        let setUnavailableDesk = {
          text: "UPDATE desk SET desk_status = $1 , users_id = null  WHERE desk_name = $2 ",
          values: ['unavailable', desk]
        }
        console.log(desk)
        let result = await client.query(setUnavailableDesk)

        console.log(result)
      }))

    console.log("end of releasing table");
    console.log('result', result);
    console.log('result2', result2);


    //RHK-KLB-022-0084 to null
    //RHK-KLB-022-0087 to null 

    // tell the pool to destroy this client
    client.release(true)
    console.log('release connection');

    callback(null, {
      statusCode: 201,
      body: "Release All table"
    })

  } catch (err) {
    console.log('err', err);

    callback(null, {
      statusCode: 500,
      body: err
    })
  }

};

module.exports.deviceAlarm = async (event, context, callback) => {

  try {

    const client = await db.connect()

    const query = {
      text: "select * from scanner where alive = false and scanner_device_id Like $1",
      values: ['%QRSCANNER%']
    }

    console.log("check door status");
    let result = await client.query(query)
    let doorUnavailable = []

    if (result && result.rows && result.rows.length > 0) {
      Promise.all(

        result.rows.map((door) => {
          const { last_update, scanner_device_id } = door
          const diff = moment(new Date(), "DD/MM/YYYY HH:mm:ss").diff(moment(last_update, "DD/MM/YYYY HH:mm:ss"), 'minute');
          diff > 29 && doorUnavailable.push(scanner_device_id)
        })

      )
    }

    console.log("doorUnavailable" , result.rows);


    if (doorUnavailable.length > 0) {
      console.log('need to send email to alarm the door is not normal', doorUnavailable);

      let doors = ""

      await Promise.all(doorUnavailable.map((item) => {
        doors = doors == "" ? item : doors + " ," + item
      }))


      const keyQuery = {
        text: 'select * from google_api where users_id = $1 ',
        values: [1]
      }

      let googleApiInfo = await client.query(keyQuery)
      console.log('googleApiInfo', googleApiInfo.rows);
      if (!googleApiInfo.rows || googleApiInfo.rows && googleApiInfo.rows.length == 0) {
        console.log(`Can't found google api with user id : ${1}`)
      }

      const { google_api_access_token, google_api_refresh_token } = googleApiInfo.rows[0]

      const oauth2Client = new google.auth.OAuth2(
        "936829825872-bkhns73m97ou16dhmsq9ffn5nuc4amsu.apps.googleusercontent.com",
        "POxI2kRWKjraCSiWzn-8X3Nb",
        'http://18.140.171.216/appointment/calendar/auth/success');

      console.log('start to create oath2 client');

      oauth2Client.setCredentials({
        refresh_token: google_api_refresh_token,
        access_token: google_api_access_token
      });

      console.log('created oath2 client');


      const response = await oauth2Client.getAccessToken();
      console.log('response', response);

      oauth2Client.setCredentials({
        refresh_token: google_api_refresh_token,
        access_token: response.token
      });

      var gmailClass = google.gmail('v1');
      var email_lines = [];

      // let email_address = "hk.gs@roche.com , rhoorg_rhk-it@msxdl.roche.com "
      const emailQuery = {
        text: 'select email from alert_email where alert_email_type_id = $1 ',
        values: [1]
      }

      let email_address = await client.query(emailQuery)


      let send_email = ""

      email_address.rows.map((itme) => {
        let { email } = itme
        console.log('email', email);
        send_email = send_email == "" ? email : send_email + ", " + email
      })

      email_lines.push(`To: ${send_email}`);
      email_lines.push('Content-type: text/html;charset=iso-8859-1');
      email_lines.push('MIME-Version: 1.0');
      email_lines.push("Subject: Door Alert");
      email_lines.push("");
      email_lines.push(`${doors} ${doorUnavailable.length > 1 ? "have" : "has"} have a problem now, please note that.`);


      var email = email_lines.join('\r\n').trim();

      console.log('email' + email);

      var base64EncodedEmail = Buffer.from(email).toString('base64');
      base64EncodedEmail = base64EncodedEmail.replace(/\+/g, '-').replace(/\//g, '_');

      console.log('ready to send email');

      let sendResult = await gmailClass.users.messages.send({
        auth: oauth2Client,
        userId: 'me',
        resource: {
          raw: base64EncodedEmail
        }
      });

      console.log(`send result : ${sendResult}`)
    }
    client.release(true)
    console.log('release connection');

    callback(null, {
      statusCode: 201,
      body: "finish checking of door"
    })

  } catch (err) {
    console.log('err', err);

    callback(null, {
      statusCode: 500,
      body: err.message
    })
  }

};