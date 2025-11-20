'use client';

import { useState, useEffect, useMemo, useCallback }from 'react';
import type { CandleProps, CameraState } from '@/components/ember-sculpt/candle-scene';
import { CustomSlider } from '@/components/ui/custom-slider';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import Controls from '@/components/ember-sculpt/controls';
import dynamic from 'next/dynamic';
import { useIntl } from 'react-intl';
import { useAppContext } from '@/context/app-context';
import { formatDuration } from '@/lib/utils';
import { HeaderCard } from '@/components/header-card';
import { AppFooter } from '@/components/app-footer';
import { PlayIcon } from '@/components/ui/play-icon';
import { PauseIcon } from '@/components/ui/pause-icon';
import HalomotButton from '@/components/ui/halomot-button';

const CandleScene = dynamic(
  () => import('@/components/ember-sculpt/candle-scene'),
  { 
    ssr: false,
    loading: () => <div className="w-full h-full flex items-center justify-center bg-card"><p>Loading Scene...</p></div>
  }
);

export type CalculationMode = 'burnRate' | 'endDate' | 'startDate';
export type BurnMode = 'simple' | 'advanced';

export default function Home() {
    const { dir, locale } = useAppContext();
    const intl = useIntl();
    const isRTL = locale === 'he';
    const [isMounted, setIsMounted] = useState(false);

    const [startDate, setStartDate] = useState<Date>(new Date());
    const [endDate, setEndDate] = useState<Date>(new Date());
    
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState<Date>(new Date());

    const [initialCandleHeight, setInitialCandleHeight] = useState(10); // inches
    const [candleHeight, setCandleHeight] = useState(10);
    const [candleWidth, setCandleWidth] = useState(4); // inches

    // Simple mode
    const [burnRate, setBurnRate] = useState(0.1); // inches per hour

    // Advanced mode
    const [waxDensity, setWaxDensity] = useState(0.554); // oz/in^3 for paraffin wax
    const [waxBurnRate, setWaxBurnRate] = useState(0.25); // oz per hour, approx 7 grams/hr

    const [flameColor, setFlameColor] = useState('#ED5108');
    const [waxColor, setWaxColor] = useState('#F5F5DC');
    const [rulerColor, setRulerColor] = useState('#FFFFFF');
    const [rulerLabelColor, setRulerLabelColor] = useState('#FFFFFF');
    
    const [cameraState, setCameraState] = useState<CameraState>();

    const [calcMode, setCalcMode] = useState<CalculationMode>('endDate');
    const [burnMode, setBurnMode] = useState<BurnMode>('simple');

    useEffect(() => {
        const now = new Date();
        const initialBurnRate = 1; // 1 inch/hr
        const initialHeight = 10; // 10 inches
        const durationHours = initialHeight / initialBurnRate;
        const initialEndDate = new Date(now.getTime() + durationHours * 3600000);
        
        setStartDate(now);
        setCurrentTime(now);
        setEndDate(initialEndDate);
        setBurnRate(initialBurnRate);
        setInitialCandleHeight(initialHeight);
        setCandleWidth(initialHeight * 0.4);
        setIsMounted(true);
    }, []);

    const effectiveBurnRateInchesPerHour = useMemo(() => {
        if (burnMode === 'simple') {
            return burnRate > 0 ? burnRate : 0;
        }
        // Advanced calculation
        if (waxBurnRate <= 0 || waxDensity <= 0 || candleWidth <= 0) return 0;
        
        const radiusIn = candleWidth / 2;
        const massOzPerInchHeight = Math.PI * Math.pow(radiusIn, 2) * 1 * waxDensity; // Volume of 1-inch slice * density
        
        if (massOzPerInchHeight <= 0) return 0;

        const inchesBurntPerHour = waxBurnRate / massOzPerInchHeight;
        return inchesBurntPerHour;
    }, [burnMode, burnRate, candleWidth, waxDensity, waxBurnRate]);

    const displayCandleWidth = useMemo(() => {
        return burnMode === 'simple' ? initialCandleHeight * 0.4 : candleWidth;
    }, [burnMode, initialCandleHeight, candleWidth]);

    const totalDurationMs = useMemo(() => {
        if (!startDate || !endDate) return 0;
        const duration = endDate.getTime() - startDate.getTime();
        return Math.max(0, duration);
    }, [startDate, endDate]);

    const timeElapsedMs = useMemo(() => {
        if (!currentTime || !startDate) return 0;
        const elapsed = currentTime.getTime() - startDate.getTime();
        return Math.max(0, Math.min(elapsed, totalDurationMs));
    }, [currentTime, startDate, totalDurationMs]);
    
    const handleValueChange = useCallback((values: {
        newStartDate?: Date;
        newEndDate?: Date;
        newBurnRate?: number;
        newInitialHeight?: number;
        newCandleWidth?: number;
        newWaxDensity?: number;
        newWaxBurnRate?: number;
        mode?: CalculationMode;
        burnMode?: BurnMode;
        config?: any;
    }) => {
        if (values.config) {
            const config = values.config;
            setStartDate(new Date(config.startDate));
            setEndDate(new Date(config.endDate));
            setInitialCandleHeight(config.initialCandleHeight);
            setCandleWidth(config.candleWidth);
            setFlameColor(config.flameColor);
            setWaxColor(config.waxColor);
            setRulerColor(config.rulerColor || '#FFFFFF');
            setRulerLabelColor(config.rulerLabelColor || '#FFFFFF');
            setBurnRate(config.burnRate || 0.1);
            setWaxDensity(config.waxDensity || 0.554);
            setWaxBurnRate(config.waxBurnRate || 0.25);
            setCameraState(config.cameraState);
            setCalcMode(config.calcMode || 'startDate');
            setBurnMode(config.burnMode || 'simple');
            return;
        }

        let sDate = values.newStartDate !== undefined ? values.newStartDate : startDate;
        let eDate = values.newEndDate !== undefined ? values.newEndDate : endDate;
        let bRate = values.newBurnRate !== undefined ? values.newBurnRate : burnRate;
        let iHeight = values.newInitialHeight !== undefined ? values.newInitialHeight : initialCandleHeight;
        const currentMode = values.mode !== undefined ? values.mode : calcMode;
        const currentBurnMode = values.burnMode !== undefined ? values.burnMode : burnMode;
        let cWidth = values.newCandleWidth !== undefined ? values.newCandleWidth : candleWidth;
        const wDensity = values.newWaxDensity !== undefined ? values.newWaxDensity : waxDensity;
        const wBurnRate = values.newWaxBurnRate !== undefined ? values.newWaxBurnRate : waxBurnRate;

        if (values.newCandleWidth !== undefined) setCandleWidth(cWidth);
        if (values.newInitialHeight !== undefined) {
             iHeight = values.newInitialHeight;
             setInitialCandleHeight(iHeight);
        }
        if (values.newBurnRate !== undefined) setBurnRate(bRate);
        if (values.newWaxDensity !== undefined) setWaxDensity(wDensity);
        if (values.newWaxBurnRate !== undefined) setWaxBurnRate(wBurnRate);
        if (values.burnMode) setBurnMode(values.burnMode);
        
        if (currentBurnMode === 'simple' && values.newInitialHeight !== undefined) {
            cWidth = iHeight * 0.4;
            setCandleWidth(cWidth);
        }

        let derivedBurnRate;
         if (currentBurnMode === 'simple') {
            derivedBurnRate = bRate > 0 ? bRate : 0;
        } else {
             // Recalculate derived burn rate based on potentially new advanced props
            if (wBurnRate > 0 && wDensity > 0 && cWidth > 0) {
                const radiusIn = cWidth / 2;
                const massOzPerInchHeight = Math.PI * Math.pow(radiusIn, 2) * 1 * wDensity;
                if (massOzPerInchHeight > 0) {
                    derivedBurnRate = wBurnRate / massOzPerInchHeight;
                } else {
                    derivedBurnRate = 0;    return (
        <div className="flex flex-col h-dvh bg-background text-foreground overflow-hidden">
            <main className="flex-grow flex flex-col min-h-0" dir={dir}>
                <div className="flex-grow grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 min-h-0">
                    <div className="lg:col-span-3 rounded-lg shadow-inner overflow-hidden relative bg-card/50 min-h-[300px] lg:min-h-0">
                        <CandleScene {...candleProps} />
                        <div className={burningTimeCardClasses}>
                            <Label className="text-sm text-muted-foreground font-mono uppercase tracking-wider">{intl.formatMessage({ id: 'scene.burningTime' })}</Label>
                            <p className="text-2xl font-bold font-mono text-primary">{formatDuration(timeElapsedMs)}</p>
                        </div>
                    </div>
                    <div className="lg:col-span-1 flex flex-col gap-6 lg:overflow-y-auto pr-2 max-w-[416px]">
                        <div className="max-w-[398px]">

                        <HeaderCard />
                        <Card className="p-4">
                             <div className="flex items-center justify-between">
                                <Label htmlFor="timeline" className="text-lg font-medium">{intl.formatMessage({ id: 'timeline.title' })}</Label>
                                <HalomotButton
                                    onClick={() => setIsPlaying(!isPlaying)}
                                    inscription={isPlaying ? intl.formatMessage({ id: 'timeline.pause' }) : intl.formatMessage({ id: 'timeline.play' })}
                                    icon={isPlaying ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
                                    padding="0.5rem 1rem"
                                    fillWidth={false}
                                    gradient="linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))"
                                    backgroundColor="hsl(var(--background))"
                                    hoverTextColor="hsl(var(--foreground))"
                                    textColor="hsl(var(--primary-foreground))"
                                />
                            </div>
                            <div className="my-4">
                                <CustomSlider
                                    min={0}
                                    max={totalDurationMs}
                                    step={1000}
                                    value={timeElapsedMs}
                                    onValueChange={handleSliderChange}
                                    isRTL={isRTL}
                                />
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground font-mono">
                                <span>{formatDuration(timeElapsedMs)}</span>
                                <span>{formatDuration(totalDurationMs)}</span>
                            </div>
                        </Card>
                        <Controls 
                            burnRate={burnRate}
                            initialCandleHeight={initialCandleHeight}
                            candleWidth={candleWidth}
                            flameColor={flameColor}
                            waxColor={waxColor}
                            rulerColor={rulerColor}
                            rulerLabelColor={rulerLabelColor}
                            startDate={startDate}
                            endDate={endDate}
                            calcMode={calcMode}
                            burnMode={burnMode}
                            waxDensity={waxDensity}
                            waxBurnRate={waxBurnRate}
                            effectiveBurnRate={effectiveBurnRateInchesPerHour}
                            onValueChange={handleValueChange}
                            setFlameColor={setFlameColor}
                            setWaxColor={setWaxColor}
                            setRulerColor={setRulerColor}
                            setRulerLabelColor={setRulerLabelColor}
                            cameraState={cameraState}
                        />
                         <AppFooter />
                    </div>
                    </div>
                </div>
            </main>
        </div>
    );
                }
            } else {
                derivedBurnRate = 0;
            }
        }

        if (sDate && eDate) {
            const effectiveHeight = iHeight > 0 ? iHeight : 0.00001;

            if (currentMode === 'burnRate') {
                const durationMs = eDate.getTime() - sDate.getTime();
                if (durationMs > 0) {
                    const durationHours = durationMs / 3600000;
                    const newDerivedRate = effectiveHeight / durationHours;
                    // This mode only makes sense to set the simple burnRate
                     if (currentBurnMode === 'simple') {
                         setBurnRate(newDerivedRate);
                     }
                }
            } else if (currentMode === 'endDate') {
                const durationHours = derivedBurnRate > 0 ? effectiveHeight / derivedBurnRate : Infinity;
                eDate = durationHours !== Infinity ? new Date(sDate.getTime() + durationHours * 3600000) : sDate;
            } else if (currentMode === 'startDate') {
                const durationHours = derivedBurnRate > 0 ? effectiveHeight / derivedBurnRate : Infinity;
                sDate = durationHours !== Infinity ? new Date(eDate.getTime() - durationHours * 3600000) : eDate;
            }
        }
        
        setStartDate(sDate);
        setEndDate(eDate);
        if (values.mode !== undefined) setCalcMode(currentMode);

        if (currentTime > eDate || currentTime < sDate) {
            setCurrentTime(sDate);
        }

    }, [startDate, endDate, burnRate, initialCandleHeight, currentTime, calcMode, burnMode, candleWidth, waxDensity, waxBurnRate]);


    useEffect(() => {
        const elapsedHours = timeElapsedMs / 3600000;
        const newHeight = initialCandleHeight - (elapsedHours * effectiveBurnRateInchesPerHour);
        if(initialCandleHeight > 0) {
            setCandleHeight(newHeight);
        } else {
            setCandleHeight(0);
        }
    }, [timeElapsedMs, effectiveBurnRateInchesPerHour, initialCandleHeight]);

    useEffect(() => {
        let animationFrameId: number;
        if (isPlaying && currentTime && endDate && currentTime < endDate) {
            const animate = () => {
                setCurrentTime(prevTime => {
                    if (!prevTime) return prevTime;
                    const newTime = new Date(prevTime.getTime() + 50);
                    if (newTime >= endDate) {
                        setIsPlaying(false);
                        return endDate;
                    }
                    return newTime;
                });
                animationFrameId = requestAnimationFrame(animate);
            };
            animationFrameId = requestAnimationFrame(animate);
        } else if (isPlaying && currentTime && endDate && currentTime >= endDate) {
            setIsPlaying(false);
        }
        return () => cancelAnimationFrame(animationFrameId);
    }, [isPlaying, endDate, currentTime]);
    
    const handleSliderChange = (value: number) => {
        if (!startDate) return;
        const newTime = new Date(startDate.getTime() + value);
        setCurrentTime(newTime);
    };

    const candleProps: CandleProps = {
        candleHeight: candleHeight < 0.001 ? 0.001 : candleHeight,
        initialCandleHeight: initialCandleHeight < 0.01 ? 0.01 : initialCandleHeight,
        candleWidth: displayCandleWidth < 0.01 ? 0.01 : displayCandleWidth,
        flameColor,
        waxColor,
        baseColor: '#D3D3D3',
        rulerColor,
        rulerLabelColor,
        cameraState: cameraState,
        onCameraChange: setCameraState,
    };
    
    const burningTimeCardClasses = useMemo(() => {
        const baseClasses = "absolute top-4 bg-background/50 backdrop-blur-sm p-3 rounded-lg text-center";
        return dir === 'rtl' ? `${baseClasses} right-4` : `${baseClasses} left-4`;
    }, [dir]);

    if (!isMounted) {
        return <div className="w-full h-dvh flex items-center justify-center bg-background"><p>Loading...</p></div>;
    }

    return (
    <div
        className="flex flex-col h-dvh bg-background text-foreground overflow-hidden"
        style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}
    >
        <main
        className="flex-grow flex flex-col min-h-0"
        dir={dir}
        style={{ display: 'flex', flexGrow: 1, minHeight: 0 }}
        >
        <div
            style={{
            display: 'flex',
            flexGrow: 1,
            minHeight: 0,
            padding: '1rem',
            gap: '1rem',
            }}
        >
            {/* Candle Scene fills remaining width */}
            <div
            style={{
                flex: '1 1 auto',
                minHeight: '300px',
                borderRadius: '0.5rem',
                boxShadow: 'inset 0 0 10px rgba(0,0,0,0.2)',
                position: 'relative',
                border: '1px solid hsl(var(--border))',
                backgroundColor: 'rgba(0,0,0,0.05)',
                overflow: 'hidden',
            }}
            >
            <CandleScene {...candleProps} />
            <div className={burningTimeCardClasses}>
                <Label className="text-sm text-muted-foreground font-mono uppercase tracking-wider">
                {intl.formatMessage({ id: 'scene.burningTime' })}
                </Label>
                <p className="text-2xl font-bold font-mono text-primary">
                {formatDuration(timeElapsedMs)}
                </p>
            </div>
            </div>

            {/* Controls area fixed width */}
            <div
            style={{
                flex: '0 0 416px',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                overflowY: 'auto',
                paddingRight: '0.5rem',
            }}
            >
            <HeaderCard />
            <Card className="p-4">
                <div className="flex items-center justify-between">
                <Label htmlFor="timeline" className="text-lg font-medium">
                    {intl.formatMessage({ id: 'timeline.title' })}
                </Label>
                <HalomotButton
                    onClick={() => setIsPlaying(!isPlaying)}
                    inscription={
                    isPlaying
                        ? intl.formatMessage({ id: 'timeline.pause' })
                        : intl.formatMessage({ id: 'timeline.play' })
                    }
                    icon={
                    isPlaying ? <PauseIcon size={16} /> : <PlayIcon size={16} />
                    }
                    padding="0.5rem 1rem"
                    fillWidth={false}
                    gradient="linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))"
                    backgroundColor="hsl(var(--background))"
                    hoverTextColor="hsl(var(--foreground))"
                    textColor="hsl(var(--primary-foreground))"
                />
                </div>
                <div className="my-4">
                <CustomSlider
                    min={0}
                    max={totalDurationMs}
                    step={1000}
                    value={timeElapsedMs}
                    onValueChange={handleSliderChange}
                    isRTL={isRTL}
                />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground font-mono">
                <span>{formatDuration(timeElapsedMs)}</span>
                <span>{formatDuration(totalDurationMs)}</span>
                </div>
            </Card>
            <Controls
                burnRate={burnRate}
                initialCandleHeight={initialCandleHeight}
                candleWidth={candleWidth}
                flameColor={flameColor}
                waxColor={waxColor}
                rulerColor={rulerColor}
                rulerLabelColor={rulerLabelColor}
                startDate={startDate}
                endDate={endDate}
                calcMode={calcMode}
                burnMode={burnMode}
                waxDensity={waxDensity}
                waxBurnRate={waxBurnRate}
                effectiveBurnRate={effectiveBurnRateInchesPerHour}
                onValueChange={handleValueChange}
                setFlameColor={setFlameColor}
                setWaxColor={setWaxColor}
                setRulerColor={setRulerColor}
                setRulerLabelColor={setRulerLabelColor}
                cameraState={cameraState}
            />
            <AppFooter />
            </div>
        </div>
        </main>
    </div>
    );

}
