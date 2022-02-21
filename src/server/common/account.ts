
import { getManager, getRepository, DeepPartial } from 'typeorm';
import SiteSettings from '@server/models/site-settings.model';
import User from '@server/models/user.model';
import Group from '@server/models/group.model';
import UserSession from '@server/models/user-session.model';
import { UserStatus } from '@shared/interfaces/model';
import { getEnhancedRepository } from '@server/common/orm-helpers';
import AccessToken from '@server/models/access-token';
import { nanoid } from 'nanoid';
import { getExpires, sign } from '@server/common/jwt';
import axios from 'axios';


// 新增微信用户
export async function createCNUser(userData: DeepPartial<User>): Promise<string> {
    const userSessionRepository = getRepository(UserSession);
    const userRepository = getEnhancedRepository(User);
    let token;
    await getManager().transaction(async (entityManager) => {
        let user = await userRepository.create({
            ...userData,
            status: UserStatus.ACTIVE,
        });

        user = await entityManager.save(user);
        const userSession = await entityManager.save(
            userSessionRepository.create({
                user,
                expiresAt: getExpires(),
            })
        );
        token = sign({
            sessionId: userSession.id,
            userId: user.id,
        });
    });
    return token;
}


// 微信账户初始化 返回 签名token
export async function accountInint(userData: DeepPartial<User>): Promise<string> {
    const siteSettingsRepository = getRepository(SiteSettings);
    const userRepository = getEnhancedRepository(User);
    const groupRepository = getRepository(Group);
    const userSessionRepository = getRepository(UserSession);

    const [initiated, userCount] = await Promise.all([
        siteSettingsRepository.findOne({ where: { key: 'initiated' } }),
        userRepository.count(),
    ]);
    console.log(initiated, userCount);
    if (initiated || userCount > 0) {
        return ""
    }

    const adminGroup = await groupRepository.findOne({
        where: { name: 'Admin' },
    });

    let user = await userRepository.create({
        ...userData,
        status: UserStatus.ACTIVE,
        groups: [adminGroup],
    });


    let siteSettings = siteSettingsRepository.create([
        { key: 'initiated', value: true },
    ]);
    const accessTokenRepository = getEnhancedRepository(AccessToken);
    await accessTokenRepository.save({
        name: "", // req?.body?.name
        token: nanoid()
    });
    let token;
    await getManager().transaction(async (entityManager) => {
        user = await entityManager.save(user);
        siteSettings = await entityManager.save(siteSettings);
        const userSession = await entityManager.save(
            userSessionRepository.create({
                user,
                expiresAt: getExpires(),
            })
        );
        token = sign({
            sessionId: userSession.id,
            userId: user.id,
        });
    });
    return token;
}


export interface WxResponse {
    code: number;
    msg: string;
    user?: DeepPartial<User>
}

//通过微信的回调, 获取微信用户信息
export async function getWechatUserInfo(code: string): Promise<WxResponse> {
    if (code == null || code == "") {
        return { code: 400001, msg: "获取微信授权码失败" };
    }
    const appid = process.env.WX_APPID;
    const secret = process.env.WX_SECRET;

    const query = new URLSearchParams();
    query.append('appid', appid);
    query.append('secret', secret);
    query.append('code', code + "");
    query.append('grant_type', 'authorization_code');
    const resp = await axios.get('https://api.weixin.qq.com/sns/oauth2/access_token?' + query.toString())
    if (resp.status != 200) {
        return { code: 400002, msg: "获取微信授权码失败: rc:" + resp.status }
    }
    const data = resp.data;
    if (data.errcode && data.errcode != 0) {
        return { code: 400003, msg: `获取微信授权码失败:${data.errcode}:${data.errmsg}` }
    }
    const { access_token, openid, unionid } = data;
    // 请求用户基本信息
    const userInfoQuery = new URLSearchParams();
    userInfoQuery.append('access_token', access_token);
    userInfoQuery.append('openid', openid);
    const userInfoResp = await axios.get('https://api.weixin.qq.com/sns/userinfo?' + userInfoQuery.toString())
    if (userInfoResp.status != 200) {
        return { code: 400005, msg: "获取微信基本信息失败: rc:" + resp.status }
    }
    const userInfo = userInfoResp.data;
    if (userInfo.errcode && userInfo.errcode != 0) {
        return { code: 400006, msg: `获取微信基本信息失败:${userInfo.errcode}:${userInfo.errmsg}` }
    }
    const { nickname, headimgurl } = userInfo;
    const wxRespUserInfo = {
        wxid: openid,
        wxUnionId: unionid,
        nickname: nickname,
        avatar: headimgurl,
    }
    return { code: 0, user: wxRespUserInfo, msg: "" };
}
