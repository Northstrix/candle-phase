'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useIntl } from 'react-intl';
import FloatingLabelInput from '@/components/ui/floating-label-input';
import { TimePicker } from '@/components/ui/time-picker';
import { Calendar } from '@/components/ui/calendar-custom';
import { CalculationMode, CameraState, BurnMode } from '@/app/page';
import CustomCheckbox from '@/components/ui/radio-custom';
import { ColorPicker, hsvaToHex } from '@/components/ui/color-picker';
import type { ColorPickerValue } from '@/components/ui/color-picker';
import { useState, useEffect, useCallback } from 'react';
import { Upload, Download } from 'lucide-react';
import HalomotButton from '../ui/halomot-button';
import { Separator } from '../ui/separator';
import { useAppContext } from '@/context/app-context';
import { formatDateTime } from '@/lib/utils';
import { useRef } from 'react';

interface ControlsProps {
  burnRate: number;
  initialCandleHeight: number;
  candleWidth: number;
  flameColor: string;
  waxColor: string;
  rulerColor: string;
  rulerLabelColor: string;
  startDate: Date;
  endDate: Date;
  calcMode: CalculationMode;
  burnMode: BurnMode;
  waxDensity: number;
  waxBurnRate: number;
  effectiveBurnRate: number;
  onValueChange: (values: {
    newStartDate?: Date;
    newEndDate?: Date;
    newBurnRate?: number;
    newInitialHeight?: number;
    newCandleWidth?: number;
    newWaxDensity?: number;
    newWaxBurnRate?: number;
    mode?: CalculationMode;
    burnMode?: BurnMode;
    config?: any; // For import
  }) => void;
  setFlameColor: (color: string) => void;
  setWaxColor: (color: string) => void;
  setRulerColor: (color: string) => void;
  setRulerLabelColor: (color: string) => void;
  cameraState?: CameraState;
}

export default function Controls({
  burnRate,
  initialCandleHeight,
  candleWidth,
  flameColor,
  waxColor,
  rulerColor,
  rulerLabelColor,
  startDate,
  endDate,
  calcMode,
  burnMode,
  waxDensity,
  waxBurnRate,
  effectiveBurnRate,
  onValueChange,
  setFlameColor,
  setWaxColor,
  setRulerColor,
  setRulerLabelColor,
  cameraState
}: ControlsProps) {
  const intl = useIntl();
  const { locale } = useAppContext();
  const isRTL = intl.locale === 'he';
  const [isMounted, setIsMounted] = useState(false);
  
  const [localBurnRate, setLocalBurnRate] = useState(burnRate.toString());
  const [localHeight, setLocalHeight] = useState(initialCandleHeight.toString());
  const [localWidth, setLocalWidth] = useState(candleWidth.toString());
  const [localWaxDensity, setLocalWaxDensity] = useState(waxDensity.toString());
  const [localWaxBurnRate, setLocalWaxBurnRate] = useState(waxBurnRate.toString());

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click(); // programmatically click hidden file input
  };

  useEffect(() => {
      setIsMounted(true);
  }, []);

  useEffect(() => {
    if (parseFloat(localBurnRate) !== burnRate) {
        setLocalBurnRate(burnRate.toString());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [burnRate]);
  
  useEffect(() => {
    if (parseFloat(localHeight) !== initialCandleHeight) {
        setLocalHeight(initialCandleHeight.toString());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCandleHeight]);

  useEffect(() => {
    if (burnMode === 'advanced' && parseFloat(localWidth) !== candleWidth) {
        setLocalWidth(candleWidth.toString());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candleWidth, burnMode]);
  
  useEffect(() => {
    if (parseFloat(localWaxDensity) !== waxDensity) {
      setLocalWaxDensity(waxDensity.toString());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waxDensity]);

  useEffect(() => {
    if (parseFloat(localWaxBurnRate) !== waxBurnRate) {
      setLocalWaxBurnRate(waxBurnRate.toString());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waxBurnRate]);


  const handleNumberChange = (setter: (v:string) => void, callback: (val: number) => void) => (v: string) => {
    setter(v);
    const newNum = parseFloat(v);
    if (!isNaN(newNum)) {
        callback(newNum);
    } else if (v.trim() === '') {
        callback(0);
    }
  }

  const handleStartDateChange = (date: Date | undefined) => {
    if (date) {
        const newStartDate = new Date(date);
        onValueChange({ newStartDate });
    }
  };

  const handleEndDateChange = (date: Date | undefined) => {
     if (date) {
        const newEndDate = new Date(date);
        onValueChange({ newEndDate });
    }
  };
  
  const handleFlameColorChange = (color: ColorPickerValue) => {
    setFlameColor(hsvaToHex(color));
  }
  
  const handleWaxColorChange = (color: ColorPickerValue) => {
    setWaxColor(hsvaToHex(color));
  }

  const handleRulerColorChange = (color: ColorPickerValue) => {
    setRulerColor(hsvaToHex(color));
  }

  const handleRulerLabelColorChange = (color: ColorPickerValue) => {
    setRulerLabelColor(hsvaToHex(color));
  }
  
  const handleConfigExport = useCallback(() => {
        const config = {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            burnRate,
            initialCandleHeight,
            candleWidth,
            flameColor,
            waxColor,
            rulerColor,
            rulerLabelColor,
            cameraState,
            calcMode,
            burnMode,
            waxDensity,
            waxBurnRate,
        };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "embersculpt_config.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }, [startDate, endDate, burnRate, initialCandleHeight, candleWidth, flameColor, waxColor, rulerColor, rulerLabelColor, cameraState, calcMode, burnMode, waxDensity, waxBurnRate]);

    const handleConfigImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const fileReader = new FileReader();
        if (event.target.files && event.target.files[0]) {
            fileReader.readAsText(event.target.files[0], "UTF-8");
            fileReader.onload = e => {
                if (e.target?.result) {
                    try {
                        const config = JSON.parse(e.target.result as string);
                        onValueChange({ config });
                    } catch (error) {
                        console.error("Error parsing config file:", error);
                    }
                }
            };
        }
    };


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{intl.formatMessage({ id: 'controls.simulation' })}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className='space-y-2'>
                <Label>{intl.formatMessage({ id: 'controls.calculationMode' })}</Label>
                 <CustomCheckbox
                    options={[
                        { value: 'burnRate', label: intl.formatMessage({ id: 'controls.mode.burnRate' }) },
                        { value: 'endDate', label: intl.formatMessage({ id: 'controls.mode.endDate' }) },
                        { value: 'startDate', label: intl.formatMessage({ id: 'controls.mode.startDate' }) },
                    ]}
                    values={[calcMode]}
                    onGroupChange={(values) => onValueChange({ mode: values[0] as CalculationMode})}
                    direction={isRTL ? 'rtl' : 'ltr'}
                    groupDirection="column"
                    groupGap={12}
                 />
            </div>

             <div className='space-y-2'>
                <Label>{intl.formatMessage({ id: 'controls.burnMode' })}</Label>
                <CustomCheckbox
                    options={[
                        { value: 'simple', label: intl.formatMessage({ id: 'burnMode.simple' }) },
                        { value: 'advanced', label: intl.formatMessage({ id: 'burnMode.advanced' }) },
                    ]}
                    values={[burnMode]}
                    onGroupChange={(values) => onValueChange({ burnMode: values[0] as BurnMode})}
                    direction={isRTL ? 'rtl' : 'ltr'}
                    groupDirection="row"
                    groupGap={12}
                 />
            </div>
            
             <FloatingLabelInput
                label={intl.formatMessage({ id: 'controls.candleHeight' })}
                value={localHeight}
                onValueChange={handleNumberChange(setLocalHeight, (val) => onValueChange({ newInitialHeight: val }))}
                type="number"
                isRTL={isRTL}
            />

            {burnMode === 'simple' && calcMode !== 'burnRate' && (
                 <FloatingLabelInput
                    label={intl.formatMessage({ id: 'controls.burnRate' })}
                    value={localBurnRate}
                    onValueChange={handleNumberChange(setLocalBurnRate, (val) => onValueChange({ newBurnRate: val }))}
                    type="number"
                    isRTL={isRTL}
                />
            )}

            {burnMode === 'advanced' && (
                <>
                    <FloatingLabelInput
                        label={intl.formatMessage({ id: 'controls.candleWidth' })}
                        value={localWidth}
                        onValueChange={handleNumberChange(setLocalWidth, (val) => onValueChange({ newCandleWidth: val }))}
                        type="number"
                        isRTL={isRTL}
                    />
                    {calcMode !== 'burnRate' && (
                        <>
                            <FloatingLabelInput
                                label={intl.formatMessage({ id: 'controls.waxDensity' })}
                                value={localWaxDensity}
                                onValueChange={handleNumberChange(setLocalWaxDensity, (val) => onValueChange({ newWaxDensity: val }))}
                                type="number"
                                isRTL={isRTL}
                            />
                            <FloatingLabelInput
                                label={intl.formatMessage({ id: 'controls.waxBurnRate' })}
                                value={localWaxBurnRate}
                                onValueChange={handleNumberChange(setLocalWaxBurnRate, (val) => onValueChange({ newWaxBurnRate: val }))}
                                type="number"
                                isRTL={isRTL}
                            />
                        </>
                    )}
                    <div className="text-sm text-muted-foreground font-mono">
                        {intl.formatMessage({id: 'controls.effectiveBurnRate'})}: {effectiveBurnRate.toFixed(4)} in/hr
                    </div>
                </>
            )}

            {(calcMode === 'burnRate') && (
                <div className="text-sm text-muted-foreground font-mono">
                    {intl.formatMessage({ id: 'controls.burnRate' })}: {effectiveBurnRate.toFixed(4)} in/hr
                </div>
            )}
            
            <div className="flex flex-col gap-4">
                {calcMode !== 'startDate' ? (
                    <div className="space-y-3">
                        <Label htmlFor="start-date">{intl.formatMessage({ id: 'controls.startDate' })}</Label>
                        <div className='flex flex-col gap-4'>
                            <Calendar 
                                selected={startDate} 
                                onSelect={(d) => d && handleStartDateChange(d)}
                                isRTL={isRTL}
                            />
                             {isMounted && <Separator />}
                            {isMounted && <TimePicker date={startDate} setDate={handleStartDateChange} />}
                        </div>
                    </div>
                ) : (
                     <div className="space-y-2">
                        <Label>{intl.formatMessage({ id: 'controls.startDate' })}</Label>
                        <div className="p-2 rounded-md bg-muted text-muted-foreground font-mono text-sm">
                            {formatDateTime(startDate, locale)}
                        </div>
                    </div>
                )}
                
                {calcMode !== 'endDate' ? (
                    <div className="space-y-3">
                        <Label htmlFor="end-date">{intl.formatMessage({ id: 'controls.endDate' })}</Label>
                        <div className='flex flex-col gap-4'>
                            <Calendar 
                                selected={endDate} 
                                onSelect={(d) => d && handleEndDateChange(d)}
                                isRTL={isRTL}
                            />
                            {isMounted && <Separator />}
                            {isMounted && <TimePicker date={endDate} setDate={handleEndDateChange} />}
                        </div>
                    </div>
                ) : (
                     <div className="space-y-2">
                        <Label>{intl.formatMessage({ id: 'controls.endDate' })}</Label>
                        <div className="p-2 rounded-md bg-muted text-muted-foreground font-mono text-sm">
                            {formatDateTime(endDate, locale)}
                        </div>
                    </div>
                )}
            </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{intl.formatMessage({ id: 'controls.colors' })}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="flame-color">{intl.formatMessage({ id: 'controls.flameColor' })}</Label>
            <ColorPicker value={flameColor} onValueChange={handleFlameColorChange} isRTL={isRTL} />
          </div>
          <div className="space-y-3">
            <Label htmlFor="wax-color">{intl.formatMessage({ id: 'controls.waxColor' })}</Label>
            <ColorPicker value={waxColor} onValueChange={handleWaxColorChange} isRTL={isRTL} />
          </div>
           <div className="space-y-3">
            <Label>{intl.formatMessage({ id: 'controls.rulerColor' })}</Label>
            <ColorPicker value={rulerColor} onValueChange={handleRulerColorChange} isRTL={isRTL} />
          </div>
           <div className="space-y-3">
            <Label>{intl.formatMessage({ id: 'controls.rulerLabelColor' })}</Label>
            <ColorPicker value={rulerLabelColor} onValueChange={handleRulerLabelColorChange} isRTL={isRTL} />
          </div>
        </CardContent>
      </Card>
       <Card>
          <CardHeader>
              <CardTitle>{intl.formatMessage({ id: 'settings.title' })}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <div className="flex w-full gap-2">
                <HalomotButton
                  onClick={handleConfigExport}
                  fillWidth={true}
                  inscription={intl.formatMessage({ id: 'settings.export' })}
                  icon={<Upload className="mr-2 h-4 w-4" />}
                  gradient="linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))"
                  backgroundColor="hsl(var(--background))"
                  hoverTextColor="hsl(var(--foreground))"
                  textColor="hsl(var(--secondary-foreground))"
                />
                <HalomotButton
                  onClick={handleImportClick}
                  fillWidth={true}
                  inscription={intl.formatMessage({ id: 'settings.import' })}
                  icon={<Download className="mr-2 h-4 w-4" />}
                  gradient="linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))"
                  backgroundColor="hsl(var(--background))"
                  hoverTextColor="hsl(var(--foreground))"
                  textColor="hsl(var(--secondary-foreground))"
                />
                <input
                  type="file"
                  accept=".json"
                  ref={fileInputRef}
                  onChange={handleConfigImport}
                  style={{ display: 'none' }} // hide completely
                />
            </div>
          </CardContent>
      </Card>
    </div>
  );
}
