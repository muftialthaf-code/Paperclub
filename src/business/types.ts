export type VenueBrand={displayName:string,welcomeEn:string,welcomeAr:string,primary:string,background:string,logoId:string|null,games:string[]};
export type VenuePrompt={id:string,gameId:string,locale:'en'|'ar-SA',difficulty:'Easy'|'Medium'|'Hard',text:string,status:'pending'|'approved'|'rejected'};
export type Business={id:string,name:string,status:'pending'|'active'|'suspended',contactEmail:string,accessUntil:string|null,role?:'owner'|'manager'|'staff'|'platform',locationId?:string|null};
export type VenueLocation={id:string,businessId:string,slug:string,name:string,status:'draft'|'active'|'suspended',timezone:string,rotationHour:number,sessionMinutes:number,draft:VenueBrand,published:VenueBrand|null,revision:number};
export type VenueAccess={venue:{id:string,slug:string,name:string,brand:VenueBrand},session:{expiresAt:string,serverNow:string},prompts:VenuePrompt[]};
export const themedGameIds=['speed','impossible','invent','np-topics','np-convince','np-scenario'];
