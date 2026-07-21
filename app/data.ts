export type ClaimStatus = "unreviewed" | "under_review" | "corroborated" | "contested" | "refuted" | "retracted";

export const sources = [
  { id: "samdish", publisher: "Unfiltered by Samdish", type: "Primary video", url: "https://www.youtube.com/watch?v=6MTXCAaOy3o", title: "Good Afternoon India — Dekh Lo Humaara 'Naya Bharat'", note: "56-minute ground report published July 20, 2026. A submitter-provided working copy was used for private frame review; publication rights remain pending and the original is access-controlled." },
  { id: "deshbhakt", publisher: "The DeshBhakt / Akash Banerjee", type: "Secondary video compilation", url: "https://www.youtube.com/watch?v=x2UMpWL-IU4", title: "Pt.10 | Brown Pants Unleash Havoc In Delhi", note: "22-minute commentary video supplied as a local working copy for protected review. Embedded clips are treated as secondary-source material; identities and the provenance of each inserted clip require separate verification." },
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
    { id: "c5", title: "Unidentified people in plain clothes used force", summary: "Footage and eyewitness allegations require frame-level review and independent identity or deployment records.", status: "under_review" as ClaimStatus, citations: ["samdish", "deshbhakt"] },
    { id: "c6", title: "Pellet weapons or electric shocks were used", summary: "Viral allegations are not supported by the reviewed seed-source set at this time.", status: "unreviewed" as ClaimStatus, citations: [] },
  ],
};

export type DocumentedActor = {
  id: string;
  sourceId?: string;
  privateOnly?: boolean;
  observedRole: string;
  identityState: "anonymous_subject" | "suggested_private" | "verified_private" | "approved_public" | "withdrawn";
  reviewStatus: "unreviewed" | "under_review" | "corroborated" | "contested";
  reviewApprovals: number;
  timestampStart: string;
  timestampEnd: string;
  startSeconds: number;
  action: string;
  limits: string;
  privateReviewFrame?: {
    timestamp: string;
    timestampSeconds: number;
    subjectBox: [number, number, number, number];
    derivativeSha256: string;
    note: string;
  };
  evidenceFrames?: Array<{
    id: string;
    timestamp: string;
    timestampSeconds: number;
    relation: "before_context" | "candidate_action" | "after_context" | "context_only";
    observation: string;
    continuityLimit: string;
    derivativeSha256: string;
  }>;
  identityEvidenceOpen?: boolean;
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
    timestampStart: "14:28",
    timestampEnd: "14:29",
    startSeconds: 868,
    action: "A reviewed frame shows an anonymous uniformed subject holding a raised baton during a crowded dispersal sequence.",
    limits: "The still does not show contact and is not a finding of brutality, identity, necessity, or proportionality. The surrounding sequence and a second source require independent review.",
    privateReviewFrame: {
      timestamp: "14:28.5",
      timestampSeconds: 868.5,
      subjectBox: [382, 105, 568, 536],
      derivativeSha256: "2ad296001fce54a9a31cf9360ab4690c7c6cc6bbf28bac582d28bd145049c6ac",
      note: "Background and visible faces are obscured in the private derivative. The box is a manual within-video marker, not a biometric match.",
    },
    evidenceFrames: [
      {
        id: "SV-SAM-P0038",
        timestamp: "14:28.0",
        timestampSeconds: 868,
        relation: "before_context",
        observation: "Multiple uniformed personnel and protesters occupy the same narrow dispersal corridor immediately before the selected frame.",
        continuityLimit: "This context frame does not independently establish which individual appears in the next frame.",
        derivativeSha256: "0ec1a50567c6480bb97cfa22ba5c51a548248919ec4947b8243081706025526d",
      },
      {
        id: "SV-SAM-P0039",
        timestamp: "14:28.5",
        timestampSeconds: 868.5,
        relation: "candidate_action",
        observation: "A uniformed subject appears with a baton raised during the crowd movement.",
        continuityLimit: "The still does not show contact, motive, necessity, or the subject's identity.",
        derivativeSha256: "aa59f16b77e3120c347b146993093dbc2ee7e728e2eab5a15342c658c35643c7",
      },
      {
        id: "SV-SAM-P0040",
        timestamp: "14:29.0",
        timestampSeconds: 869,
        relation: "after_context",
        observation: "Baton-bearing personnel continue moving through the same corridor half a second later.",
        continuityLimit: "Occlusion prevents a reliable finding that every visible body position belongs to the same subject.",
        derivativeSha256: "17903e430f3f87c650f8576c057963cdb978d031b697ce93abb156ffcf90326c",
      },
    ],
    identityEvidenceOpen: true,
  },
  {
    id: "SV-SAM-U04",
    observedRole: "Candidate uniformed subject in a green helmet during dispersal",
    identityState: "anonymous_subject",
    reviewStatus: "under_review",
    reviewApprovals: 0,
    timestampStart: "14:29",
    timestampEnd: "14:30",
    startSeconds: 869,
    action: "Adjacent frames appear to show a green-helmeted uniformed subject raising or holding a baton amid crowd movement.",
    limits: "No contact is visible in the selected stills. Continuity is a provisional within-sequence observation and is not biometric identification or a finding of brutality.",
    evidenceFrames: [
      {
        id: "SV-SAM-P0041",
        timestamp: "14:29.5",
        timestampSeconds: 869.5,
        relation: "candidate_action",
        observation: "A green-helmeted uniformed subject appears to hold a baton above shoulder height.",
        continuityLimit: "The frame does not show contact or establish identity.",
        derivativeSha256: "2e16a9c995cb5d175d853ce4c31afc0ebfd15a89eda0dd141429a5624e757333",
      },
      {
        id: "SV-SAM-P0042",
        timestamp: "14:30.0",
        timestampSeconds: 870,
        relation: "after_context",
        observation: "The green-helmeted subject remains visible in the adjacent dispersal scene.",
        continuityLimit: "Similarity of helmet and position is only a provisional within-sequence aid; it cannot support a real-world identity.",
        derivativeSha256: "117147a5c3893fdce4c552720d4241d3dd0d4b156b8b383a14ab19acd996292a",
      },
    ],
    identityEvidenceOpen: true,
  },
  {
    id: "SV-SAM-U05",
    observedRole: "Khaki-uniformed subject at the right edge of the dispersal line",
    identityState: "anonymous_subject",
    reviewStatus: "under_review",
    reviewApprovals: 0,
    timestampStart: "14:20.5",
    timestampEnd: "14:21",
    startSeconds: 860.5,
    action: "An adjacent-frame sequence appears to show a khaki-uniformed subject at the right edge holding an object consistent with a baton above shoulder height during crowd compression.",
    limits: "The subject is partly occluded. These frames do not show contact, establish intent, prove excessive force, or identify the person. Continuity is limited to this half-second scene position.",
    evidenceFrames: [
      { id: "SV-SAM-P0018", timestamp: "14:20.5", timestampSeconds: 860.5, relation: "candidate_action", observation: "At the upper-right edge, a khaki-uniformed subject appears with both arms raised around a baton-like object.", continuityLimit: "The object and hands are partly occluded; no contact is visible.", derivativeSha256: "c59f51c3e6c2a6e807fcc1aed2e29a7bd6363f00040d5407fca840da4ce225eb" },
      { id: "SV-SAM-P0019", timestamp: "14:21.0", timestampSeconds: 861, relation: "after_context", observation: "The same scene position remains visible half a second later as the crowd moves in front of the camera.", continuityLimit: "Foreground occlusion prevents a reliable view of the subject's full movement.", derivativeSha256: "fd09a828817d249f3faad665ba734fb20166dc27e77116f69819ae53466123c1" },
      { id: "SV-SAM-P0020", timestamp: "14:21.0", timestampSeconds: 861, relation: "after_context", observation: "A second derivative at the same source time preserves the surrounding crowd and police-line context.", continuityLimit: "This derivative is context, not independent corroboration or a separate incident.", derivativeSha256: "a3989103a825e38435930cbfcabf3e7879c511df16e326c66a54f2869c8e2dba" },
    ],
    identityEvidenceOpen: true,
  },
  {
    id: "SV-SAM-U06",
    observedRole: "Khaki-capped subject beside the yellow barricade",
    identityState: "anonymous_subject",
    reviewStatus: "under_review",
    reviewApprovals: 0,
    timestampStart: "14:26",
    timestampEnd: "14:27",
    startSeconds: 866,
    action: "A short sequence appears to show a khaki-capped subject at the right side of the yellow barricade making physical contact while the crowd is being moved.",
    limits: "The crowded frame contains several officers and heavy occlusion. It does not establish the precise contact, injury, necessity, proportionality, or identity of the subject.",
    evidenceFrames: [
      { id: "SV-SAM-P0034", timestamp: "14:26.0", timestampSeconds: 866, relation: "before_context", observation: "The khaki-capped subject is visible at the right edge of the compressed corridor before the clearest contact frame.", continuityLimit: "Multiple similarly dressed personnel are present; continuity relies only on adjacent time and scene position.", derivativeSha256: "afbe6eed95484b210217b6e8f29f75b177ecc43a1138b558ae91175aaf5c6958" },
      { id: "SV-SAM-P0035", timestamp: "14:26.5", timestampSeconds: 866.5, relation: "candidate_action", observation: "The subject appears to extend both arms toward a person in the crowd beside the barricade.", continuityLimit: "Occlusion prevents a finding about the exact grip, degree of force, or justification.", derivativeSha256: "853dc693d0eeacd8c8ed3d2a31ed569a6dfa52edc4ccb4f058935e656ebc749e" },
      { id: "SV-SAM-P0036", timestamp: "14:27.0", timestampSeconds: 867, relation: "after_context", observation: "The police line and crowd continue moving through the same narrow corridor.", continuityLimit: "The subject becomes less distinct and cannot be followed beyond this immediate sequence.", derivativeSha256: "81ac39f475a8a697579e3fb35d32aee2e9fbede4d24dbe85a1153971abf4c62b" },
    ],
    identityEvidenceOpen: true,
  },
  {
    id: "SV-SAM-U07",
    observedRole: "Khaki-uniformed subject with tied-back hair at the station gate",
    identityState: "anonymous_subject",
    reviewStatus: "under_review",
    reviewApprovals: 0,
    timestampStart: "24:30",
    timestampEnd: "24:31",
    startSeconds: 1470,
    action: "The sequence appears to show a khaki-uniformed subject placing an arm around or against a red-shirted person while the crowd is being moved near the police-station gate.",
    limits: "The stills do not establish whether the contact was restraining, guiding, protective, or excessive. No injury or real-world identity is established.",
    evidenceFrames: [
      { id: "SV-SAM-P0082", timestamp: "24:30.0", timestampSeconds: 1470, relation: "candidate_action", observation: "The subject's arm appears around or against the upper body of a red-shirted person during crowd movement.", continuityLimit: "A still cannot establish the force, purpose, or duration of the contact.", derivativeSha256: "0f3d62e2d47c062a6ad6b3936dae3def1fa6fabc7737375bddcc76d44254af50" },
      { id: "SV-SAM-P0083", timestamp: "24:30.5", timestampSeconds: 1470.5, relation: "after_context", observation: "The subject turns within the same immediate station-gate scene as the line reorganizes.", continuityLimit: "Continuity is a manual adjacent-frame observation, not biometric matching.", derivativeSha256: "14810a593114876cb22f6425d2e7a85ff9ed9a34724d861b8b5f5ec037e5c8f8" },
      { id: "SV-SAM-P0084", timestamp: "24:31.0", timestampSeconds: 1471, relation: "after_context", observation: "The subject remains in the same local position as the red-shirted person and surrounding personnel move away.", continuityLimit: "The frame does not independently establish a second contact or misconduct.", derivativeSha256: "10f56f068547bc00da3042c22880c71f64219607947589e13b4ffc7e03c8f303" },
    ],
    identityEvidenceOpen: true,
  },
  {
    id: "SV-SAM-U08",
    observedRole: "Helmeted shield-line subject during the station-gate confrontation",
    identityState: "anonymous_subject",
    reviewStatus: "under_review",
    reviewApprovals: 0,
    timestampStart: "24:32.5",
    timestampEnd: "24:34",
    startSeconds: 1472.5,
    action: "Adjacent frames appear to show a helmeted subject behind a transparent shield holding a baton above head level while facing the crowd.",
    limits: "The subject is substantially occluded by the shield, other personnel, and bystanders. The frames do not show contact, a completed strike, necessity, proportionality, or identity.",
    evidenceFrames: [
      { id: "SV-SAM-P0088", timestamp: "24:32.5", timestampSeconds: 1472.5, relation: "before_context", observation: "A shield line forms directly in front of the crowd at the station gate.", continuityLimit: "Several similarly equipped personnel overlap in the frame.", derivativeSha256: "145090ebdefc3f47ff74420232b47dcf43d0e4b3998e89be8c74839336a1bdcc" },
      { id: "SV-SAM-P0089", timestamp: "24:33.0", timestampSeconds: 1473, relation: "before_context", observation: "The helmeted subject remains partly visible behind a transparent shield as the crowd shifts.", continuityLimit: "Foreground privacy redaction and occlusion limit subject continuity.", derivativeSha256: "60c4c7b3d2d178916033c7f9e7e699dbf0ec959b4b40b5f32491b0b9304039e6" },
      { id: "SV-SAM-P0090", timestamp: "24:33.5", timestampSeconds: 1473.5, relation: "candidate_action", observation: "A baton-like object appears held above the helmeted subject's head behind the shield line.", continuityLimit: "The frame does not show the object descending or making contact.", derivativeSha256: "7fd1ec9f8e941d7b855473110b5a8ced89f17a515b6cf09fdf89d71600b5ab30" },
      { id: "SV-SAM-P0091", timestamp: "24:34.0", timestampSeconds: 1474, relation: "after_context", observation: "The shield-line subject remains in approximately the same position as a bystander crosses the view.", continuityLimit: "The subject is largely obscured and no completed action is visible.", derivativeSha256: "4f22b568b9d64327b6570b286dff09ba82f0c4612d4740e2a248c905b5b4918d" },
      { id: "SV-SAM-P0092", timestamp: "24:34.0", timestampSeconds: 1474, relation: "after_context", observation: "A second derivative at the same source time preserves the wider shield-line context.", continuityLimit: "This is not an independent source or a separate incident.", derivativeSha256: "9f98d65460de36acc82ffbb95314a46442803c2f6dac3d4870fb8aae137c1b87" },
    ],
    identityEvidenceOpen: true,
  },
  {
    id: "SV-SAM-U09",
    observedRole: "Operator positioned atop a riot-control vehicle",
    identityState: "anonymous_subject",
    reviewStatus: "under_review",
    reviewApprovals: 0,
    timestampStart: "37:10",
    timestampEnd: "37:14.5",
    startSeconds: 2230,
    action: "The sequence shows an anonymous operator positioned at mounted equipment on top of a riot-control vehicle while personnel face the vehicle and haze is visible in the area.",
    limits: "The sequence does not establish the equipment type, whether this operator discharged it, what substance caused the haze, legality, necessity, proportionality, or identity.",
    evidenceFrames: [
      { id: "SV-SAM-P0139", timestamp: "37:10.0", timestampSeconds: 2230, relation: "before_context", observation: "The camera approaches a riot-control vehicle through a line of personnel.", continuityLimit: "Motion blur limits detail and no operator action is visible.", derivativeSha256: "091d98987e5fd3d47d456b3f66c8a513204035844aad1942cfec0f9bfafdf244" },
      { id: "SV-SAM-P0140", timestamp: "37:10.5", timestampSeconds: 2230.5, relation: "candidate_action", observation: "An operator is visible at mounted equipment on the vehicle roof during the dispersal scene.", continuityLimit: "The still does not show a discharge or establish the equipment type.", derivativeSha256: "4730ab6234714d48884de8be0c127634083e3f064cb00da8b00e7cb957bf1130" },
      { id: "SV-SAM-P0141", timestamp: "37:11.0", timestampSeconds: 2231, relation: "after_context", observation: "The operator remains positioned at the roof equipment as the vehicle stays in view.", continuityLimit: "Position alone does not establish operation or responsibility for any discharge.", derivativeSha256: "92ca169d00f2c7b2879d86876a614a71c288c4f54268b6079a41c4729ad8c5e5" },
      { id: "SV-SAM-P0142", timestamp: "37:11.5", timestampSeconds: 2231.5, relation: "after_context", observation: "The roof position and surrounding security line remain visible in the continuous shot.", continuityLimit: "No control movement or discharge is resolved in this frame.", derivativeSha256: "043bdae2a762303a197773c7e51bc5095c4a5e21e8305f2279b4c31c2d4991c4" },
      { id: "SV-SAM-P0143", timestamp: "37:12.0", timestampSeconds: 2232, relation: "after_context", observation: "The vehicle and roof operator remain framed behind the security personnel.", continuityLimit: "The frame is contextual and does not independently establish conduct.", derivativeSha256: "0ae7c916e7315653678bd2318f96e1274ca30d2121e73fa4167af8b8bd91d560" },
      { id: "SV-SAM-P0144", timestamp: "37:12.5", timestampSeconds: 2232.5, relation: "after_context", observation: "The same uninterrupted vehicle scene continues as haze becomes visible near the right side.", continuityLimit: "The source and composition of the haze are not established by this still.", derivativeSha256: "2f64c057447ae463c23498af149c96854bfbfc96d7d3fdcbec53ba61e1e2d359" },
      { id: "SV-SAM-P0145", timestamp: "37:13.0", timestampSeconds: 2233, relation: "after_context", observation: "The operator remains visible above the vehicle while haze crosses the scene.", continuityLimit: "Temporal proximity is not proof that the operator caused the haze.", derivativeSha256: "aba8377d6ef81919d382a82c9e94b87142d967405ec8584712fb7b475cbf7e51" },
      { id: "SV-SAM-P0146", timestamp: "37:13.5", timestampSeconds: 2233.5, relation: "after_context", observation: "The vehicle, mounted position, and surrounding personnel remain in the continuous shot.", continuityLimit: "No individual control action can be resolved.", derivativeSha256: "295f4272d5459bfa3c8b325a87f6fa0d1727dec445573dcaf4aa1e47a4eb5d87" },
      { id: "SV-SAM-P0147", timestamp: "37:14.0", timestampSeconds: 2234, relation: "after_context", observation: "The camera continues to hold the vehicle and operator as the security line shifts.", continuityLimit: "This frame does not establish a separate action or incident.", derivativeSha256: "0442954cd411a8b4c14fcaab0aa82f1c105682b1d5838b7a1c6786ac8d223401" },
      { id: "SV-SAM-P0148", timestamp: "37:14.5", timestampSeconds: 2234.5, relation: "after_context", observation: "The operator remains visible at the end of the reviewed vehicle sequence.", continuityLimit: "The sequence ends without a clear view of discharge, equipment controls, or identity.", derivativeSha256: "384ca3b083299a4f3a3e256a7f9bf49c647b83a2a2636acdad08b52b5c3395e5" },
    ],
    identityEvidenceOpen: true,
  },
  {
    id: "SV-AKB-U01",
    sourceId: "deshbhakt",
    observedRole: "Civil-dress subject in a white shirt and brown trousers",
    identityState: "anonymous_subject",
    reviewStatus: "under_review",
    reviewApprovals: 0,
    timestampStart: "02:30.4",
    timestampEnd: "02:31.6",
    startSeconds: 150,
    action: "A short edited sequence appears to show this anonymous subject moving through the crowd with a baton-like object and making a lateral or downward motion near another person.",
    limits: "The secondary video intercuts the action with portrait and commentary frames. The selected stills do not clearly resolve contact, injury, authority, necessity, proportionality, or identity, and they must not be merged with another profile by facial resemblance.",
    evidenceFrames: [
      { id: "SV-AKB-P0001", timestamp: "02:30.4", timestampSeconds: 150.4, relation: "candidate_action", observation: "The subject holds a baton-like object behind the right hip while a nearby person bends or moves away.", continuityLimit: "A single still does not show whether the object made contact or why either person moved.", derivativeSha256: "44c5204fe880723568d49f3f52fcb865776ad311eab2af57f295a5be806004bb" },
      { id: "SV-AKB-P0002", timestamp: "02:30.6", timestampSeconds: 150.6, relation: "before_context", observation: "The subject remains in the same immediate street position as the nearby person continues moving.", continuityLimit: "The baton-like object is partly obscured and no contact is visible.", derivativeSha256: "04a788657ed02cfb4f14c1939e52e5782dbf9b6b687dcd2c88b174b01351af29" },
      { id: "SV-AKB-P0003", timestamp: "02:30.8", timestampSeconds: 150.8, relation: "after_context", observation: "The subject turns within the same short action clip as a foreground bystander crosses the view.", continuityLimit: "Foreground occlusion prevents a complete view of the subject's arms and object.", derivativeSha256: "9a63649c18e2a53b08b6908f94d99629c70aed8f314f131d7663c9fa38a11414" },
      { id: "SV-AKB-P0004", timestamp: "02:31.4", timestampSeconds: 151.4, relation: "candidate_action", observation: "After an editorial cut, the same scene position shows the subject extending the baton-like object toward the left side of the crowd.", continuityLimit: "The edit interrupts continuity and the frame does not resolve contact or the target of the motion.", derivativeSha256: "02823f2b0e242686a2fb3ce702e20431a870634d36eedc76c14214cd9ebe2d0e" },
      { id: "SV-AKB-P0005", timestamp: "02:31.6", timestampSeconds: 151.6, relation: "candidate_action", observation: "The subject appears to continue the lateral motion while uniformed personnel and protesters remain nearby.", continuityLimit: "The source is an edited compilation; no finding of a strike, injury, official status, or excessive force is made from this frame.", derivativeSha256: "7a7b1fb11e61b92c47632240c15cea6eb7e0993bc2da9dfe3164f454822f5b26" },
    ],
    identityEvidenceOpen: true,
  },
  {
    id: "SV-AKB-U02",
    sourceId: "deshbhakt",
    observedRole: "Masked civil-dress subject holding a long wooden object",
    identityState: "anonymous_subject",
    reviewStatus: "unreviewed",
    reviewApprovals: 0,
    timestampStart: "07:45",
    timestampEnd: "07:46",
    startSeconds: 465,
    action: "The subject is shown carrying or holding a long wooden object in an inserted street clip.",
    limits: "No strike, contact, police status, deployment authority, or misconduct is visible in these selected frames. This is contextual evidence only, not an allegation of brutality or an identity match.",
    evidenceFrames: [
      { id: "SV-AKB-P0006", timestamp: "07:45.0", timestampSeconds: 465, relation: "context_only", observation: "The masked subject is visible holding a long wooden object near a roadside barrier.", continuityLimit: "Possession alone does not establish use, authority, or misconduct.", derivativeSha256: "03c291acffa7fc2202e6fe540836d64d0d00f9cb7235f97af16c3114ac13f369" },
      { id: "SV-AKB-P0007", timestamp: "07:45.5", timestampSeconds: 465.5, relation: "context_only", observation: "The subject remains in the same inserted clip while walking with the object angled downward.", continuityLimit: "No contact or threatening motion is visible.", derivativeSha256: "4c6077608e8534e9a77d323c86d4589fffccba05fc2562401536cdf2df372f86" },
      { id: "SV-AKB-P0008", timestamp: "07:46.0", timestampSeconds: 466, relation: "context_only", observation: "The object and masked subject remain visible at the end of the short sequence.", continuityLimit: "The clip does not establish a role, name, employer, or completed act.", derivativeSha256: "101fe612efc73d91f4151b6f0fdcd4e9dbaf935b162fb9425a9aa2877e125fdd" },
    ],
    identityEvidenceOpen: true,
  },
  {
    id: "SV-AKB-U03",
    sourceId: "deshbhakt",
    observedRole: "Left-side civil-dress subject in a white shirt holding a stick",
    identityState: "anonymous_subject",
    reviewStatus: "unreviewed",
    reviewApprovals: 0,
    timestampStart: "08:34",
    timestampEnd: "08:35",
    startSeconds: 514,
    action: "An inserted still sequence shows the left-side subject holding a stick while uniformed personnel are visible in the background.",
    limits: "The stills show possession, not a strike or contact. They do not establish police affiliation, misconduct, identity, or a link to SV-AKB-U01; cross-shot biometric matching is disabled.",
    evidenceFrames: [
      { id: "SV-AKB-P0009", timestamp: "08:34.0", timestampSeconds: 514, relation: "context_only", observation: "The left-side subject stands holding a stick with uniformed personnel behind the pair.", continuityLimit: "This edited still does not show how the object was used.", derivativeSha256: "0479278fc41a0e6ec2e6edc302da131ae4fcc23d3be0387e6f4078303e902696" },
      { id: "SV-AKB-P0010", timestamp: "08:34.5", timestampSeconds: 514.5, relation: "context_only", observation: "A subject-specific crop preserves the left-side person's clothing, object, and immediate background context.", continuityLimit: "Cropping assists review only and is not facial recognition or identity evidence.", derivativeSha256: "7d70b9d7bd6e00cdae2a2eacc0c9156f89493666c7e5e51d659f70d92325b2d1" },
      { id: "SV-AKB-P0011", timestamp: "08:35.0", timestampSeconds: 515, relation: "context_only", observation: "The same inserted still remains on screen as the commentary video adds editorial markings.", continuityLimit: "Repeated display is not independent corroboration or a separate incident.", derivativeSha256: "2211385ba9be81b7351e4b920ae9ae0d07741e8c2489304369ccbfa8d8abff72" },
    ],
    identityEvidenceOpen: true,
  },
  {
    id: "SV-AKB-U04",
    sourceId: "deshbhakt",
    observedRole: "Right-side civil-dress subject in a white shirt holding a stick",
    identityState: "anonymous_subject",
    reviewStatus: "unreviewed",
    reviewApprovals: 0,
    timestampStart: "08:34",
    timestampEnd: "08:35",
    startSeconds: 514,
    action: "An inserted still sequence shows the right-side subject holding a stick while uniformed personnel are visible in the background.",
    limits: "The stills show possession, not a strike or contact. They do not establish police affiliation, misconduct, identity, or a link to any other profile.",
    evidenceFrames: [
      { id: "SV-AKB-P0012", timestamp: "08:34.0", timestampSeconds: 514, relation: "context_only", observation: "The right-side subject stands holding a stick with uniformed personnel behind the pair.", continuityLimit: "This edited still does not show how the object was used.", derivativeSha256: "885466ad2256f525cec53f44eef85476eecf978c1cb120148474a474847d992e" },
      { id: "SV-AKB-P0013", timestamp: "08:34.5", timestampSeconds: 514.5, relation: "context_only", observation: "A subject-specific crop preserves the right-side person's clothing, object, and immediate background context.", continuityLimit: "Cropping assists review only and is not facial recognition or identity evidence.", derivativeSha256: "ab5c1114bb1d71f859a9a96d2a74c1f9b724316a569a218f47bf86fb20f3be80" },
      { id: "SV-AKB-P0014", timestamp: "08:35.0", timestampSeconds: 515, relation: "context_only", observation: "The same inserted still remains on screen as the commentary video adds editorial markings.", continuityLimit: "Repeated display is not independent corroboration or a separate incident.", derivativeSha256: "a37e4ba2f6205d78471eb2acee1853d5417cbbada169af0b2a04ce0ac19af59c" },
    ],
    identityEvidenceOpen: true,
  },
  {
    id: "SV-REF-U01",
    privateOnly: true,
    observedRole: "User-supplied reference subject",
    identityState: "anonymous_subject",
    reviewStatus: "unreviewed",
    reviewApprovals: 0,
    timestampStart: "No source time",
    timestampEnd: "No source time",
    startSeconds: 0,
    action: "A user supplied this portrait for protected reference and possible future documentary verification.",
    limits: "The image alone establishes neither name, date, location, police affiliation, conduct, nor a link to any video subject. It is not used for face search, biometric comparison, or resemblance-based merging.",
    evidenceFrames: [
      { id: "SV-REF-P0001", timestamp: "USER-SUPPLIED", timestampSeconds: 0, relation: "context_only", observation: "Portrait supplied by the user as a standalone protected reference image.", continuityLimit: "No conduct or identity inference may be made from this image alone, and it is not linked to a video profile by resemblance.", derivativeSha256: "5d127a35a0fba6cd4c8327ad62c28e02d5b4a57c1bc952aa04782041668e73e2" },
    ],
    identityEvidenceOpen: true,
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
    timestampStart: "37:10",
    timestampEnd: "37:11",
    startSeconds: 2230,
    action: "A reviewed frame shows personnel operating equipment mounted on a riot-control vehicle during dispersal.",
    limits: "The frame does not by itself establish the equipment type, whether it was discharged, identity, or individual responsibility. This remains a contextual scene record.",
    privateReviewFrame: {
      timestamp: "37:10.5",
      timestampSeconds: 2230.5,
      subjectBox: [440, 78, 720, 285],
      derivativeSha256: "fdd3b174d4fc2704215947f820213d77bccd953afb2f0f8ceccddaeab8ed33b3",
      note: "Exposed faces are obscured in the private derivative. The box marks equipment operation for review and does not assert identity.",
    },
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
export function getDocumentedActor(id: string) { return documentedActors.find((actor) => actor.id.toLowerCase() === id.toLowerCase()); }
