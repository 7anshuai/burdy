import React, { useEffect } from 'react';
import { useAuth } from '@admin/features/authentication/context/auth.context';
import {
  makeStyles,
  MessageBar,
  MessageBarType,
  PrimaryButton,
  Stack,
  Text,
  DefaultButton
} from '@fluentui/react';
import classNames from 'classnames';
import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { ControlledTextField } from '@admin/components/rhf-components';
import { yupResolver } from '@hookform/resolvers/yup';
import Validators from '@shared/validators';
import logo from '../../../assets/logo.svg';
import { useTranslation } from 'react-i18next';

const useStyles = makeStyles({
  wrapper: {
    width: 360,
    marginLeft: 'auto !important',
    marginRight: 'auto !important',
    textAlign: 'left',
    marginBottom: '2%'
  },
  container: {
    minHeight: '100vh',
    minWidth: '100vw',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#faf9f8'
  },
  card: {
    marginBottom: '2rem'
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  info: {
    textAlign: 'center',
    marginBottom: '1rem !important'
  },
  button: {
    width: '100%'
  },
  alert: {
    marginBottom: '1rem !important',
    textAlign: 'center'
  },
  logo: {
    margin: '0 auto 0.5rem 0',
    display: 'block'
  }
});

const formSchema = yup.object({
  phone: Validators.phone(),
});

const Welcome: React.FC<any> = () => {
  const styles = useStyles();
  const { t } = useTranslation();
  const { init } = useAuth();
  const { control, handleSubmit } = useForm({
    resolver: yupResolver(formSchema),
    defaultValues: {
      phone: '',
      smsCode: '',
    }
  });

  const submit = handleSubmit((data) => {
    init.execute(data);
  });

  useEffect(() => {
    init.reset();
  }, []);

  return (
    <div className={styles.container}>
      <div className={classNames(styles.wrapper, 'card')}>
        <img
          src={logo}
          width={36}
          height={36}
          alt='Burdy'
          className={styles.logo}
        />
        <Stack tokens={{ childrenGap: 8, padding: '0 0 16px' }}>
          <Text variant='xLargePlus' block>
            {t('welcome.title')}
          </Text>
          <Text variant='medium' block>
            {t('welcome.desc')}
          </Text>
        </Stack>
        {init.error?.message && (
          <MessageBar
            className={styles.alert}
            messageBarType={MessageBarType.error}
          >
            {init.error.message}
          </MessageBar>
        )}

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
                disabled={init.loading}
                data-cy="welcome-submit"
              >
                {t('auth.login')}
              </PrimaryButton>
            </Stack.Item>
            <Stack.Item>
              <DefaultButton className={styles.button}>微信登录 </DefaultButton>
            </Stack.Item>
          </Stack>
        </form>
      </div >
    </div >
  );
};

export default Welcome;
