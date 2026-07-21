export type ClaimStatus = "unreviewed" | "under_review" | "corroborated" | "contested" | "refuted" | "retracted";

export const sources = [
  { id: "samdish", publisher: "Unfiltered by Samdish", type: "Primary video", url: "https://www.youtube.com/watch?v=6MTXCAaOy3o", title: "Good Afternoon India — Dekh Lo Humaara 'Naya Bharat'", note: "56-minute ground report published July 20, 2026. Third-party link; no original file has been acquired." },
  { id: "ap", publisher: "Associated Press", type: "Wire report", url: "https://apnews.com/article/india-cockroach-janta-party-sonam-wangchuk-hunger-strike-cbeb4773e89d67250f0bcad1670fcd38", title: "Thousands gather to attempt a march to Parliament", note: "On-ground account and photographs of baton and tear-gas use." },
  { id: "ht", publisher: "Hindustan Times", type: "Chronology", url: "https://www.hindustantimes.com/india-news/jantar-mantar-cjp-protest-a-blow-by-blow-account-of-what-happened-on-monday-delhi-101784604090492-amp.html", title: "A blow-by-blow account of what happened", note: "Time-ordered reporting across Jantar Mantar and central Delhi." },
  { id: "pti", publisher: "PTI / ThePrint", type: "Official account", url: "https://theprint.in/india/118-police-personnel-injured-70-protesters-detained-as-cjp-protest-turns-violent-in-delhi/2991722/", title: "Delhi Police statement on injuries and detentions", note: "Police account alleging violence and property damage." },
  { id: "amnesty", publisher: "Amnesty International", type: "Rights statement", url: "https://www.amnesty.org.uk/latest/india-delhi-police-crackdown-on-peaceful-protesters-demanding-exam-justice-must-be-investigated/", title: "Police crackdown must be investigated", note: "Rights analysis and call for an investigation." },
  { id: "iff", publisher: "Internet Freedom Foundation", type: "Digital rights", url: "https://internetfreedom.in/iff-condemns-the-internet-shutdown-in-parts-of-central-delhi-no-suspension-order-has-been-made-public/", title: "Internet shutdown in parts of Central Delhi", note: "Documents the reported suspension and absence of a public order at publication time." },
  { id: "week", publisher: "The Week", type: "News report", url: "https://www.theweek.in/news/india/2026/07/20/cjp-neet-protest-jantar-mantar-parliament-march.html", title: "Police lathi-charge protesters as thousands join march", note: "Early reporting on the gathering and police response." },
];

export const event = {
  slug: "jantar-mantar-july-20",
  title: "Jantar Mantar ‘Chalo Sansad’ protest",
  date: "20 July 2026",
  location: "New Delhi, India",
  lastReviewed: "21 July 2026 · 14:30 IST",
  timeline: [
    { time: "08:30", title: "Police and organizers enter talks", body: "Police officials and CJP representatives reportedly begin discussions as crowds gather around the designated protest area.", citations: ["ht"] },
    { time: "09:00", title: "Access points are sealed", body: "Entry and exit constraints around Jantar Mantar contribute to the crowd spreading into surrounding roads.", citations: ["ht", "ap"] },
    { time: "10:30", title: "Barricades are breached", body: "Reporting describes sections of the crowd pushing through barricades, followed by baton use and competing accounts of stone throwing.", citations: ["ht", "ap"] },
    { time: "12:12", title: "Organizers ask protesters to remain", body: "CJP founder Abhijeet Dipke reportedly says government contact has been established and asks supporters to stay at Jantar Mantar.", citations: ["ht"] },
    { time: "13:40", title: "Groups reach the Parliament area", body: "Smaller groups reach roads near Parliament. Tear-gas shells are fired at multiple locations.", citations: ["ht", "ap"] },
    { time: "16:00", title: "Protest infrastructure is dismantled", body: "Security personnel remove tents, banners, and the stage as remaining protesters are dispersed.", citations: ["ht", "samdish"] },
    { time: "18:40", title: "Clearance operation concludes", body: "The remaining protest infrastructure is removed. Organizers later state that the wider protest will continue.", citations: ["ht", "ap"] },
  ],
  claims: [
    { id: "c1", title: "Police and RAF used batons and tear gas", summary: "Multiple independent reports and visual records support the occurrence; necessity and proportionality remain contested.", status: "corroborated" as ClaimStatus, citations: ["ap", "ht", "week", "samdish"] },
    { id: "c2", title: "The Parliament march did not have police permission", summary: "The police position and advance reporting consistently state that no permission was granted for the march.", status: "corroborated" as ClaimStatus, citations: ["ap", "week"] },
    { id: "c3", title: "Police reported 118 personnel and around 60 protesters injured", summary: "These are attributed figures from the Delhi Police statement; independent medical totals have not been reviewed.", status: "contested" as ClaimStatus, citations: ["pti"] },
    { id: "c4", title: "Mobile internet was suspended in parts of Central Delhi", summary: "Rights reporting and contemporaneous accounts support a suspension; the authorizing order was not public when reviewed.", status: "corroborated" as ClaimStatus, citations: ["iff", "amnesty", "ht"] },
    { id: "c5", title: "Unidentified people in plain clothes used force", summary: "Footage and eyewitness allegations require frame-level review and independent identity or deployment records.", status: "under_review" as ClaimStatus, citations: ["samdish"] },
    { id: "c6", title: "Pellet weapons or electric shocks were used", summary: "Viral allegations are not supported by the reviewed seed-source set at this time.", status: "unreviewed" as ClaimStatus, citations: [] },
  ],
};

export type DocumentedActor = {
  id: string;
  observedRole: string;
  identityState: "anonymous_subject" | "suggested_private" | "verified_private" | "approved_public" | "withdrawn";
  reviewStatus: "unreviewed" | "under_review" | "corroborated" | "contested";
  reviewApprovals: number;
  timestampStart: string;
  timestampEnd: string;
  startSeconds: number;
  action: string;
  limits: string;
};

export const documentedActors: DocumentedActor[] = [
  {
    id: "SV-SAM-C01",
    observedRole: "Person or people described as wearing civilian clothing",
    identityState: "anonymous_subject",
    reviewStatus: "unreviewed",
    reviewApprovals: 0,
    timestampStart: "00:52",
    timestampEnd: "01:20",
    startSeconds: 52,
    action: "A protester alleges that people in civilian clothing used force before the full police deployment.",
    limits: "This is an attributed allegation. The reviewed source does not establish the person’s identity, employer, or authority.",
  },
  {
    id: "SV-SAM-U01",
    observedRole: "Uniformed personnel during crowd dispersal",
    identityState: "anonymous_subject",
    reviewStatus: "under_review",
    reviewApprovals: 0,
    timestampStart: "14:18",
    timestampEnd: "14:25",
    startSeconds: 858,
    action: "Footage appears to show baton use during a confrontation with protesters.",
    limits: "No individual is named or linked to another clip. The necessity, sequence, and person responsible require frame-level review of an authorized original.",
  },
  {
    id: "SV-SAM-U02",
    observedRole: "Uniformed personnel near the media crew",
    identityState: "anonymous_subject",
    reviewStatus: "under_review",
    reviewApprovals: 0,
    timestampStart: "19:22",
    timestampEnd: "19:32",
    startSeconds: 1162,
    action: "The reporter draws attention to personnel whose nameplates are not readable in the published footage.",
    limits: "Absence of a readable nameplate in this view does not establish misconduct or a person’s identity.",
  },
  {
    id: "SV-SAM-R01",
    observedRole: "Riot-control personnel and equipment",
    identityState: "anonymous_subject",
    reviewStatus: "under_review",
    reviewApprovals: 0,
    timestampStart: "24:32",
    timestampEnd: "26:07",
    startSeconds: 1472,
    action: "The report documents baton use, a Vajra riot-control vehicle, and apparent tear-gas deployment during dispersal.",
    limits: "This record describes a scene, not a finding against a particular person. Individual responsibility has not been established.",
  },
  {
    id: "SV-SAM-U03",
    observedRole: "Uniformed personnel interacting with journalists",
    identityState: "anonymous_subject",
    reviewStatus: "under_review",
    reviewApprovals: 0,
    timestampStart: "45:10",
    timestampEnd: "45:39",
    startSeconds: 2710,
    action: "The reporter attempts to ask personnel about operational protocol and receives no substantive on-camera explanation.",
    limits: "The interaction is documented for accountability context; it is not categorized as violence and no identity is asserted.",
  },
];

export function getSource(id: string) { return sources.find((source) => source.id === id); }
