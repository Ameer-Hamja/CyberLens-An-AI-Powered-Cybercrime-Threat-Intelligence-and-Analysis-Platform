export type Verdict='SAFE'|'SUSPICIOUS'|'DANGEROUS';
export interface ScanResult {verdict:Verdict;score:number;reasons:string[];category:string}
export type ScanState={status:'ready';result:ScanResult}|{status:'offline'|'error';message:string};
export interface Alert {id:string;threatType:string;severity:number;citizenExplanation:string;createdAt:string;geoTags:string[]}
export interface Stats {totalThreats:number;threatsToday:number;highSeverityCount:number;totalScans:number}
export interface Settings {backendUrl:string;dashboardUrl:string;autoScan:boolean;linkScanning:boolean;notifications:boolean;minimumSeverity:number;allowlist:string[];blocklist:string[]}
export type Message={type:'SCAN_URL';url:string;force?:boolean;tabId?:number}|{type:'SCAN_TEXT';text:string}|{type:'SCAN_LINKS';urls:string[]}|{type:'GET_FEED'}|{type:'GET_HEATMAP'}|{type:'SETTINGS_CHANGED'}|{type:'REPORT_METADATA'};
