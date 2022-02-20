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
        console.log(process.env.NODE_ENV, "999999");
        if (process.env.NODE_ENV === "development") {
            if (req.query.test === '1') {
                wxRespone = {
                    code: 11,
                    msg: '111'
                }
            } else {
                wxRespone = {
                    code: 0,
                    msg: '',
                    user: {
                        wxid: "test",
                        wxUnionId: "test",
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
            if (state === "init") {
                res.redirect("/admin/init?" + q.toString(), 302);
                console.log(1111)
            }
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

        if (user.status !== UserStatus.ACTIVE) {
            throw new BadRequestError('inactive_user');
        }

        if (user.id === 0) {
            const token = createWechatUser(wxUserInfo);
            res.cookie('token', token, {
                maxAge: getExpires().getTime() * 1000,
                httpOnly: true,
            });
            // 302 跳转首页
            // 302 跳转首页
            res.redirect("/admin", 302);
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