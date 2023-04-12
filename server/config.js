import dotenv from 'dotenv';

dotenv.config();


export default {
    debug: process.env.DEBUG || false,
    port: process.env.PORT || 3000,
}
