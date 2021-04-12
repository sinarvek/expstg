It is a cron job for experience app

Before Develop Preparation:

1. install nodejs version 12
2. after installation of nodejs , please run npm i
3. you can develop now

Before Deploying Preparation : 
2. install serverless 
    1. go to https://www.serverless.com/ for more details
    2. npm install -g serverless

3. set up aws cli 
    1. more details on https://aws.amazon.com/cli/
    2. serverless config credentials -o --provider aws --key {KEY} --secret {SECRET}
4. You can deploy now ---- serverless deploy