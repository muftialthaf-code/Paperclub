import test from 'node:test';import assert from 'node:assert/strict';
import{Rooms,ROOM_LIMITS}from'./business/rooms';
import{dilemmaPools}from'../../src/creativeGames';import{likelyTo}from'../../src/content/friendsContent';
const pair=dilemmaPools.Medium[0];const likely=`Who at the table is most likely to ${likelyTo.Medium[0]}?`;
const err=(fn:()=>unknown,code:string)=>assert.throws(fn,(e:any)=>e.code===code||e.message===code||String(e.message).includes(code));
test('Table Vote: a Would You Rather room scores the majority and hides votes until the reveal',()=>{
 const r=new Rooms();const h=r.create('L1','rather','Host');const a=r.join('L1',h.code,'Amal'),c=r.join('L1',h.code,'Sami');
 r.round('L1',h.code,h.key,{a:pair.a,b:pair.b,text:'x'});
 r.vote('L1',h.code,h.key,'A');r.vote('L1',h.code,a.key,'A');r.vote('L1',h.code,c.key,'B');
 const mid=r.state('L1',h.code,a.key);assert.equal(mid.tally,null);assert.equal(mid.players.find(p=>p.id===c.playerId)!.voted,true);assert.equal(mid.me.vote,'A');
 const done=r.reveal('L1',h.code,h.key);assert.deepEqual(done.tally,{A:2,B:1});assert.deepEqual(done.players.map(p=>p.score),[1,1,0]);
 r.round('L1',h.code,h.key,{a:pair.a,b:pair.b});r.vote('L1',h.code,h.key,'A');r.vote('L1',h.code,a.key,'B');assert.deepEqual(r.reveal('L1',h.code,h.key).winners,[]);
});
test('Table Vote: Most Likely To awards the most-voted player, ties share the point',()=>{
 const r=new Rooms();const h=r.create('L1','likely','Host');const a=r.join('L1',h.code,'Amal');r.round('L1',h.code,h.key,{text:likely});
 r.vote('L1',h.code,h.key,a.playerId);r.vote('L1',h.code,a.key,a.playerId);const s=r.reveal('L1',h.code,h.key);assert.deepEqual(s.winners,[a.playerId]);assert.equal(s.players.find(p=>p.id===a.playerId)!.score,1);
 err(()=>r.vote('L1',h.code,h.key,'nobody'),'not_voting');r.round('L1',h.code,h.key,{text:likely});err(()=>r.vote('L1',h.code,h.key,'nobody'),'invalid_choice');
});
test('Table Vote: only shipped prompts, only the host, only this venue, bounded rooms and names',()=>{
 const r=new Rooms();const h=r.create('L1','rather','Host');const a=r.join('L1',h.code,'Amal');
 err(()=>r.round('L1',h.code,h.key,{a:'Free text',b:'From a guest'}),'prompt_not_allowed');
 err(()=>r.round('L1',h.code,a.key,{a:pair.a,b:pair.b}),'host_only');err(()=>r.reveal('L1',h.code,a.key),'host_only');
 err(()=>r.state('L2',h.code,h.key),'room_not_found');err(()=>r.state('L1',h.code,'bad-key'),'not_in_room');err(()=>r.join('L1',h.code,'amal'),'name_taken');
 err(()=>r.create('L1','quiz','x'),'invalid_kind');{const b=r.join('L1',h.code,'<b>Bad</b>\u0007name that is much too long for a table');const nm=r.state('L1',h.code,b.key).me.id&&r.state('L1',h.code,b.key).players.find(p=>p.id===b.playerId)!.name;assert.ok(nm.length<=20&&!/[<>\u0007]/.test(nm))}
 const full=new Rooms();const f=full.create('L1','rather','H');for(let i=1;i<ROOM_LIMITS.players;i++)full.join('L1',f.code,'P'+i);err(()=>full.join('L1',f.code,'Late'),'room_full');
 const many=new Rooms();for(let i=0;i<ROOM_LIMITS.roomsPerLocation;i++)many.create('L1','rather','H');err(()=>many.create('L1','rather','H'),'too_many_rooms');many.create('L2','rather','H');
});
test('Table Vote: rooms expire when idle and finish when the host leaves',()=>{
 let t=1_000_000;const r=new Rooms(()=>t);const h=r.create('L1','rather','Host');const a=r.join('L1',h.code,'Amal');r.leave('L1',h.code,h.key);assert.equal(r.state('L1',h.code,a.key).phase,'finished');err(()=>r.join('L1',h.code,'Late'),'room_finished');
 t+=ROOM_LIMITS.idle+1;err(()=>r.state('L1',h.code,a.key),'room_not_found');
});
