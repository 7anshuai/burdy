import React, { useEffect, useState } from 'react';
import WxLoginBtn from '@admin/features/authentication/components/wx-login';
import PhoneLoginForm from '@admin/features/authentication/components/phone-login';
import classNames from 'classnames';
import {
  makeStyles,
  MessageBar,
  MessageBarType,
  Stack,
  Text,
} from '@fluentui/react';
import { useTranslation } from 'react-i18next';
import logo from '../../../assets/logo.svg';

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


const LogIn: React.FC<any> = () => {
  const styles = useStyles();
  const { t } = useTranslation();

  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {

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
          <Stack.Item>
            <PhoneLoginForm />
          </Stack.Item>
          <Stack.Item>
            <WxLoginBtn className={styles.button} useType='admin' />
          </Stack.Item>
        </Stack>
      </div>
    </div>
  );
};

export default LogIn;
