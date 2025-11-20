'use client';
import React, { useState, useEffect, useCallback, useImperativeHandle } from 'react';
import * as WheelPickerPrimitive from '@ncdai/react-wheel-picker';
import '@ncdai/react-wheel-picker/style.css';
import { AnimatePresence, motion } from 'framer-motion';
import { ModalOverlay } from './modal-overlay';
import { useAppContext } from '@/context/app-context';
import { useIntl } from 'react-intl';
import HalomotButton from '@/components/ui/halomot-button';
import { GlobeIcon } from './ui/globe-icon';

export interface LanguageSelectorHandle {
  open: () => void;
  close: () => void;
}

interface LanguageSelectorProps {
  onClose?: () => void;
}

const ANIMATION_DURATION = 0.3;

const LANGUAGES = [
  { code: 'en', label: 'English', applyText: 'Apply' },
  { code: 'he', label: 'עברית', applyText: 'החל' },
  { code: 'it', label: 'Italiano', applyText: 'Applica' },
  { code: 'es', label: 'Spanish', applyText: 'Aplicar' },
];

function WheelPicker({ classNames, ...props }: React.ComponentProps<typeof WheelPickerPrimitive.WheelPicker>) {
  return (
    <WheelPickerPrimitive.WheelPicker
      classNames={{
        optionItem: 'text-muted-foreground',
        highlightWrapper: 'bg-[var(--language-selector-center-line-bg,#39bdff)] text-[var(--language-selector-center-line-text,#00ff00)]',
        ...classNames,
      }}
      {...props}
    />
  );
}

export const LanguageSelector = React.forwardRef<LanguageSelectorHandle, LanguageSelectorProps>(
  function LanguageSelector({ onClose }, ref) {
    const { locale, setLocale, dir } = useAppContext();
    const intl = useIntl();
    const [open, setOpen] = useState(false);
    const [tempSelectedValue, setTempSelectedValue] = useState(locale);
    const isRTL = dir === 'rtl';

    useImperativeHandle(ref, () => ({
      open: () => setOpen(true),
      close: () => setOpen(false),
    }));

    useEffect(() => {
      setTempSelectedValue(locale);
    }, [locale]);

    const handleValueChange = useCallback((value: string) => {
      setTempSelectedValue(value);
    }, []);

    const handleApply = async () => {
      if (tempSelectedValue !== locale) {
        await new Promise((resolve) => setTimeout(resolve, 30));
        setLocale(tempSelectedValue);
      }
      setOpen(false);
      onClose?.();
    };

    const handleClose = () => {
      setOpen(false);
      onClose?.();
    };

    const applyButtonText =
      LANGUAGES.find((l) => l.code === tempSelectedValue)?.applyText || intl.formatMessage({ id: 'settings.apply' });

    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="group h-10 w-10 inline-flex items-center justify-center rounded-md transition-colors duration-300 ease-in-out hover:bg-[hsl(var(--accent))]"
          aria-label={intl.formatMessage({ id: 'settings.language' })}
          type="button"
        >
          <GlobeIcon
            size={22}
            className="text-[hsl(var(--foreground))] transition-colors duration-300 ease-in-out group-hover:text-[hsl(var(--background))]"
            style={{ transform: isRTL ? 'scaleX(-1)' : 'scaleX(1)' }}
          />
        </button>
        <AnimatePresence>
          {open && (
            <ModalOverlay onClose={handleClose}>
              <motion.div
                key="language-selector"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: ANIMATION_DURATION, ease: 'easeInOut' }}
                tabIndex={-1}
                onClick={(e) => e.stopPropagation()}
                className="relative rounded-lg shadow-xl p-4 md:p-6 min-w-[240px] max-w-[90vw] border flex flex-col items-center outline-none"
                style={{
                  backgroundColor: 'hsl(var(--background))',
                  borderColor: 'hsl(var(--border))',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0,0,0,0.1)',
                  '--language-selector-center-line-bg': 'hsl(var(--ring))',
                  '--language-selector-center-line-text': 'hsl(var(--background))',
                } as React.CSSProperties}
              >
                <span className="mb-4 font-semibold text-[20px]">Language</span>
                <div
                  className="w-full rounded-md mb-4 md:mb-7 overflow-hidden flex justify-center"
                  style={{ backgroundColor: 'hsl(var(--card))', border: `1px solid hsl(var(--border))` }}
                >
                  <WheelPicker
                    options={LANGUAGES.map((l) => ({ label: l.label, value: l.code }))}
                    value={tempSelectedValue}
                    onValueChange={handleValueChange}
                  />
                </div>
                <HalomotButton
                  onClick={handleApply}
                  fillWidth={true}
                  inscription={applyButtonText}
                  gradient="linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))"
                  backgroundColor="hsl(var(--background))"
                  hoverTextColor="hsl(var(--foreground))"
                  textColor="hsl(var(--secondary-foreground))"
                  fontSize="1rem"
                  height="54px"
                />
              </motion.div>
            </ModalOverlay>
          )}
        </AnimatePresence>
      </>
    );
  }
);
