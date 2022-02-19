import React from 'react';
import LogIn from '@admin/features/authentication/content/login';
import RedirectAuth from '@admin/features/authentication/components/redirect-auth';
import Forgot from '@admin/features/authentication/content/forgot';
import ForgotVerify from '@admin/features/authentication/content/forgot-verify';
import { useAuth } from '@admin/features/authentication/context/auth.context';
import { Route, Switch } from 'react-router';
import CNWelcome from '@admin/features/authentication/content/cn-welcome';
import CNLogin from '@admin/features/authentication/content/cn-login';

const Authentication = () => {
  const { authStatus } = useAuth();
  return (
    <Switch>
      {authStatus === 'needs-init' && [<Route path="/init" component={CNWelcome} exact />]}
      {authStatus === 'unauthenticated' && [
        <Route path="/login" component={CNLogin} exact />,
        <Route path="/forgot" component={Forgot} exact />,
        <Route path="/forgot-verify/:token" component={ForgotVerify} exact />,
      ]}
      <Route path="*" component={RedirectAuth} />
    </Switch>
  );
};

export default Authentication;
