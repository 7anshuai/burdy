import React, { useEffect, useState } from 'react';
import { useAuth } from '@admin/features/authentication/context/auth.context';
import WxLoginBtn from '@admin/features/authentication/components/wx-login';

import { Link } from '@admin/components/links';
import classNames from 'classnames';
import {
  makeStyles,
  MessageBar,
  MessageBarType,
  PrimaryButton,
  Stack,
  Text,
  DefaultButton
} from '@fluentui/react';
import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { yupResolver } from '@hookform/resolvers/yup';
import { ControlledTextField } from '@admin/components/rhf-components';
import logo from '../../../assets/logo.svg';
import i18next from 'i18next';

const useStyles = makeStyles({
  wrapper: {
    width: 360,
    marginLeft: 'auto !important',
    marginRight: 'auto !important',
    textAlign: 'left',
    marginBottom: '2%',
  },
  container: {
    minHeight: '100vh',
    minWidth: '100vw',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#faf9f8',
  },
  card: {
    marginBottom: '2rem',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    textAlign: 'center',
    marginBottom: '1rem !important',
  },
  button: {
    marginTop: '1rem',
    width: '100%',
  },
  alert: {
    marginBottom: '1rem !important',
    textAlign: 'center',
  },
  logo: {
    margin: '0 auto 0.5rem 0',
    display: 'block',
  },
});

const formSchema = yup.object({
  email: yup.string().email().required().label(i18next.t('auth.email')),
  password: yup.string().min(6).label(i18next.t('auth.password')),
});

const LogIn: React.FC<any> = () => {
  const styles = useStyles();
  const { t } = useTranslation();

  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');


  const { logIn } = useAuth();
  const { control, handleSubmit } = useForm({
    resolver: yupResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const submit = handleSubmit((data) => {

  });

  useEffect(() => {
    logIn.reset();

    if (location.search === "") {
      return
    }
    const query = new URLSearchParams(location.search)
    const errorMsg = query.get('error')
    if (errorMsg == "") {
      return
    }
    try {
      const errorObj = JSON.parse(errorMsg)
      if (errorObj.code > 0) {
        setShowError(true)
        setErrorMsg(`错误:${errorObj.code} ${errorObj.msg}`)
      }
    } catch (e) {
    }
  }, []);

  return (
    <div className={styles.container}>
      <div className={classNames(styles.wrapper, 'card')}>
        <img
          src={logo}
          width={36}
          height={36}
          alt={t('app.name')}
          className={styles.logo}
        />
        <Stack tokens={{ childrenGap: 8, padding: '0 0 16px' }}>
          <Text variant="xLargePlus" block>
            {t('app.name')}
          </Text>
        </Stack>
        {showError && (
          <MessageBar
            className={styles.alert}
            messageBarType={MessageBarType.error}
          >
            {errorMsg}
          </MessageBar>
        )}
        <Stack tokens={{ childrenGap: 10 }}>
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
              <Stack.Item>
                <WxLoginBtn className={styles.button} />
              </Stack.Item>
            </Stack>
          </form>
        </Stack>
      </div>
    </div>
  );
};

export default LogIn;
