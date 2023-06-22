# install MongoDB on MacOS

```sh
# https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-os-x/
brew tap mongodb/brew

brew update

brew install mongodb-community@6.0

# this is what brew says to run at the end of the install...
brew services restart mongodb/brew/mongodb-community
```



# install MongoDB on Debian 11

 - https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-debian/

```sh
sudo apt-get install gnupg

curl -fsSL https://pgp.mongodb.com/server-6.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg \
   --dearmor

echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg] http://repo.mongodb.org/apt/debian bullseye/mongodb-org/6.0 main" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

sudo apt-get update

sudo apt-get install -y mongodb-org

echo "mongodb-org hold" | sudo dpkg --set-selections
echo "mongodb-org-database hold" | sudo dpkg --set-selections
echo "mongodb-org-server hold" | sudo dpkg --set-selections
echo "mongodb-mongosh hold" | sudo dpkg --set-selections
echo "mongodb-org-mongos hold" | sudo dpkg --set-selections
echo "mongodb-org-tools hold" | sudo dpkg --set-selections
```

# 
```sh
sudo systemctl start mongod

# verify that the service is running
sudo systemctl status mongod

# enable the service to start on boot
sudo systemctl enable mongod
```


# using Mongosh

```sh
# connect to the correct database
mongosh mongodb://localhost:27017/yourDatabaseName

# show collections
show collections

# search all documents inside a collection:
db.collectionName.find()
db.users.find().pretty()

# modify the database
db.collectionName.insertOne({field1: 'value1', field2: 'value2'})
db.collectionName.updateOne({field1: 'value1'}, {$set: {field2: 'new_value2'}})
db.collectionName.deleteOne({field1: 'value1'})
```