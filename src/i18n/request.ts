import {getRequestConfig} from 'next-intl/server';
 
export default getRequestConfig(async ({requestLocale}) => {
  // This typically comes from a routing middleware
  let locale = await requestLocale;
 
  // Ensure that a valid locale is used
  if (!locale || !['en', 'hi'].includes(locale)) {
    locale = 'en';
  }
 
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
