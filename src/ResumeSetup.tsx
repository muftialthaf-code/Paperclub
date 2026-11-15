import {tx} from './i18n/translate';
export default function ResumeSetup({ onResume, onExit }: {
    onResume?: () => void;
    onExit?: () => void;
}) { return onResume ? <div className="resume-setup"><p className="small">{tx("Your game is paused. Resume to keep your current round and scores. Applying settings starts a fresh game and resets current progress.")}</p><button className="secondary wide" onClick={onResume}>{tx("Resume current game")}</button>{tx(onExit && <button className="text-button" onClick={onExit}>{tx("Save & leave to game library")}</button>)}</div> : null; }
