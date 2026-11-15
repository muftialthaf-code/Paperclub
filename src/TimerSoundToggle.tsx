import {tx} from './i18n/translate';
import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { prepareTimerSound } from './timerSound';
export default function TimerSoundToggle({ enabled, onChange }: {
    enabled: boolean;
    onChange: (value: boolean) => void;
}) {
    return <button className="timer-sound-toggle" type="button" aria-label={tx("Timer sound")} aria-pressed={enabled} onClick={() => { if (!enabled)
        prepareTimerSound(); onChange(!enabled); }}>{tx(enabled ? <Volume2 size={17}/> : <VolumeX size={17}/>)}{tx("Sound ")}{tx(enabled ? 'on' : 'off')}</button>;
}
