'use strict';

const db = require('./db_connect');



const releaseTable = async (event, context, callback) => {

    // const query = {
    //   text: "UPDATE desk SET desk_status = $1 , users_id = null WHERE desk_status = $2",
    //   values: ['available', 'booked']
    // }
  
    
    const query = {
      text: " UPDATE desk SET desk_status = $1 , users_id = null WHERE desk_name != $2 AND desk_name != $3 AND  desk_name != $4" ,
      values: [ 'available' ,'RHK-KLB-022-0001', 'RHK-KLB-022-0084','RHK-KLB-022-0087' ]
    }
  
    const updatedDesk1 = {
        text: "UPDATE desk SET desk_status = $1 , users_id = 215 WHERE desk_name = $2 " ,
        values: [ 'booked' , 'RHK-KLB-022-0001']
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
  
      await db.connect()
  

  
      console.log("release table now");
      let result = await db.query(query)
      let result2 = await db.query(updatedDesk1)
  
      await Promise.all(
      unavailableDesks.map(async(desk)=>{
        let setUnavailableDesk = {
          text: "UPDATE desk SET desk_status = $1 , users_id = null  WHERE desk_name = $2 " ,
          values: [ 'unavailable' , desk ]
      }
       console.log(desk)
        let result = await db.query(setUnavailableDesk)
  
        console.log(result)
      }))
      console.log("end of releasing table");
      console.log('result', result);
      console.log('result2', result2);
  
  
      //RHK-KLB-022-0084 to null
      //RHK-KLB-022-0087 to null 
  
      await db.end();
  
    //   callback(null, {
    //     statusCode: 201,
    //     body: "Release All table"
    //   })
  
    } catch (err) {
      console.log('err', err);
      await db.end();
    //   callback(null, {
    //     statusCode: 500,
    //     body: err
    //   })
    }
}

releaseTable()