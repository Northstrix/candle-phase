"use client";

import { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { IntlProvider } from 'react-intl';
import messages_en from '@/lang/en.json';
import messages_he from '@/lang/he.json';
import messages_it from '@/lang/it.json';
import messages_es from '@/lang/es.json';

export type Locale = 'en' | 'he' | 'it' | 'es';
type Dir = 'ltr' | 'rtl';

interface AppContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  dir: Dir;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const messages = {
    en: messages_en,
    he: messages_he,
    it: messages_it,
    es: messages_es
};

export function AppWrapper({ children }: { children: ReactNode }) {
    const [locale, setLocale] = useState<Locale>('en');

    const dir = useMemo(() => (locale === 'he' ? 'rtl' : 'ltr'), [locale]);

    const contextValue = {
        locale,
        setLocale,
        dir
    };

    return (
        <AppContext.Provider value={contextValue}>
            <IntlProvider locale={locale} messages={messages[locale]}>
                {children}
            </IntlProvider>
        </AppContext.Provider>
    );
}

export function useAppContext() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppWrapper');
    }
    return context;
}
