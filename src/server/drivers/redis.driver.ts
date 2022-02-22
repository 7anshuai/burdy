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
        const client = await redis.createClient({
            url: process.env.REDIS_URL,
        });
        redidsDriver.client = client as any;
        console.log(chalk.green(`Connection to redis ${process.env.REDIS_URL}`));
    } catch (e) {
        console.log(e);
        console.error(chalk.red(`Error! Connection to redis ${process.env.REDIS_URL}`));
        process.exit(1);
    }
};

export { redidsDriver, connectRedisDriver };
