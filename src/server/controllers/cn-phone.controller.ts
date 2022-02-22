import express, { response } from 'express';
import { getRepository } from 'typeorm';
import { redidsDriver } from '@server/drivers/redis.driver';

import { accountInint, createCNUser, getWechatUserInfo, WxResponse } from "@server/common/account";
import { getExpires, sign } from '@server/common/jwt';
import User from '@server/models/user.model';
import UserSession from '@server/models/user-session.model';
import { UserStatus } from '@shared/interfaces/model';

const app = express();

function makeid(length) {
    var result = '';
    var characters = '0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result;
}

// 该ip是否可以继续发送短信
async function ipCanSend(ip: string): Promise<boolean> {
    if (ip == "") {
        return true
    }
    // ip的发送频繁程度
    const ipKey = `ip:sendrate:${ip}`;
    const ipRate = await redidsDriver.client.get(ipKey);
    console.log("ip rate:", ipRate)
    // 查看已发送次数 30分钟内不能超过N次
    if (ipRate && ~~ipRate > 5) {
        return false
    }
    if (!ipRate) {
        await redidsDriver.client.set(ipKey, 0, { EX: 30 * 60 });
    }
    await redidsDriver.client.incr(ipKey);
    return true;
}

// 短信校验成功后允许继续发送短信
async function cleanIpSendRate(ip: string) {
    const ipKey = `ip:sendrate:${ip}`;
    await redidsDriver.client.del(ipKey);
}


// 该ip+电话号码是否可以继续发送短信
async function ipPhoneCanSend(ip: string, phone: string): Promise<boolean> {
    // ip的发送频繁程度
    const ipKey = `ip_phone:sendrate:${ip}:${phone}`;
    const ipRate = await redidsDriver.client.exists(ipKey);
    // 查看已发送次数 1分钟内不能超过1次
    if (ipRate == 1) {
        return false
    }
    await redidsDriver.client.set(ipKey, 1, { EX: 60 });
    return true;
}

async function cleanIpPhoneSendRate(ip: string, phone: string) {
    const ipKey = `ip_phone:sendrate:${ip}:${phone}`;
    await redidsDriver.client.del(ipKey);
}

//  防止暴力破解
async function canVerityCode(ip: string, phone: string): Promise<boolean> {
    if (ip == "") {
        return true
    }
    // ip的电话号码的验证频繁程度
    const ipKey = `ip:verityrate:${ip}:${phone}`;
    const ipRate = await redidsDriver.client.get(ipKey);
    console.log("ip:verityrate:", ipRate)
    // 查看已发送次数 10分钟内不能超过5次
    if (ipRate && ~~ipRate > 5) {
        return false
    }
    if (!ipRate) {
        await redidsDriver.client.set(ipKey, 0, {
            EX: 10 * 60
        });
    }
    await redidsDriver.client.incr(ipKey);
    return true;
}
async function cleanVerityRate(ip: string, phone: string) {
    const ipKey = `ip:verityrate:${ip}:${phone}`;
    await redidsDriver.client.del(ipKey);
}

function isPhone(phone: string): boolean {
    return phone && /^1[3|4|5|6|7|8|9]\d{8}$/.test(phone)
}

app.post(
    '/phone/send_sms',
    async (req, res) => {
        const body = req.body;
        const phone = body.phone;
        if (!isPhone(phone)) {
            res.send({
                code: 500001,
                msg: "手机号格式错误"
            })
            return
        }
        var ips = req.headers['x-forwarded-for'] || req.socket.remoteAddress || ""
        var ip = ""
        if (typeof ips !== 'string') {
            ip = ips[0];
        }
        // 发送频率限制
        console.log(phone, ip);
        if (!await ipCanSend(ip)) {
            res.send({
                code: 500002,
                msg: "发送频率太高,30分钟后再试"
            })
            return
        }
        if (!await ipPhoneCanSend(ip, phone)) {
            res.send({
                code: 500003,
                msg: "发送频率太高,1分钟后再试"
            })
            return
        }
        // 生成随机数
        const code = makeid(4);
        console.log("随机验证码是:", code);
        // TODO: 运营商发送短信
        redidsDriver.client.set("smscode:verity:" + phone, code, { EX: 60 * 5 });
        res.send({
            code: 0,
            msg: "发送成功!",
        })
    }
)

app.post(
    '/phone/login',
    async (req, res) => {
        const body = req.body;
        const phone = body.phone;
        const code = body.code;
        if (!isPhone(phone)) {
            res.send({
                code: 500004,
                msg: "手机号格式错误"
            })
            return
        }
        var ips = req.headers['x-forwarded-for'] || req.socket.remoteAddress || ""
        var ip = ""
        if (typeof ips !== 'string') {
            ip = ips[0];
        }
        if (!await canVerityCode(ip, phone)) {
            res.send({
                code: 500005,
                msg: "验证次数太多,10分钟后再试"
            })
            return
        }
        const sendedCode = await redidsDriver.client.get("smscode:verity:" + phone);
        if (code != sendedCode) {
            res.send({
                code: 500006,
                msg: "验证码错误"
            })
            return
        }
        // 校验成功后，其他的都允许继续发送
        await cleanVerityRate(ip, phone);
        await cleanIpPhoneSendRate(ip, phone);
        await cleanIpSendRate(ip);

        // 初始化
        const state = req.query.state;

        let failURI = "";
        let successURI = "";

        switch (state) {
            case "init":
                failURI = "/admin/init"
                successURI = "/admin"
                break
            case "admin":
                failURI = "/admin/login"
                successURI = "/admin"
                break
            case "user":
                failURI = "/login"
                failURI = "/"
                break
        }
        const loginUserInfo = {
            phone: body.phone,
        };
        if (state === "init") {
            const token = accountInint(loginUserInfo);
            res.cookie('token', token, {
                maxAge: getExpires().getTime() * 1000,
                httpOnly: true,
            });
            // 302 跳转首页
            res.redirect(successURI, 302);
            res.end();
            return
        }
        // 用户是否注册 没有注册 默认注册一个
        const userRepository = getRepository(User);
        const userSessionRepository = getRepository(UserSession);

        const user = await userRepository.createQueryBuilder('user')
            .leftJoinAndSelect('user.groups', 'groups')
            .leftJoinAndSelect('user.meta', 'meta')
            .where('user.phone = :phone', { phone: body.phone })
            .getOne();
        //  如果用户不存在，那么注册个新用户
        if (!user || user.id === 0) {
            const token = await createCNUser(loginUserInfo);
            res.cookie('token', token, {
                maxAge: getExpires().getTime() * 1000,
                httpOnly: true,
            });
            // 302 跳转首页
            res.redirect(successURI, 302);
            res.end();
            return
        }

        // 查看用户状态
        if (user.status !== UserStatus.ACTIVE) {
            const q = new URLSearchParams();
            q.append("error", JSON.stringify({ code: 600001, msg: "本用户已被禁止登录" }));
            res.redirect(failURI + "?" + q.toString(), 302);
            res.end();
            return
        }

        // 写入登录cookie
        const userSession = await userSessionRepository.save({
            user,
            expiresAt: getExpires(),
        });
        const token = sign({
            sessionId: userSession.id,
            userId: user.id,
        });

        res.cookie('token', token, {
            maxAge: getExpires().getTime() * 1000,
            httpOnly: true,
        });
        // 302 跳转首页
        res.redirect(successURI, 302);
        res.end();
        return
    }
);

export default app