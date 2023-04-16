# how would I deploy this project in a "production" environment?

 - update the machine

This should be a standard process

 - install dependencies:
    - NodeJS and NPM
    - MongoDB
    - PM2

 - install the project (use git clone)

 - setup environment variables

`.env` - this should be the same.. I'm not yet running such complex applications that there is a wild difference.  I just need to learn how to do this for 'real.'

 - setup remote monitoring

Because winston allows for 'transports' - let's try and use Azure or something cool to monitor the app in real time

 - configure the process manager for handling reboots/crashes

https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-ubuntu-20-04

https://www.axllent.org/docs/nodejs-service-with-systemd/
