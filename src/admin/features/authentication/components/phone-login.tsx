import React, { FC } from 'react';

import {
    makeStyles,
    MessageBar,
    MessageBarType,
    PrimaryButton,
    Stack,
    Text,
    DefaultButton
} from '@fluentui/react';
import Validators from '@shared/validators';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { ControlledTextField } from '@admin/components/rhf-components';
import i18next from 'i18next';

import { useTranslation } from 'react-i18next';
export interface Props {
    useType?: string; // 可选 init, login, 为空默认为login
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

    const styles = useStyles();

    const { control, handleSubmit } = useForm({
        resolver: yupResolver(formSchema),
        defaultValues: {
            phone: '',
            smsCode: '',
        },
    });
    const submit = handleSubmit((data) => {

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
                            <DefaultButton text="发送短信验证码" />
                        </Stack.Item>
                    </Stack>
                </Stack.Item>
                <Stack.Item>
                    <PrimaryButton
                        className={styles.button}
                        type='submit'
                        data-cy="welcome-submit"
                    >
                        {t('auth.login')}
                    </PrimaryButton>
                </Stack.Item>
            </Stack>
        </form>
    )
};

export default PhoneLogin;