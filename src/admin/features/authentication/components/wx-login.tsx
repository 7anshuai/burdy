import React, { FC } from 'react';

import {
    DefaultButton
} from '@fluentui/react';

export interface Props {
    className: string;
    useType?: string; // 可选 init, login, 为空默认为login
}

const WxLogin: FC<Props> = (props: Props) => {
    const wxLogin = () => {
        const query = new URLSearchParams();
        query.append('appid', process.env.PUBLIC_WXAPPID);
        query.append('redirect_uri', process.env.PUBLIC_HOST + '/api/weixin/login');
        query.append('response_type', 'code');
        query.append('scope', 'snsapi_login');
        query.append('state', props.useType);
        const wxURL = `https://open.weixin.qq.com/connect/qrconnect?${query.toString()}`;
        window.location.href = wxURL
    }

    const wxLoginMock = () => {
        const query = new URLSearchParams();
        query.append('wxid', '');
        query.append('state', props.useType);
        window.location.href = "/api/weixin/login?" + query.toString()
    }


    return <DefaultButton className={props.className} onClick={() => { wxLoginMock() }}>微信登录 </DefaultButton>;
};

export default WxLogin;
