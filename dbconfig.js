module.exports =  {
    database: 'experienceApp_test',
    // host: "experienceappdb-2.cwuc8evphknb.ap-southeast-1.rds.amazonaws.com",
    host: "experienceappdb-stg.cwuc8evphknb.ap-southeast-1.rds.amazonaws.com",
    port: '5432',
    user: 'postgres',
    password: 'postgres',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
}