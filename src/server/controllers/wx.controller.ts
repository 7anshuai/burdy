import express, { response } from 'express';
import { DeepPartial, getManager, getRepository } from 'typeorm';

import { accountInint, createWechatUser, getWechatUserInfo, WxResponse } from "@server/common/account";
import asyncMiddleware from '@server/middleware/async.middleware';
import { getExpires, sign } from '@server/common/jwt';
import User from '@server/models/user.model';
import UserSession from '@server/models/user-session.model';
import { UserStatus } from '@shared/interfaces/model';
import BadRequestError from '@server/errors/bad-request-error';

const app = express();

app.get(
    '/weixin/login',
    async (req, res, next) => {
        console.log(req.query);
        // 初始化
        const state = req.query.state;
        const code = req.query.code;
        var wxRespone: WxResponse;
        if (process.env.NODE_ENV === "development") {
            if (req.query.test === '1') {
                wxRespone = {
                    code: 11,
                    msg: '111'
                }
            } else {
                const wxid = req.query.wxid ? req.query.wxid + "" : "test";
                wxRespone = {
                    code: 0,
                    msg: '',
                    user: {
                        wxid: wxid,
                        wxUnionId: wxid,
                        nickname: "test",
                        avatar: "test"
                    }
                }
            }
        } else {
            wxRespone = await getWechatUserInfo(code + "");
        }
        if (wxRespone.code != 0) {
            const q = new URLSearchParams();
            q.append("error", JSON.stringify(wxRespone));
            var redirectURI = "/admin/login"
            if (state === "init") {
                redirectURI = "/admin/init"
            }
            res.redirect(redirectURI + "?" + q.toString(), 302);
            res.end();
            // 登录错误
            return
        }


        const wxUserInfo = wxRespone.user;
        console.log(wxUserInfo)
        if (state === "init") {
            const token = accountInint(wxUserInfo);
            res.cookie('token', token, {
                maxAge: getExpires().getTime() * 1000,
                httpOnly: true,
            });
            // 302 跳转首页
            res.redirect("/admin", 302);
            res.end();
            return
        }
        // 用户是否注册 没有注册 默认注册一个
        const userRepository = getRepository(User);
        const userSessionRepository = getRepository(UserSession);

        const user = await userRepository.createQueryBuilder('user')
            .addSelect('user.password')
            .leftJoinAndSelect('user.groups', 'groups')
            .leftJoinAndSelect('user.meta', 'meta')
            .where('user.wxid = :wxid', { wxid: wxUserInfo.wxid })
            .getOne();
        //  如果用户不存在，那么注册个新用户
        if (!user || user.id === 0) {
            const token = await createWechatUser(wxUserInfo);
            res.cookie('token', token, {
                maxAge: getExpires().getTime() * 1000,
                httpOnly: true,
            });
            // 302 跳转首页
            res.redirect("/admin", 302);
            res.end();
            return
        }

        // 查看用户状态
        if (user.status !== UserStatus.ACTIVE) {
            const q = new URLSearchParams();
            q.append("error", JSON.stringify(wxRespone));
            res.redirect("/admin/login?" + q.toString(), 302);
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
        res.redirect("/admin", 302);
        res.end();
        return
    }
);

export default app