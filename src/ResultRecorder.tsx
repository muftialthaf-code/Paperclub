import {accountMessage} from './FamilyAccounts';
import {localizedError} from './i18n/errors';
import {tx} from './i18n/translate';
import React, { useState } from 'react';
import { X, Plus, Trophy } from 'lucide-react';
import { useClub } from './ClubContext';
import { ProfileEditor, Certificate } from './Clubhouse';
import { uid, addResult, isDrawing, type ClubResult, type Award } from './clubModel';
export type ResultSeed = {
    sessionId: string;
    gameId: string;
    gameName: string;
    difficulty: string;
    slots: {
        name: string;
        score: number | null;
        winner: boolean;
    }[];
    teams: boolean;
    cooperative: boolean;
    completedTogether: boolean;
    partyId?: string;
};
export default function ResultRecorder({ seed, onClose, onClub }: {
    seed: ResultSeed;
    onClose: () => void;
    onClub: () => void;
}) {
    const { data, commit, error } = useClub();
    const [guest, setGuest] = useState(false);
    const [warning, warn] = useState('');
    const [saved, setSaved] = useState(false);
    const [certificate, setCertificate] = useState<Award | null>(null);
    const [created, setCreated] = useState<Award[]>([]);
    const [rows, setRows] = useState(() => seed.slots.map(slot => { const matches = data.profiles.filter(p => !p.archived && p.name.toLocaleLowerCase() === slot.name.toLocaleLowerCase()); return { ...slot, ids: matches.length === 1 ? [matches[0].id] : [] as string[] }; }));
    const [participants, setParticipants] = useState<string[]>([]);
    const [voted, setVoted] = useState<string[]>([]);
    const [completed, setCompleted] = useState(seed.completedTogether);
    const [awardDrawing, setAwardDrawing] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const [party, setParty] = useState(seed.partyId || '');
    const duplicate = data.results.some(r => r.sessionId === seed.sessionId);
    async function save() {
        if (!confirmed) {
            warn('Confirm the assignments and results before saving.');
            return;
        }
        const entries = seed.slots.length ? rows.flatMap(row => row.ids.map(id => ({ profileId: id, name: data.profiles.find(p => p.id === id)!.name, score: row.score, winner: !seed.cooperative && row.winner, team: seed.teams }))) : participants.map(id => ({ profileId: id, name: data.profiles.find(p => p.id === id)!.name, score: null, winner: voted.includes(id), team: false }));
        const result: ClubResult = { id: uid(), sessionId: seed.sessionId, gameId: seed.gameId, difficulty: seed.difficulty, date: new Date().toISOString(), entries, cooperative: seed.cooperative, completedTogether: completed, partyId: party || undefined };
        try {
            let next = addResult(data, result);
            const awards: Award[] = awardDrawing ? entries.filter(e => e.winner).map(e => ({ id: uid(), profileId: e.profileId, name: e.name, title: 'Drawing Champion', note: 'Chosen by the family for a wonderfully creative drawing.', date: result.date, gameId: seed.gameId, resultId: result.id, partyId: result.partyId })) : [];
            next = { ...next, awards: [...awards, ...next.awards], parties: next.parties.map(p => p.id === party ? { ...p, players: [...new Set([...p.players, ...entries.map(e => e.profileId)])] } : p) };
            if (await commit(next)) {
                setCreated(awards);
                setSaved(true);
            }
        }
        catch (e) {
            warn(localizedError(e));
        }
    }
    return <><div className="modal-backdrop" onClick={onClose}><section className="setup-modal result-recorder" role="dialog" aria-modal="true" aria-label={tx("Confirm game result")} onClick={e => e.stopPropagation()}><button className="close" aria-label={tx("Close results")} onClick={onClose}><X /></button><span className="eyebrow">{tx("A MEMORY WORTH KEEPING")}</span><h2>{tx(seed.gameName)}{tx(" results")}</h2><p>{tx(seed.difficulty)}{tx(" \u00B7 ")}{tx(seed.cooperative ? 'Cooperative' : seed.teams ? 'Team result' : 'Individual result')}</p>{tx(saved || duplicate ? <><p role="status" className="feedback">{tx("This game result is saved. It will only count once.")}</p>{tx(created.map(a => <button className="secondary wide" key={a.id} onClick={() => setCertificate(a)}><Trophy size={16}/><bdi>{a.name}</bdi>{tx("\u2019s certificate")}</button>))}<div className="actions"><button className="primary" onClick={onClub}>{tx("View clubhouse")}</button><button className="secondary" onClick={onClose}>{tx("Done")}</button></div></> : <><p className="small">{tx("Choose which profiles to credit. Unassigned players are not tracked. Confirm scores and winners from your paper game; these are never saved automatically.")}</p><button className="text-button" onClick={() => setGuest(true)}><Plus size={16}/>{tx("Add a guest or player")}</button>{tx(seed.slots.length ? rows.map((row, index) => <div className="result-slot" key={index}><h3><bdi>{row.name}</bdi></h3>{tx(seed.teams ? <><p className="small">{tx("Credit the team\u2019s members. The team score is recorded as a shared result, not an individual personal best.")}</p><div className="club-checks">{tx(data.profiles.filter(p => !p.archived).map(p => <label className="checkbox" key={p.id}><input type="checkbox" checked={row.ids.includes(p.id)} onChange={() => setRows(rows.map((r, i) => i === index ? { ...r, ids: r.ids.includes(p.id) ? r.ids.filter(id => id !== p.id) : [...r.ids, p.id] } : r))}/>{tx(p.avatar)}{tx(" ")}<bdi>{p.name}</bdi></label>))}</div></> : <label>{tx("Credit to profile")}<select aria-label={tx(`Profile for ${row.name}`)} value={row.ids[0] || ''} onChange={e => setRows(rows.map((r, i) => i === index ? { ...r, ids: e.target.value ? [e.target.value] : [] } : r))}><option dir="auto" value="">{tx("Do not track this player")}</option>{tx(data.profiles.filter(p => !p.archived).map(p => <option dir="auto" key={p.id} value={p.id}>{tx(p.avatar)}{tx(" ")}{p.name}{tx(" \u00B7 ")}{tx(p.kind === 'guest' ? 'Guest' : 'Family')}</option>))}</select></label>)}<div className="result-slot-controls">{tx(row.score !== null && <label>{tx(seed.teams ? 'Team score' : 'Confirmed score')}<input type="number" aria-label={tx(`Confirmed score for ${row.name}`)} value={row.score} onChange={e => setRows(rows.map((r, i) => i === index ? { ...r, score: Number(e.target.value) } : r))}/></label>)}{tx(!seed.cooperative && <label className="checkbox"><input type="checkbox" checked={row.winner} onChange={e => setRows(rows.map((r, i) => i === index ? { ...r, winner: e.target.checked } : r))}/>{tx("Winner / tied winner")}</label>)}</div></div>) : <><p>{tx("This drawing game has no required scoring. Select who played; optionally record a family drawing vote.")}</p><div className="club-checks">{tx(data.profiles.filter(p => !p.archived).map(p => <div key={p.id} className="unscored-player"><label className="checkbox"><input type="checkbox" checked={participants.includes(p.id)} onChange={() => { setParticipants(participants.includes(p.id) ? participants.filter(id => id !== p.id) : [...participants, p.id]); setVoted(voted.filter(id => id !== p.id)); }}/>{tx(p.avatar)}{tx(" ")}<bdi>{p.name}</bdi></label>{tx(participants.includes(p.id) && <label className="checkbox"><input type="checkbox" checked={voted.includes(p.id)} onChange={() => setVoted(voted.includes(p.id) ? voted.filter(id => id !== p.id) : [...voted, p.id])}/>{tx("Drawing vote winner")}</label>)}</div>))}</div></>)}{tx(seed.cooperative && <label className="checkbox"><input type="checkbox" checked={completed} onChange={e => setCompleted(e.target.checked)}/>{tx("Completed the challenge together (+2 club points each)")}</label>)}{tx(isDrawing(seed.gameId) && <label className="checkbox"><input type="checkbox" checked={awardDrawing} onChange={e => setAwardDrawing(e.target.checked)}/>{tx("Create a Drawing Champion certificate for each confirmed winner")}</label>)}<label>{tx("Gathering (optional)")}<select value={party} onChange={e => setParty(e.target.value)}><option dir="auto" value="">{tx("No party")}</option>{tx(data.parties.map(p => <option dir="auto" key={p.id} value={p.id}>{p.title}{tx(p.status === 'finished' ? ' · Finished' : '')}</option>))}</select></label><p className="small">{tx("3 club points for taking part, plus 2 for a confirmed win or cooperative completion. Raw scores are stored per game and level. Adults and children have separate standings.")}</p><label className="checkbox club-confirm"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}/>{tx("I confirm these profile assignments, scores and results.")}</label>{tx((warning || error) && <p role="alert" className="feedback">{accountMessage(warning || error)}</p>)}<button className="primary wide" disabled={!confirmed} onClick={save}>{tx("Save confirmed result")}</button></>)}</section></div>{tx(guest && <ProfileEditor guest onClose={() => setGuest(false)}/>)}{tx(" ")}{tx(certificate && <Certificate award={certificate} onClose={() => setCertificate(null)}/>)}</>;
}
