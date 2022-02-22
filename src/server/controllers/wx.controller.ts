import express, { response } from 'express';
import { getRepository } from 'typeorm';

import asyncMiddleware from '@server/middleware/async.middleware';
import { accountInint, createCNUser, getWechatUserInfo, WxResponse } from "@server/common/account";
import { getExpires, sign } from '@server/common/jwt';
import User from '@server/models/user.model';
import UserSession from '@server/models/user-session.model';
import { UserStatus } from '@shared/interfaces/model';

const app = express();

app.get(
    '/weixin/login',
    asyncMiddleware(async (req, res) => {
        // 初始化
        const state = req.query.state;
        const code = req.query.code;
        var wxRespone: WxResponse = await getWechatUserInfo(code + "");

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

        if (wxRespone.code != 0) {
            const q = new URLSearchParams();
            q.append("error", JSON.stringify(wxRespone));
            res.redirect(failURI + "?" + q.toString(), 302);
            res.end();
            // 登录错误
            return
        }
        const wxUserInfo = wxRespone.user;
        if (state === "init") {
            const token = accountInint(wxUserInfo);
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
            .addSelect('user.wxid')
            .leftJoinAndSelect('user.groups', 'groups')
            .leftJoinAndSelect('user.meta', 'meta')
            .where('user.wxid = :wxid', { wxid: wxUserInfo.wxid })
            .getOne();
        //  如果用户不存在，那么注册个新用户
        if (!user || user.id === 0) {
            const token = await createCNUser(wxUserInfo);
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
    })
);

export default app