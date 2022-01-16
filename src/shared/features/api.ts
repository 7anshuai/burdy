import express from 'express';
import errorMiddleware from '@server/middleware/error.middleware';
import i18nextMiddleware from '@server/middleware/i18next.middleware';
import * as yup from 'yup';
import Hooks from './hooks';

const launchApi = async () => {
  const app = express();
  app.use(i18nextMiddleware);
  app.request.validate = async function (schema, type = 'body') {
    const pattern = yup.object().shape(schema);
    await pattern.validate(this[type], { abortEarly: false });
  };

  await Hooks.doAction('api/init', app);
  app.use(errorMiddleware);

  return app;
};

export { launchApi };
