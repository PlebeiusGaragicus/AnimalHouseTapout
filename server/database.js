import { MongoClient } from 'mongodb';

import config from './config.js';



export const client = new MongoClient(config.DB_URI, { useNewUrlParser: true });
export let db = null;



export async function connectToMongoDB() {
    await client.connect();
    console.log("Connected to MongoDB");
    db = client.db(config.DB_DATABASE_NAME);
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
        const collection = db.collection(config.DB_COLLECTION_NAME);
        await collection.updateOne({ name: name }, {
            $set: { value: value }
        }, { upsert: true });
    } catch (error) {
        console.error(error);
    }
}


export async function getValue(name) {
    try {
        const collection = db.collection(config.DB_COLLECTION_NAME);
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



// export async function addUser(user_chat_id, unit) {
//     try {
//         const collection = db.collection('users');
//         const newUser = {
//             user_chat_id: user_chat_id,
//             unit: unit,
//         };

//         const result = await collection.insertOne(newUser);

//         if (result.insertedCount !== 1) {
// BUG!!!! I added myself but it says it failed to insert the new user...
//             console.error('Failed to insert the new user');
//             return null;
//         }

//         return newUser;

//     } catch (error) {
//         console.error(error);
//     }
// }

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
