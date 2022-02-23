import React, { FC, useState } from 'react';

import {
    makeStyles,
    PrimaryButton,
    Stack,
    DefaultButton
} from '@fluentui/react';
import Validators from '@shared/validators';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { ControlledTextField } from '@admin/components/rhf-components';
import apiAxios from '@admin/helpers/api';
import { useTranslation } from 'react-i18next';
export interface Props {
    useType: string; // 可选 init, login, user 为空默认为login
    onError: (data: { code: number, message: string }) => void;
}
const useStyles = makeStyles({
    button: {
        marginTop: '1rem',
        width: '100%',
    }
});


const formSchema = yup.object({
    phone: Validators.phone(),
});


const PhoneLogin: FC<Props> = (props: Props) => {
    const defaultBtnText = "发送短信验证码"
    const [sendBtnText, setSendBtnText] = useState(defaultBtnText)
    const [enableSendBtn, setEnableSendBtn] = useState(true)
    const requestSendSMSCodeToPhone = async () => {
        setEnableSendBtn(false)
        try {
            await formSchema.validate({ phone: control._formValues.phone })
        } catch (e) {
            setEnableSendBtn(true)
            return
        }
        try {
            const res = await apiAxios.post('/phone/send_sms', { phone: control._formValues.phone })
            if (res.data.code == 0) {
                let counter = 60
                setSendBtnText((counter--) + "秒后重发")
                let timer = setInterval(() => {
                    if (counter == 0) {
                        clearInterval(timer)
                        setEnableSendBtn(true)
                        setSendBtnText(defaultBtnText)
                    } else {
                        setSendBtnText((counter--) + "秒后重发")
                    }
                }, 1000)
            } else {
                setEnableSendBtn(true)
            }
            props.onError({ code: res.data.code, message: res.data.msg })
        } catch (e) {
            console.log(e)
            props.onError({ code: 500, message: "服务器错误!" })
        }


    }

    const styles = useStyles();
    const { control, handleSubmit } = useForm({
        resolver: yupResolver(formSchema),
        defaultValues: {
            phone: '',
            smsCode: '',
        },
    });
    const [enableSubmit, setEnableSubmit] = useState(true)
    const submit = handleSubmit(async (data) => {
        setEnableSubmit(false)
        try {
            const res = await apiAxios.post(`/phone/login?state=${props.useType}`, data)
            if (res.data.code != 0) {
                props.onError({ code: res.data.code, message: res.data.msg })
            } else {
                location.href = res.data.data.url
            }

        } catch (e) {
            console.log(e)
            props.onError({ code: 500, message: "服务器错误!" })
        }
        setEnableSubmit(true)
    });

    const { t } = useTranslation();

    return (
        <form onSubmit={submit}>
            <Stack tokens={{ childrenGap: 8 }}>
                <ControlledTextField
                    control={control}
                    name='phone'
                    type='text'
                    placeholder={t('user.phone')}
                    data-cy="welcome-phone"
                    underlined
                />
                <Stack.Item>
                    <Stack horizontal horizontalAlign="space-between" >
                        <Stack.Item disableShrink grow>
                            <ControlledTextField
                                control={control}
                                name='smsCode'
                                type='smsCode'
                                placeholder={t('user.smsCode')}
                                data-cy="welcome-smsCode"
                                underlined
                            />
                        </Stack.Item>
                        <Stack.Item>
                            <DefaultButton text={sendBtnText} disabled={!enableSendBtn} onClick={() => { requestSendSMSCodeToPhone() }} />
                        </Stack.Item>
                    </Stack>
                </Stack.Item>
                <Stack.Item>
                    <PrimaryButton
                        className={styles.button}
                        type='submit'
                        data-cy="welcome-submit"
                        disabled={!enableSubmit}
                    >
                        {t('auth.login')}
                    </PrimaryButton>
                </Stack.Item>
            </Stack>
        </form>
    )
};

export default PhoneLogin;