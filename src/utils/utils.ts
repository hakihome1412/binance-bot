import i18n from 'i18n';

const { __ } = i18n;

export const trans = (key: string, lang?: string, params?: any) => {
    return __(
        {
            phrase: key,
            locale: lang || 'vi'
        },
        {
            ...params
        }
    );
}