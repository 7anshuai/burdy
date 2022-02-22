import chalk from 'chalk';

import * as redis from 'redis'

interface IRedisDriver {
    client: redis.RedisClientType;
}
const redidsDriver: IRedisDriver = {
    client: undefined,
};

const connectRedisDriver = async () => {
    try {
        if (!process.env.REDIS_URL) {
            throw new Error('REDIS_URL is not defined')
        }
        const client = redis.createClient({
            url: process.env.REDIS_URL,
        });
        client.on('error', (err) => console.log('Redis Client Error', err));
        client.on('ready', () => console.log(console.log(chalk.green(`Connection to redis ${process.env.REDIS_URL}`))));
        await client.connect();
        redidsDriver.client = client as any;
        const v = await redidsDriver.client.get("*")
    } catch (e) {
        console.log(e);
        console.error(chalk.red(`Error! Connection to redis ${process.env.REDIS_URL}`));
        process.exit(1);
    }
};

export { redidsDriver, connectRedisDriver };
