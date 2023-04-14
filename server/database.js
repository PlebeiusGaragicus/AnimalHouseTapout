import { MongoClient } from 'mongodb';


export const DB_COLLECTION_NAME = 'settings'

const DB_DATABASE_NAME = 'AnimalHouseTapout'
const DB_URI = "mongodb://127.0.0.1:27017/AnimalHouseTapout"

export const client = new MongoClient(DB_URI, { useNewUrlParser: true });
export let db = null;



export async function connectToMongoDB() {
    await client.connect();
    console.log("Connected to MongoDB");
    db = client.db(DB_DATABASE_NAME);
}


export async function closeMongoDBConnection() {
    return new Promise(async (resolve, reject) => {
        console.log("closeMongoDBConnection()");
        try {
            await client.close()
                .then(() => {
                    console.log("Closed MongoDB connection");
                    resolve();
                });
        } catch (error) {
            console.error("Error closing MongoDB connection: ", error);
            reject(error);
        }
    });
}


export async function setValue(name, value) {
    try {
        const collection = db.collection(DB_COLLECTION_NAME);
        await collection.updateOne({ name: name }, {
            $set: { value: value }
        }, { upsert: true });
    } catch (error) {
        console.error(error);
    }
}


export async function getValue(name) {
    try {
        const collection = db.collection(DB_COLLECTION_NAME);
        const item = await collection.findOne({ name: name });

        if (!item)
            return null;

        return item.value;

    } catch (error) {
        console.error(error);
    }
}



export async function getUsersWithUnit() {
    try {
        const collection = db.collection('users');
        const users = await collection.find({ unit: { $exists: true, $ne: '' } }).toArray();

        if (!users || users.length === 0)
            return null;

        return users;

    } catch (error) {
        console.error(error);
    }
}



export async function addUser(user_chat_id, unit) {
    try {
        const collection = db.collection('users');
        const newUser = {
            user_chat_id: user_chat_id,
            unit: unit,
        };

        const result = await collection.insertOne(newUser);

        if (result.acknowledged && result.insertedId) {
            console.log('New user added successfully');
            return newUser;
        } else {
            console.error('Failed to insert the new user');
            return null;
        }

    } catch (error) {
        console.error(error);
    }
}


export async function userExists(telegram_chat_id) {
    try {
        const collection = db.collection('users');
        const user = await collection.findOne({ user_chat_id: telegram_chat_id });

        return !!user;

    } catch (error) {
        console.error(error);
        return false;
    }
}



export async function getUserUnit(telegram_chat_id) {
    try {
        const collection = db.collection('users');
        const user = await collection.findOne({ user_chat_id: telegram_chat_id });

        if (!user)
            return null;

        return user.unit;

    } catch (error) {
        console.error(error);
        return false;
    }
}


export async function updateUserUnit(user_chat_id, unit) {
    try {
        const collection = db.collection('users');
        const result = await collection.updateOne(
            { user_chat_id: user_chat_id },
            { $set: { unit: unit } }
        );

        if (result.modifiedCount !== 1) {
            console.error('Failed to update the user unit');
            return false;
        }

        return true;

    } catch (error) {
        console.error(error);
        return false;
    }
}


export async function getAllUsers() {
    try {
        const collection = db.collection('users');
        const users = await collection.find({}).toArray();

        if (!users || users.length === 0)
            return null;

        return users;

    } catch (error) {
        console.error(error);
    }
}




//// FEEDBACK

/*
Your database.js file looks functional and provides a good foundation for interacting with your MongoDB database. I'll provide some suggestions and best practices to help you improve it:

Use environment variables for sensitive data: Instead of hardcoding the database URI in your code, consider using environment variables to store sensitive data like the MongoDB URI. This can help improve security and make it easier to change these values without modifying the code.
Wrap the entire file in a class: Consider creating a class (e.g., DatabaseManager) to wrap all the functions in your database.js file. This can help you better organize your code, create instances of the class if needed, and make it more maintainable.
Use async/await consistently: Make sure to use async/await consistently in your code. In some places, you're using .then() with async/await, which can make the code harder to read.
Add error handling: Add proper error handling for each function that interacts with the database. This can help you handle errors gracefully and provide more informative feedback to users or developers.
Modularize your code: Consider splitting the code into multiple files based on functionality. For example, you could have a separate file for user-related functions and another for settings-related functions.
Add comments and documentation: Write comments and documentation to describe the functionality of your code. This can help other developers understand your code better and make it easier for you to maintain your code in the future.
Here's an example of how you could wrap the code in a class and use environment variables:
*/

// import { MongoClient } from 'mongodb';

// class DatabaseManager {
//   constructor() {
//     this.DB_COLLECTION_NAME = 'settings';
//     this.DB_DATABASE_NAME = 'AnimalHouseTapout';
//     this.DB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/AnimalHouseTapout";
//     this.client = new MongoClient(this.DB_URI, { useNewUrlParser: true });
//     this.db = null;
//   }

//   async connectToMongoDB() {
//     // ...
//   }

//   async closeMongoDBConnection() {
//     // ...
//   }

//   async setValue(name, value) {
//     // ...
//   }

//   async getValue(name) {
//     // ...
//   }

//   async getUsersWithUnit() {
//     // ...
//   }

//   async addUser(user_chat_id, unit) {
//     // ...
//   }

//   async userExists(telegram_chat_id) {
//     // ...
//   }

//   async getUserUnit(telegram_chat_id) {
//     // ...
//   }

//   async updateUserUnit(user_chat_id, unit) {
//     // ...
//   }

//   async getAllUsers() {
//     // ...
//   }
// }

// export default new DatabaseManager();


