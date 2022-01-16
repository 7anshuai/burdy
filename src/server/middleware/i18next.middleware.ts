import i18next from 'i18next';
import middleware from 'i18next-http-middleware';
import en from '@shared/locales/en/translation.json';
import zh from '@shared/locales/zh/translation.json';

const translationsJson = {
  en: {
    translation: en,
  },
  zh: {
    translation: zh,
  },
};

i18next
  .use(middleware.LanguageDetector).init({
    debug: process.env.NODE_ENV !== 'production',
    fallbackLng: "en",
    resources: translationsJson
  });

const i18nextMiddleware = middleware.handle(i18next);

export default i18nextMiddleware;