# run as `root`

```sh
### UPDATE
apt-get update && apt-get upgrade --yes


### CONFIGURE
timedatectl set-timezone America/Los_Angeles


### SECURE
# TODO


### INSTALL DEPENDENCIES ###
apt-get install git pip curl --yes

# install NodeJS
# https://github.com/nodesource/distributions#debinstall
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - &&\
apt-get install -y nodejs

# install pm2
npm install pm2 -g

# install MongoDB
apt-get install -y gnupg

curl -fsSL https://pgp.mongodb.com/server-6.0.asc | \
   gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg \
   --dearmor

echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg] http://repo.mongodb.org/apt/debian bullseye/mongodb-org/6.0 main" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list

apt-get update

apt-get install -y mongodb-org

echo "mongodb-org hold" | dpkg --set-selections
echo "mongodb-org-database hold" | dpkg --set-selections
echo "mongodb-org-server hold" | dpkg --set-selections
echo "mongodb-mongosh hold" | dpkg --set-selections
echo "mongodb-org-mongos hold" | dpkg --set-selections
echo "mongodb-org-tools hold" | dpkg --set-selections

# puppeteer needs these:
apt-get install -y ca-certificates fonts-liberation libappindicator3-1 libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils


systemctl start mongod
# systemctl status mongod
systemctl enable mongod

### VERIFY INSTALLATION
which node
node -v

which npm
npm -v

which pm2
pm2 --version

which mongod
mongod --version

which mongosh
mongosh --version

systemctl status mongod

```

# create a user account

NOTE: replace __USERNAME__ and __PASSWORD__ below

```sh
adduser --gecos "" __USERNAME__ --disabled-password
echo "__USERNAME__:__PASSWORD__" | chpasswd
```


# log in as new user

```sh
git clone https://github.com/PlebeiusGaragicus/AnimalHouseTapout.git
cd AnimalHouseTapout
npm install
mv .sample-env .env
nano .env
```

# input credentials etc into the `.env` file

```sh
pm2 start ./app.js --name AnimalHouseTapout
pm2 logs
```

Verify that application is working

```sh
pm2 startup
# copy the command it gives you
```

```sh
su -
<command from above>
exit
```

```sh
pm2 save
# pm2 list
# pm2 monit
# pm2 logs <app name>
# pm2 stop <app name>
# pm2 restart <app name>
# pm2 delete <app name>
# pm2 flush
```

done.