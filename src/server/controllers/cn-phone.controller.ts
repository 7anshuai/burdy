import express, { response } from 'express';
import { getRepository } from 'typeorm';

import { accountInint, createCNUser, getWechatUserInfo, WxResponse } from "@server/common/account";
import { getExpires, sign } from '@server/common/jwt';
import User from '@server/models/user.model';
import UserSession from '@server/models/user-session.model';
import { UserStatus } from '@shared/interfaces/model';

const app = express();

app.post(
    '/phone/send_sms',
    async (req, res) => {
        const body = req.body;
        console.log(body);
        const phone = body.phone;
        if (!phone || /^1[3|4|5|6|7|8|9][0-9]\d{8}$/.test(phone) === false) {
            res.send({
                code: 500001,
                msg: "手机号格式错误"
            })
            return
        }
        // ip + sessionId + phone 限制发送次数

        // 模拟发送成功
    }
)

app.post(
    '/phone/login',
    async (req, res) => {
        const body = req.body;
        console.log(body);
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