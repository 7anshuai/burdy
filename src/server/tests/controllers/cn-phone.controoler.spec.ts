import chai from 'chai';
import chaiHttp from 'chai-http';
import express from 'express';
import cnPhoneCtrl from '@server/controllers/cn-phone.controller';
import { connectRedisDriver, redidsDriver } from '@server/drivers/redis.driver';
import { connectDatabaseDriver } from '@server/drivers/database.driver';
import * as dotenv from "dotenv-flow"
import "@server/listeners/model.listener"
//测试命令 npm test -- src/server/tests/controller/cn-phone.controoler.spec.ts

chai.use(chaiHttp);
chai.should();
const app = express();
var requester: ChaiHttp.Agent
before(async () => {
    app.use(express.json({ limit: process.env.REQ_LIMIT }));
    app.use(cnPhoneCtrl);
    dotenv.config()
    await connectRedisDriver()
    await connectDatabaseDriver()

    redidsDriver.client.flushAll()
    requester = chai.request(app).keepOpen()
})

after(async () => {
    await requester.close()
})

describe("手机登录测试", () => {
    describe("发送验证码", function () {
        it("校验手机号码", async function () {
            const res = await requester.post('/phone/send_sms')
                .send({ phone: "1334567890" })
            res.should.have.status(200);
            res.body.should.have.property('code').and.equal(500001);
        });
        it("判断发送频率", async function () {
            this.timeout(35000)
            // 第一次允许
            const resp1 = await requester.post('/phone/send_sms')
                .send({ phone: "13345678901" })

            resp1.should.have.status(200);
            resp1.body.should.have.property('code').and.equal(0);
            console.log(resp1.body);
            // 第二次马上发，不允许发送
            const resp2 = await requester.post('/phone/send_sms').send({ phone: "13345678901" });
            resp2.should.have.status(200);
            resp2.body.should.have.property('code').and.equal(500003);
            console.log(resp2.body);
            // // 在连发三次不同号码
            for (let i = 0; i < 4; i++) {
                // 等待2秒在发送
                await new Promise((resolve) => {
                    setTimeout(() => {
                        console.log("等待2秒。。。")
                        resolve(0)
                    }, 2000)
                })
                const resp3 = await requester.post('/phone/send_sms')
                    .send({ phone: "1334567891" + i });
                resp3.should.have.status(200);
                resp3.body.should.have.property('code').and.equal(0);
                console.log(resp3.body);
            }
            console.log("等待2秒。。。")
            await new Promise((resolve) => {
                setTimeout(() => {
                    resolve(0)
                }, 2000)
            })
            const resp4 = await requester.post('/phone/send_sms')
                .send({ phone: "1334567891" + 5 })
            resp4.should.have.status(200);
            resp4.body.should.have.property('code').and.equal(500002);

        });
    });
    describe.only("验证码校验", function () {
        // 需要先修改redis中的验证码在最验证
        const phone = "13345678901"
        it("发送验证码", async function () {
            const resp1 = await requester.post('/phone/send_sms')
                .send({ phone: phone })
            resp1.should.have.status(200);
            resp1.body.should.have.property('code').and.equal(0);
        })
        const code = "123456"
        it("设置模拟验证码", async function () {
            redidsDriver.client.set("smscode:verity:" + phone, code, { EX: 60 * 5 });
        })
        const state = "user" //验证类型，user：用户注册 admin: 管理员登录 init: 初始化管理元
        it("校验验证码-错误的验证码", async function () {
            const resp1 = await requester.post('/phone/login').query({ state: state })
                .send({ phone: phone, code: "500006" })
            resp1.should.have.status(200);
            resp1.body.should.have.property('code').and.equal(500006);
        })
        it("校验验证码-多次校验错误", async function () {
            for (let i = 0; i < 5; i++) {
                const resp1 = await requester.post('/phone/login').query({ state: state })
                    .send({ phone: phone, code: "500006" })
                resp1.should.have.status(200);
                if (i === 4) {
                    resp1.body.should.have.property('code').and.equal(500005);
                } else {
                    resp1.body.should.have.property('code').and.equal(500006);
                }
            }
        })
        it("模拟等待10分钟后再次校验", async function () {
            const ipKey = `ip:verityrate:${'::ffff:127.0.0.1'}:${phone}`;
            await redidsDriver.client.del(ipKey);
        })
        it("校验验证码-校验正确", async function () {
            this.timeout(15000)
            const resp1 = await requester.post('/phone/login').query({ state: state }).send({ phone: phone, code: code })
            resp1.should.have.status(200);
            resp1.body.should.have.property('code').and.equal(0);
            resp1.header.should.have.property('set-cookie').and.not.equal("");
            resp1.header.should.have.property('set-cookie');
            console.log(resp1.header['set-cookie'])
        })
        it("校验验证码-校验正确后再次校验允许", async function () {
            const resp1 = await requester.post('/phone/login').query({ state: state })
                .send({ phone: phone, code: "500006" })
            resp1.should.have.status(200);
            resp1.body.should.have.property('code').and.equal(500006);
        })
    })
})



