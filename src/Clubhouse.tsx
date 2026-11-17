import FamilyAccounts,{accountMessage} from './FamilyAccounts';
import {useAccount} from './AccountContext';
import {localizedError} from './i18n/errors';
import {getLocale,isArabic} from './i18n/locale';
import {tx,awardNote} from './i18n/translate';
import React, { useState } from 'react';
import { Plus, Download, Mail, Trophy, Users, ArrowRight, X } from 'lucide-react';
import { games } from './engine';
import { useClub, makeProfile, profileIcons, profileColors } from './ClubContext';
import { uid, profileStats, mergeProfiles, removeProfile, validateClub, clubMonth, certificateSvg, emailDraft, type Profile, type Award, type Party, type ClubData } from './clubModel';
const dateLabel = (date: string) => new Date(date).toLocaleDateString(getLocale()==='ar-SA'?'ar-SA-u-ca-gregory-nu-latn':'en-GB', { timeZone: 'Asia/Riyadh' });
export const monthKey = clubMonth;
export function downloadFile(name: string, content: string, type: string) { const url = URL.createObjectURL(new Blob([content], { type })); const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 10000); }
const gameName = (id?: string) => games.find(g => g.id === id)?.name || 'Paperclub';
export const awardTitles = ['First Game Completed', 'Drawing Champion', 'Creative Spark', 'Word Wizard', 'Codebreaker', 'Brilliant Teammate', 'Escape Room Dream Team', 'Most Imaginative Storyteller', 'Player of the Month', 'Most Improved'];
export function ProfileEditor({ profile, onClose, onSaved, guest = false }: {
    profile?: Profile;
    onClose: () => void;
    onSaved?: (p: Profile) => void;
    guest?: boolean;
}) {
    const { data, commit, error, source } = useClub();
    const [p, set] = useState(() => profile || makeProfile('', guest ? 'guest' : 'family'));
    const [warning, warn] = useState('');
    return <div className="modal-backdrop" onClick={onClose}><form className="setup-modal club-modal" role="dialog" aria-modal="true" aria-label={tx(profile ? 'Edit player' : 'Add player')} onClick={e => e.stopPropagation()} onSubmit={async e => { e.preventDefault(); if (!p.name.trim()) {
        warn('Enter a nickname.');
        return;
    } const next = { ...p, name: p.name.trim() }; if (await commit({ ...data, profiles: profile ? data.profiles.map(v => v.id === p.id ? next : v) : [...data.profiles, next] })) {
        onSaved?.(next);
        onClose();
    } }}><button type="button" className="close" aria-label={tx("Close player editor")} onClick={onClose}><X /></button><span className="eyebrow">{tx("A PLACE AT THE TABLE")}</span><h2>{tx(profile ? 'Edit player' : 'Meet our next player')}</h2><p>{tx("Nicknames are perfect. No email, password or birth date needed.")}</p><label>{tx("Nickname")}<input dir="auto" required maxLength={40} value={p.name} onChange={e => set({ ...p, name: e.target.value })}/></label><div className="setup-grid"><label>{tx("Player type")}<select value={p.kind} onChange={e => set({ ...p, kind: e.target.value as Profile['kind'] })}><option dir="auto" value="family">{tx("Family member")}</option><option dir="auto" value="guest">{tx("Guest / friend")}</option></select></label><label>{tx("Leaderboard group")}<select value={p.audience} onChange={e => set({ ...p, audience: e.target.value as Profile['audience'] })}><option dir="auto" value="child">{tx("Children")}</option><option dir="auto" value="adult">{tx("Adults")}</option></select></label></div><label>{tx("Choose an avatar")}</label><div className="avatar-choices">{tx(profileIcons.map(icon => <button type="button" className={p.avatar === icon ? 'chosen' : ''} aria-label={tx(`Avatar ${icon}`)} aria-pressed={p.avatar === icon} key={icon} onClick={() => set({ ...p, avatar: icon })}>{tx(icon)}</button>))}</div><label>{tx("Choose a colour")}</label><div className="avatar-choices">{tx(profileColors.map((color, i) => <button type="button" className={p.color === color ? 'chosen color-choice' : 'color-choice'} style={{ background: color }} aria-label={tx(`Colour ${i + 1}`)} aria-pressed={p.color === color} key={color} onClick={() => set({ ...p, color })}>{tx(p.color === color ? '✓' : '')}</button>))}</div>{tx(p.kind === 'guest' && <label className="checkbox"><input type="checkbox" checked={p.retained} onChange={e => set({ ...p, retained: e.target.checked })}/>{tx("Keep as a returning friend")}</label>)}<p className="small">{tx("Guest profiles stay on this device until you archive or remove them. Returning friends are marked for next time.")}</p>{tx((warning || error) && <p role="alert" className="feedback">{accountMessage(warning || error)}</p>)}<button className="primary wide" type="submit">{tx("Save player ")}<ArrowRight size={16}/></button></form></div>;
}
export function Certificate({ award, onClose }: {
    award: Award;
    onClose: () => void;
}) {
    const [recipient, setRecipient] = useState('');
    const [message, setMessage] = useState('');
    const title = gameName(award.gameId);
    return <div className="modal-backdrop" onClick={onClose}><section className="setup-modal certificate-modal" role="dialog" aria-modal="true" aria-label={tx("Certificate preview")} onClick={e => e.stopPropagation()}><button className="close" aria-label={tx("Close certificate")} onClick={onClose}><X /></button><div className="certificate-preview"><span className="brand">{tx("paperclub \u2733")}</span><span className="eyebrow">{tx("CERTIFICATE OF ACHIEVEMENT")}</span><Trophy size={40}/><h2>{tx(award.title)}</h2><p>{tx("Proudly presented to")}</p><h3><bdi>{award.name}</bdi></h3><p><bdi>{awardNote(award.note)}</bdi></p><small>{tx(title)}{tx(" \u00B7 ")}{tx(dateLabel(award.date))}</small></div><button className="primary wide" onClick={() => downloadFile(`paperclub-certificate-${award.id}.svg`, certificateSvg(award, title), 'image/svg+xml')}><Download size={18}/>{tx("Download certificate")}</button><details><summary>{tx("Email to a parent or guardian")}</summary><p className="small">{tx("Download the certificate first, then attach it in your email app. This opens a draft for you to review and send; Paperclub does not send email automatically.")}</p><label>{tx("Parent / guardian email")}<input type="email" autoComplete="off" value={recipient} onChange={e => setRecipient(e.target.value)} placeholder={tx("parent@example.com")}/></label><div className="email-preview"><strong>{tx("A Paperclub certificate for ")}<bdi>{award.name}</bdi></strong><p>{tx("Hello,")}<br /><bdi>{award.name}</bdi>{tx(" earned the ")}{tx(award.title)}{tx(" award during ")}{tx(title)}{tx("!")}</p><p><bdi>{awardNote(award.note)}</bdi></p><p>{tx("Please find their certificate attached.")}</p></div><button className="secondary wide" onClick={async () => { try {
        window.location.href = emailDraft(award, recipient, title);
        setMessage('Draft opened. Attach your downloaded certificate before sending.');
    }
    catch (e) {
        setMessage(localizedError(e));
    } }}><Mail size={16}/>{tx("Open email draft")}</button><p role="status" className="small">{tx(message || 'The recipient address is used for this draft only and is not saved.')}</p></details></section></div>;
}
export function AwardEditor({ profileId, partyId, onClose, onSaved, initialTitle }: {
    initialTitle?: string;
    profileId?: string;
    partyId?: string;
    onClose: () => void;
    onSaved: (a: Award) => void;
}) {
    const { data, commit, error, source } = useClub();
    const [id, setId] = useState(profileId || '');
    const [title, setTitle] = useState(initialTitle || 'Creative Spark');
    const [note, setNote] = useState(tx('For bringing imagination, kindness and brilliant ideas to the table.'));
    const [game, setGame] = useState('');
    const [warning, warn] = useState('');
    return <div className="modal-backdrop" onClick={onClose}><form className="setup-modal" role="dialog" aria-modal="true" aria-label={tx("Give an award")} onClick={e => e.stopPropagation()} onSubmit={async e => { e.preventDefault(); const p = data.profiles.find(p => p.id === id); if (!p) {
        warn('Choose a player.');
        return;
    } const a: Award = { id: uid(), profileId: p.id, name: p.name, title, note, date: new Date().toISOString(), gameId: game || undefined, partyId }; if (await commit({ ...data, awards: [a, ...data.awards] })) {
        onSaved(a);
        onClose();
    } }}><button type="button" className="close" aria-label={tx("Close award editor")} onClick={onClose}><X /></button><span className="eyebrow">{tx("A LITTLE RECOGNITION GOES A LONG WAY")}</span><h2>{tx("Celebrate someone")}</h2><p>{tx("Awarded by the host. Celebration awards do not change leaderboard points.")}</p><label>{tx("Player")}<select required value={id} onChange={e => setId(e.target.value)}><option dir="auto" value="">{tx("Choose a player")}</option>{tx(data.profiles.filter(p => !p.archived || p.id === profileId).map(p => <option dir="auto" key={p.id} value={p.id}>{tx(p.avatar)}{tx(" ")}{p.name}</option>))}</select></label><label>{tx("Award")}<select value={title} onChange={e => setTitle(e.target.value)}>{tx(awardTitles.map(t => <option dir="auto" key={t} value={t}>{tx(t)}</option>))}</select></label><label>{tx("Game (optional)")}<select value={game} onChange={e => setGame(e.target.value)}><option dir="auto" value="">{tx("Whole gathering")}</option>{tx(games.map(g => <option dir="auto" key={g.id} value={g.id}>{tx(g.name)}</option>))}</select></label><label>{tx("Message from the host")}<textarea dir="auto" maxLength={240} value={note} onChange={e => setNote(e.target.value)}/></label>{tx((warning || error) && <p role="alert">{accountMessage(warning || error)}</p>)}<button className="primary wide" type="submit">{tx("Create certificate ")}<Trophy size={16}/></button></form></div>;
}
function PartyEditor({ onClose }: {
    onClose: () => void;
}) {
    const { data, commit, error, source } = useClub();
    const [title, setTitle] = useState(tx('Our game gathering'));
    const [players, setPlayers] = useState<string[]>([]);
    const [plan, setPlan] = useState<string[]>([]);
    const [warning, warn] = useState('');
    return <div className="modal-backdrop" onClick={onClose}><form className="setup-modal" role="dialog" aria-modal="true" aria-label={tx("Create a party")} onClick={e => e.stopPropagation()} onSubmit={async e => { e.preventDefault(); if (!players.length) {
        warn('Choose at least one player.');
        return;
    } const p: Party = { id: uid(), title: title.trim() || 'Our game gathering', date: new Date().toISOString(), players, games: plan, status: 'active' }; if (await commit({ ...data, parties: [p, ...data.parties], activePartyId: p.id }))
        onClose(); }}><button type="button" className="close" aria-label={tx("Close party editor")} onClick={onClose}><X /></button><span className="eyebrow">{tx("YOUR COFFEE-TABLE TOURNAMENT")}</span><h2>{tx("Make it a gathering")}</h2><label>{tx("Party name")}<input dir="auto" maxLength={80} value={title} onChange={e => setTitle(e.target.value)}/></label><h3>{tx("Who\u2019s coming?")}</h3><div className="club-checks">{tx(data.profiles.filter(p => !p.archived).map(p => <label className="checkbox" key={p.id}><input type="checkbox" checked={players.includes(p.id)} onChange={() => setPlayers(players.includes(p.id) ? players.filter(id => id !== p.id) : [...players, p.id])}/>{tx(p.avatar)}{tx(" ")}<bdi>{p.name}</bdi>{tx(p.kind === 'guest' ? ' · Guest' : '')}</label>))}</div><h3>{tx("Game plan (optional)")}</h3><div className="club-checks">{tx(games.map(g => <label className="checkbox" key={g.id}><input type="checkbox" checked={plan.includes(g.id)} onChange={() => setPlan(plan.includes(g.id) ? plan.filter(id => id !== g.id) : [...plan, g.id])}/>{tx(g.name)}</label>))}</div>{tx((warning || error) && <p role="alert">{accountMessage(warning || error)}</p>)}<button className="primary wide" type="submit">{tx("Start party")}</button></form></div>;
}
function ClubhouseContent({ onPlay }: {
    onPlay: (gameId?: string, partyId?: string | null) => void;
}) {
    const { data, commit, error, source } = useClub();
    const [tab, setTab] = useState('Overview');
    const [editor, setEditor] = useState<Profile | true | null>(null);
    const [selected, setSelected] = useState<string | null>(null);
    const [awardFor, setAwardFor] = useState<string | null>(null);
    const [suggestedTitle, setSuggestedTitle] = useState('Creative Spark');
    const [certificate, setCertificate] = useState<Award | null>(null);
    const [partyEditor, setPartyEditor] = useState(false);
    const [audience, setAudience] = useState('child');
    const [guestFilter, setGuestFilter] = useState('family');
    const [month, setMonth] = useState(monthKey());
    const [game, setGame] = useState('');
    const [level, setLevel] = useState('');
    const [metric, setMetric] = useState('points');
    const [party, setParty] = useState('');
    const [message, setMessage] = useState('');
    const [confirm, setConfirm] = useState('');
    const [mergeTarget, setMergeTarget] = useState('');
    const [pendingBackup, setPendingBackup] = useState<ClubData | null>(null);
    const active = data.parties.find(p => p.id === data.activePartyId && p.status === 'active');
    const profile = data.profiles.find(p => p.id === selected);
    const people = data.profiles.filter(p => p.audience === audience && (guestFilter === 'all' || p.kind === guestFilter));
    const rankingMetric = metric === 'best' && (!game || !level) ? 'points' : metric;
    const ranking = people.map(p => ({ p, s: profileStats(data, p.id, month || undefined, game || undefined, party || undefined, level || undefined) })).sort((a, b) => (rankingMetric === 'best' ? (b.s.best ?? -Infinity) - (a.s.best ?? -Infinity) : rankingMetric === 'wins' ? b.s.wins - a.s.wins : b.s.points - a.s.points) || b.s.wins - a.s.wins || a.p.name.localeCompare(b.p.name));
    async function erase(p: Profile) { if (confirm !== p.id) {
        setConfirm(p.id);
        return;
    } await commit(removeProfile(data, p.id)); setSelected(null); setConfirm(''); }
    const profileCard = (p: Profile) => <button className="club-profile-card" key={p.id} onClick={() => setSelected(p.id)}><span className="club-avatar" style={{ background: p.color }}>{tx(p.avatar)}</span><strong><bdi>{p.name}</bdi></strong><span>{tx(p.kind === 'guest' ? (p.retained ? 'Returning friend' : 'Guest today') : 'Family')}{tx(" \u00B7 ")}{tx(p.audience === 'adult' ? 'Adult' : 'Child')}{tx(p.archived ? ' · Archived' : '')}</span><div><b>{tx(profileStats(data, p.id).played)}</b>{tx(" games ")}<b>{tx(profileStats(data, p.id).points)}</b>{tx(" club points")}</div></button>;
    const awards = data.awards.filter(a => !selected || a.profileId === selected);
    return <section className="section clubhouse"><div className="club-hero"><div><span className="eyebrow">{tx("YOUR PEOPLE. YOUR STORIES. YOUR LITTLE VICTORIES.")}</span><h1>{tx("The family clubhouse.")}</h1><p>{tx("A place for family, visiting friends and memories worth keeping.")}</p></div><button className="primary" onClick={() => setEditor(true)}><Plus size={18}/>{tx("Add player or guest")}</button></div><div className="club-device-note">{tx(source==='cloud'?'This is your private family. Changes are saved to your account after the server confirms them.':'Device-only Clubhouse. Anyone using this browser can open it. Sign in above for private family storage.')}</div>{tx(error && <p role="alert" className="feedback">{accountMessage(error)}</p>)}{tx(message && <p role="status" className="feedback">{tx(message)}</p>)}<div className="category-tabs club-tabs">{tx(['Overview', 'Players', 'Leaderboards', 'Parties', 'Awards'].map(t => <button className={tab === t ? 'active' : ''} key={t} onClick={async () => { setTab(t); setSelected(null); }}>{tx(t)}</button>))}</div>
 {tx(profile ? <div className="club-profile-detail"><button className="text-button" onClick={() => setSelected(null)}>{tx("\u2190 Back to players")}</button><div className="section-heading"><div className="club-profile-title"><span className="club-avatar" style={{ background: profile.color }}>{tx(profile.avatar)}</span><div><h2><bdi>{profile.name}</bdi></h2><p>{tx(profile.kind === 'guest' ? 'Guest player' : 'Family member')}{tx(" \u00B7 ")}{tx(profile.audience === 'adult' ? 'Adult standings' : 'Children’s standings')}</p></div></div><div className="actions"><button className="secondary" onClick={() => setEditor(profile)}>{tx("Edit profile")}</button><button className="primary" onClick={() => setAwardFor(profile.id)}>{tx("Give an award")}</button></div></div><div className="club-stat-grid"><div><strong>{tx(profileStats(data, profile.id).played)}</strong>{tx("Games played")}</div><div><strong>{tx(profileStats(data, profile.id).wins)}</strong>{tx("Game wins")}</div><div><strong>{tx(profileStats(data, profile.id).points)}</strong>{tx("Club points")}</div><div><strong>{tx(data.awards.filter(a => a.profileId === profile.id).length)}</strong>{tx("Awards")}</div></div><h3>{tx("Game records")}</h3><div className="club-game-records">{tx(games.map(g => { const stats = profileStats(data, profile.id, undefined, g.id); return stats.played ? <article key={g.id}><h3>{tx(g.name)}</h3><p>{tx(stats.played)}{tx(" games \u00B7 ")}{tx(stats.wins)}{tx(" wins \u00B7 ")}{tx(stats.points)}{tx(" club points")}</p>{tx(['Easy', 'Medium', 'Hard'].map(d => { const s = profileStats(data, profile.id, undefined, g.id, undefined, d); return s.played ? <p key={d} className="small">{tx(d)}{tx(": ")}{tx(s.played)}{tx(" played \u00B7 Best individual score: ")}{tx(s.best ?? 'Unscored / team play')}</p> : null; }))}</article> : null; }))}</div><h3>{tx("Trophy cabinet")}</h3><div className="club-award-grid">{tx(awards.map(a => <button className="club-award-card" key={a.id} onClick={() => setCertificate(a)}><Trophy /><strong>{tx(a.title)}</strong><span>{tx(dateLabel(a.date))}</span></button>))}</div>{tx(!awards.length && <p>{tx("No trophies yet. Every good story starts somewhere.")}</p>)}<h3>{tx("Confirmed game history")}</h3>{tx(data.results.filter(r => r.entries.some(e => e.profileId === profile.id)).map(r => { const e = r.entries.find(e => e.profileId === profile.id)!; return <article className="club-history" key={r.id}><div><strong>{tx(gameName(r.gameId))}</strong><p>{tx(r.difficulty)}{tx(" \u00B7 ")}{tx(dateLabel(r.date))}{tx(" \u00B7 ")}{tx(e.team ? 'Team score' : r.cooperative ? 'Together' : e.winner ? 'Winner' : 'Played')}{tx(e.score !== null ? ` · ${e.score} points` : '')}</p></div><button className="text-button" onClick={async () => { if (confirm !== r.id) {
            setConfirm(r.id);
            return;
        } commit({ ...data, results: data.results.filter(x => x.id !== r.id) }); setConfirm(''); }}>{tx(confirm === r.id ? 'Confirm remove result' : 'Remove result')}</button></article>; }))}<details><summary>{tx("Manage this profile")}</summary><div className="actions"><button className="secondary" onClick={() => commit({ ...data, profiles: data.profiles.map(p => p.id === profile.id ? { ...p, archived: !p.archived } : p) })}>{tx(profile.archived ? 'Restore player' : 'Archive player')}</button><button className="text-button" onClick={() => erase(profile)}>{tx(confirm === profile.id ? 'Confirm remove profile and its records' : 'Remove profile and its records')}</button></div><p className="small">{tx("Archive hides a player from selection but keeps history. Removing deletes their results and certificates from this device.")}</p><label>{tx("Combine this profile into")}<select value={mergeTarget} onChange={e => { setMergeTarget(e.target.value); setConfirm(''); }}><option dir="auto" value="">{tx("Choose another profile")}</option>{tx(data.profiles.filter(p => p.id !== profile.id).map(p => <option dir="auto" key={p.id} value={p.id}>{p.name}</option>))}</select></label><button className="secondary" disabled={!mergeTarget} onClick={async () => { if (confirm !== 'merge') {
            setConfirm('merge');
            return;
        } try {
            if (await commit(mergeProfiles(data, profile.id, mergeTarget))) {
                setSelected(mergeTarget);
                setMergeTarget('');
                setConfirm('');
            }
        }
        catch (e) {
            setMessage(localizedError(e));
        } }}>{tx(confirm === 'merge' ? 'Confirm combine profiles' : 'Combine duplicate profiles')}</button><p className="small">{tx("Results and awards move to the chosen profile. The same game is counted once, even if both profiles took part.")}</p></details></div> : <>
 {tx(tab === 'Overview' && <><div className="club-stat-grid"><div><strong>{tx(data.profiles.filter(p => !p.archived).length)}</strong>{tx("Players & friends")}</div><div><strong>{tx(data.results.length)}</strong>{tx("Confirmed games")}</div><div><strong>{tx(data.parties.length)}</strong>{tx("Gatherings")}</div><div><strong>{tx(data.awards.length)}</strong>{tx("Little victories")}</div></div>{tx(active ? <div className="resume-banner club-party-banner"><div><span className="eyebrow">{tx("CURRENT PARTY")}</span><h2><bdi>{active.title}</bdi></h2><p>{tx(active.players.length)}{tx(" players \u00B7 ")}{tx(data.results.filter(r => r.partyId === active.id).length)}{tx(" confirmed games")}</p></div><button className="primary" onClick={() => onPlay()}>{tx("Choose a party game ")}<ArrowRight size={16}/></button></div> : <div className="quick-banner club-party-banner"><div><h2>{tx("Friends coming over?")}</h2><p>{tx("Make a party, keep the results together and finish with certificates.")}</p></div><button className="primary" onClick={async () => { setTab('Parties'); if (data.profiles.length)
            setPartyEditor(true); }}>{tx("Plan a gathering")}</button></div>)}<div className="section-heading"><div><h2>{tx("Your people")}</h2><p>{tx("Family members and returning friends, ready for another round.")}</p></div><button className="text-button" onClick={() => setTab('Players')}>{tx("See all players \u2192")}</button></div><div className="club-profile-grid">{tx(data.profiles.filter(p => !p.archived).slice(0, 4).map(profileCard))}</div>{tx(!data.profiles.length && <div className="empty"><Users size={32}/><h2>{tx("Make room for your first player.")}</h2><p>{tx("Add a nickname and avatar, then save a confirmed result after a game.")}</p><button className="primary" onClick={() => setEditor(true)}>{tx("Add your first player")}</button></div>)}<div className="club-points-explainer"><h3>{tx("A fairer way to play together")}</h3><p>{tx("Each confirmed game earns ")}<b>{tx("3 club points for taking part")}</b>{tx(", plus ")}<b>{tx("2 for a win")}</b>{tx(" or ")}<b>{tx("2 for completing a cooperative game together")}</b>{tx(". Ties earn the same win bonus. Celebration awards do not add points.")}</p><p className="small">{tx("Game scores stay in each game\u2019s records. Overall standings use club points. Adults and children have separate boards. All awards and results are confirmed by the host.")}</p></div></>)}
 {tx(tab === 'Players' && <><div className="section-heading"><div><h2>{tx("Everyone belongs at this table.")}</h2><p>{tx("Save family members, today\u2019s guests and returning friends.")}</p></div></div><div className="club-profile-grid">{tx(data.profiles.map(profileCard))}</div>{tx(!data.profiles.length && <p>{tx("Add a player to begin.")}</p>)}</>)}
 {tx(tab === 'Leaderboards' && <><h2>{tx("A little friendly competition.")}</h2><div className="filters"><label>{tx("Standings")}<select value={audience} onChange={e => setAudience(e.target.value)}><option dir="auto" value="child">{tx("Children")}</option><option dir="auto" value="adult">{tx("Adults")}</option></select></label><label>{tx("Players")}<select value={guestFilter} onChange={e => setGuestFilter(e.target.value)}><option dir="auto" value="family">{tx("Family")}</option><option dir="auto" value="guest">{tx("Guests")}</option><option dir="auto" value="all">{tx("Everyone")}</option></select></label><label>{tx("Month")}<input type="month" value={month} onChange={e => setMonth(e.target.value)}/></label><button className="text-button" onClick={() => setMonth('')}>{tx("All time")}</button><label>{tx("Game")}<select value={game} onChange={e => setGame(e.target.value)}><option dir="auto" value="">{tx("Overall club points")}</option>{tx(games.map(g => <option dir="auto" key={g.id} value={g.id}>{tx(g.name)}</option>))}</select></label><label>{tx("Level")}<select value={level} onChange={e => setLevel(e.target.value)}><option dir="auto" value="">{tx("All levels")}</option>{tx(['Easy', 'Medium', 'Hard'].map(d => <option dir="auto" key={d} value={d}>{tx(d)}</option>))}</select></label><label>{tx("Rank by")}<select aria-label={tx("Leaderboard ranking metric")} value={rankingMetric} onChange={e => setMetric(e.target.value)}><option dir="auto" value="points">{tx("Club points")}</option><option dir="auto" value="wins">{tx("Confirmed wins")}</option><option dir="auto" value="best" disabled={!game || !level}>{tx("Best individual score \u00B7 choose game & level")}</option></select></label><label>{tx("Gathering")}<select value={party} onChange={e => setParty(e.target.value)}><option dir="auto" value="">{tx("All gatherings")}</option>{tx(data.parties.map(p => <option dir="auto" key={p.id} value={p.id}>{p.title}</option>))}</select></label></div><div className="club-ranking">{tx(ranking.map(({ p, s }, i) => <button key={p.id} onClick={() => setSelected(p.id)}><span>{tx(i + 1)}</span><span className="club-avatar small-avatar" style={{ background: p.color }}>{tx(p.avatar)}</span><span><strong><bdi>{p.name}</bdi></strong><small>{tx(s.played)}{tx(" games \u00B7 ")}{tx(s.wins)}{tx(" wins")}{tx(p.archived ? ' · Archived' : '')}</small></span><b>{tx(rankingMetric === 'best' ? s.best ?? '—' : rankingMetric === 'wins' ? s.wins : s.points)}<small>{tx(rankingMetric === 'best' ? 'best score' : rankingMetric === 'wins' ? 'wins' : 'club points')}</small></b></button>))}</div>{tx(!ranking.some(r => r.s.played) && <p className="feedback">{tx("No confirmed games for these filters yet. Save a result after playing to get started.")}</p>)}{tx(rankingMetric === 'points' && month && ranking[0]?.s.points > 0 && <div className="club-month-winner"><Trophy /><div><h3>{tx("Player of the month \u00B7 ")}{tx(month)}</h3><p>{tx(ranking.filter(r => r.s.points === ranking[0].s.points).map(r => r.p.name).join(' & '))}{tx(" lead these standings with ")}{tx(ranking[0].s.points)}{tx(" club points.")}</p><button className="text-button" onClick={async () => { setSuggestedTitle('Player of the Month'); setAwardFor(ranking[0].p.id); }}>{tx("Create a celebration certificate \u2192")}</button></div></div>)}<div className="club-points-explainer"><h3>{tx("Drawing champions")}</h3><p>{tx("Based on Drawing Champion titles awarded by the host, rather than automatically judging drawings.")}</p>{tx(people.map(p => ({ p, count: data.awards.filter(a => a.profileId === p.id && a.title === 'Drawing Champion' && (!month || clubMonth(a.date) === month) && (!game || a.gameId === game) && (!party || a.partyId === party) && (!level || data.results.find(r => r.id === a.resultId)?.difficulty === level)).length })).filter(v => v.count).sort((a, b) => b.count - a.count).map(({ p, count }) => <p key={p.id}>{tx(p.avatar)}{tx(" ")}<bdi>{p.name}</bdi>{tx(" \u00B7 ")}{tx(count)}{tx(" drawing ")}{tx(count === 1 ? 'win' : 'wins')}</p>))}</div></>)}
 {tx(tab === 'Parties' && <><div className="section-heading"><div><h2>{tx("Bring your people together.")}</h2><p>{tx("Choose a roster and a game plan. Confirmed results build the party standings.")}</p></div><button className="primary" disabled={!data.profiles.some(p => !p.archived)} onClick={() => setPartyEditor(true)}><Plus size={16}/>{tx("Create party")}</button></div>{tx(!data.profiles.length && <p>{tx("Add family members and guest profiles before creating a party.")}</p>)}{tx(data.parties.map(p => <article className="club-party-card" key={p.id}><div className="section-heading"><div><span className="eyebrow">{tx(p.status === 'finished' ? 'FINISHED' : p.id === data.activePartyId ? 'CURRENT PARTY' : 'SAVED PARTY')}</span><h2><bdi>{p.title}</bdi></h2><p>{tx(dateLabel(p.date))}{tx(" \u00B7 ")}{tx(p.players.map(id => data.profiles.find(v => v.id === id)?.name).filter(Boolean).join(', '))}</p></div>{tx(p.status === 'active' && <button className="secondary" onClick={() => commit({ ...data, activePartyId: p.id })}>{tx("Use this party")}</button>)}</div><div className="club-game-plan">{tx(p.games.map(id => <button className="secondary" key={id} onClick={async () => { commit({ ...data, activePartyId: p.status === 'active' ? p.id : null }); onPlay(id, p.status === 'active' ? p.id : null); }}>{tx(data.results.some(r => r.partyId === p.id && r.gameId === id) ? '✓ ' : '')}{tx(gameName(id))}</button>))}</div><div className="club-party-standings">{tx(['child', 'adult'].map(audience => { const people = p.players.map(id => ({ player: data.profiles.find(v => v.id === id), s: profileStats(data, id, undefined, undefined, p.id) })).filter(v => v.player?.audience === audience).sort((a, b) => b.s.points - a.s.points); return people.length ? <div key={audience}><h3>{tx(audience === 'child' ? 'Children’s standings' : 'Adult standings')}</h3>{tx(people.map(({ player, s }) => <p key={player!.id}>{tx(player!.avatar)}{tx(" ")}<bdi>{player!.name}</bdi>{tx(" \u00B7 ")}{tx(s.points)}{tx(" club points \u00B7 ")}{tx(s.played)}{tx(" games")}</p>))}</div> : null; }))}</div><div className="actions">{tx(p.status === 'active' && <><button className="primary" onClick={async () => { commit({ ...data, activePartyId: p.id }); onPlay(undefined, p.id); }}>{tx("Play a game")}</button><button className="secondary" onClick={() => commit({ ...data, parties: data.parties.map(v => v.id === p.id ? { ...v, status: 'finished' } : v), activePartyId: data.activePartyId === p.id ? null : data.activePartyId })}>{tx("Finish party")}</button></>)}<button className="text-button" onClick={async () => { setAwardFor(''); setParty(p.id); }}>{tx("Give party awards")}</button></div></article>))}</>)}
 {tx(tab === 'Awards' && <><div className="section-heading"><div><h2>{tx("Small victories. Big smiles.")}</h2><p>{tx("Celebrate creativity, good sportsmanship and brilliant teamwork.")}</p></div><button className="primary" disabled={!data.profiles.length} onClick={() => setAwardFor('')}><Trophy size={16}/>{tx("Give an award")}</button></div><div className="club-award-grid">{tx(data.awards.map(a => <button className="club-award-card" key={a.id} onClick={() => setCertificate(a)}><Trophy /><strong>{tx(a.title)}</strong><span><bdi>{a.name}</bdi></span><small>{tx(dateLabel(a.date))}</small></button>))}</div>{tx(!data.awards.length && <p>{tx("No awards yet. Create one after a memorable game.")}</p>)}</>)}
 </>)}
 <details className="club-backup"><summary>{tx("Keep your clubhouse safe \u00B7 Backup & restore")}</summary><p>{tx("Your profiles and results are stored on this device, not in a shared account. Export a backup before switching browsers or clearing browser data.")}</p><button className="secondary" onClick={() => downloadFile('paperclub-clubhouse-backup.json', JSON.stringify(data, null, 2), 'application/json')}><Download size={16}/>{tx("Export backup")}</button><label>{tx("Restore from a Paperclub backup")}<input type="file" accept="application/json,.json" onChange={async (e) => { const file = e.target.files?.[0]; if (!file)
        return; if (file.size > 5000000) {
        setMessage('Choose a backup smaller than 5 MB.');
        return;
    } try {
        const imported = validateClub(JSON.parse(await file.text()));
        if (data.profiles.length || data.results.length) {
            setMessage('A backup is ready to restore. This replaces the clubhouse on this device; export your current backup first.');
            setPendingBackup(imported);
            setConfirm('restore');
        }
        else if (await commit(imported))
            setMessage('Clubhouse restored.');
    }
    catch (e) {
        setMessage(localizedError(e));
    } }}/></label>{tx(confirm === 'restore' && <div className="actions"><button className="primary" onClick={async () => { try {
        const pending = pendingBackup;
        if (await commit(validateClub(pending))) {
            setPendingBackup(null);
            setConfirm('');
            setMessage('Clubhouse restored.');
        }
    }
    catch (e) {
        setMessage(localizedError(e));
    } }}>{tx("Replace clubhouse with backup")}</button><button className="secondary" onClick={async () => { setPendingBackup(null); setConfirm(''); setMessage('Restore cancelled.'); }}>{tx("Cancel restore")}</button></div>)}</details>
 {tx(editor && <ProfileEditor profile={editor === true ? undefined : editor} onClose={() => setEditor(null)}/>)}{tx(" ")}{tx(partyEditor && <PartyEditor onClose={() => setPartyEditor(false)}/>)}{tx(" ")}{tx(awardFor !== null && <AwardEditor initialTitle={suggestedTitle} profileId={awardFor || undefined} partyId={party || active?.id} onClose={() => { setAwardFor(null); setSuggestedTitle('Creative Spark'); }} onSaved={a => setCertificate(a)}/>)}{tx(" ")}{tx(certificate && <Certificate award={certificate} onClose={() => setCertificate(null)}/>)}</section>;
}

export default function Clubhouse(props:{onPlay:(gameId?:string,partyId?:string|null)=>void}){const account=useAccount(),club=useClub();return <><FamilyAccounts/>{account.user&&!account.selected?null:club.loading?<section className="section"><p role="status">{tx('Loading your private family…')}</p></section>:<fieldset className="club-write-scope" disabled={club.saveState!=='saved'||account.selected?.role==='viewer'}><ClubhouseContent key={account.user?.id+':'+account.selected?.id} {...props}/></fieldset>}</>}
