'use client';

import { useAppContext } from '@/context/app-context';
import { GithubIcon } from './ui/github-icon';
import { Card } from './ui/card';
import { useIntl } from 'react-intl';
import { LanguageSelector } from './language-selector';


export function HeaderCard() {
  const { dir } = useAppContext();
  const intl = useIntl();
  const isRTL = dir === 'rtl';

  return (
    <Card>
      <div
        className="container flex h-14 max-w-screen-2xl px-3 items-center justify-between"

      >
          <a
            href="/"
            className="flex items-center gap-[10px] transition-colors duration-300 ease-in-out group"
          >
            <img
              src="/logo.webp"
              alt="logo"
              width={32}
              height={32}
              className="rounded-md"
            />
            <span className="font-bold font-headline sm:inline-block transition-colors duration-300 ease-in-out text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--accent))]">
            {intl.formatMessage({ id: 'app.title' })}
            </span>
          </a>

        <div
          className="flex items-center"
        >
          <a
            href="https://github.com/Northstrix/candle-phase"
            target="_blank"
            rel="noopener noreferrer"
            className="group h-10 w-10 inline-flex items-center justify-center rounded-md transition-colors duration-300 ease-in-out hover:bg-[hsl(var(--accent))]"
          >
            <GithubIcon
              size={20}
              className="text-[hsl(var(--foreground))] transition-colors duration-300 ease-in-out group-hover:text-[hsl(var(--background))]"
            />
          </a>

         <LanguageSelector />
        </div>
      </div>
    </Card>
  );
}
