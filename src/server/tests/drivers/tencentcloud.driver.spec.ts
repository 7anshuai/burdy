import chai from 'chai';
import * as dotenv from "dotenv-flow"
import { sendSMS } from "@server/drivers/tencentcloud.driver"
//测试命令 npm test -- src/server/tests/drivers/tencentcloud.driver.spec.ts

chai.should();
before(async () => {
    dotenv.config()
})

describe("腾讯云短信测试", () => {
    it("发送短信", async () => {
        try {
            let data = await sendSMS("13216491106", "123456")
            console.log(data);
        } catch (e) {
            console.log(e)
        }
    })
})
