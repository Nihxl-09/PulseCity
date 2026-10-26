"use client";

import CityMapLoader from "@/components/CityMapLoader";
import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";

type CrisisId =
  | "flood"
  | "wildfire"
  | "earthquake"
  | "heatwave"
  | "power"
  | "cyberattack";

type Crisis = {
  id: CrisisId;
  name: string;
  icon: string;
  description: string;
  color: string;
  resourceAllocation: {
    responseUnits: number;
    safeCentres: number;
    supplies: number;
  };
  resourceName: string;
  safePlaceName: string;
  supplyName: string;
  infrastructureAction: string;
  infrastructureResult: string;
  firstEvent: string;
  escalationEvent: string;
  laterEvent: string;
  requests: Omit<RequestItem, "status">[];
};

type NeedType = "response" | "shelter" | "alert" | "supplies" | "infrastructure";

type Zone = {
  id: string;
  name: string;
  x: number;
  y: number;
  population: number;
  vulnerable: number;
  risk: number;
  impact: number;
};

type RequestItem = {
  id: string;
  zoneId: string;
  title: string;
  detail: string;
  urgency: number;
  need: NeedType;
  status: "pending" | "resolved";
};

type EventItem = {
  id: number;
  time: string;
  text: string;
};

type OutcomeItem = {
  id: number;
  action: string;
  zoneName: string;
  result: string;
  resolvedTitles: string[];
};

type RoleId = "command" | "field" | "resources" | "public";
type RoleAction = "dispatch" | "shelter" | "alert" | "supplies" | "infrastructure";
type Language = "en" | "kn" | "hi";
type CopyKey = keyof typeof englishCopy;

type SavedRun = {
  id: number;
  crisisName: string;
  completedAt: string;
  score: number;
  requestsResolved: number;
  requestTotal: number;
  actionsTaken: number;
  responseUnitsUsed: number;
  supplyUnitsUsed: number;
  sheltersOpened: number;
  outcomes: number;
};

const englishCopy = {
  teamPerspective: "TEAM PERSPECTIVE",
  cityOperations: "CITY OPERATIONS",
  trainingSimulation: "TRAINING SIMULATION",
  elapsedLabel: "ELAPSED",
  chooseRole: "Choose a response role",
  handoff: "Shared training scenario · switch roles to simulate team handoffs",
  commandFocus: "Coordinate the full response across areas, requests, and available resources.",
  fieldFocus: "Prioritize response dispatches and review access or infrastructure in the selected area.",
  resourceFocus: "Manage simulated shelter capacity and supply allocations against listed needs.",
  publicFocus: "Monitor incoming needs and extend simulated public-alert coverage.",
  incidentCommand: "Incident command",
  fieldOperations: "Field operations",
  resourceCoordination: "Resource coordination",
  publicInformation: "Public information",
  mapOverview: "MANGALURU · OPENSTREETMAP",
  cityMap: "City map",
  actionTypes: "action types",
  simulatedAreas: "simulated areas",
  impactPercent: "% impact",
  loadout: "SCENARIO LOADOUT",
  resourceAllocation: "Simulated resource allocation",
  incoming: "INCOMING",
  requests: "Requests & service needs",
  responseActions: "RESPONSE ACTIONS",
  availableTo: "Available to",
  switchRoles: "Switch perspectives above to hand off other tasks.",
  startExercise: "Start random exercise",
  running: "Exercise in progress",
  resetExercise: "Reset exercise",
  language: "Language",
  present: "Guided presentation",
  replayCompare: "Replay comparison",
  noSavedRuns: "Complete an exercise to save a run here.",
  savedRuns: "Recent completed runs",
  sharedRunsUnavailable: "Shared run history is unavailable. Check the server connection and retry.",
  loadingRuns: "Loading shared runs…",
  retry: "Retry",
  teamAccess: "Team access",
  teamPassword: "Shared team password",
  teamPasswordPlaceholder: "Enter the team password",
  teamSignIn: "Sign in to save runs",
  teamSignOut: "Sign out",
  teamSignInRequired: "Sign in to save completed runs to the shared history.",
  teamPasswordUnconfigured: "Team access is not configured on the server.",
  teamSignInFailed: "Sign-in failed. Check the password and try again.",
  teamSessionChecking: "Checking team access…",
  presentationTitle: "PulseCity in 60 seconds",
  presentationIntro: "This is a training simulation with fictional neighborhood and request data.",
  presentationRoles: "Switch team perspectives to review different responsibilities and hand off actions.",
  presentationMap: "Inspect simulated risk areas and illustrative routes on the map.",
  presentationActions: "Start an exercise, resolve simulated requests, and observe how decisions change the scenario.",
  presentationReport: "Compare completed runs to discuss trade-offs. Scores are prototype indicators, not forecasts.",
  back: "Back",
  next: "Next",
  finish: "Finish",
  close: "Close",
  overview: "Overview",
  roleTasks: "Role task queue",
  noRoleTasks: "No open requests match this role right now.",
  task: "open request",
  tasks: "open requests",
  highestPriority: "Highest priority",
  dispatchAction: "Dispatch response",
  shelterAction: "Open shelter",
  publicAlertAction: "Send public alert",
  suppliesAction: "Allocate supplies",
  decisionRecord: "DECISION RECORD",
  actionsOutcomes: "Actions & outcomes",
  simulationComplete: "Simulation complete",
  reportTitle: "response report",
  eventLog: "Event log",
  decisionSupport: "DECISION SUPPORT",
  responseBrief: "Response brief",
  generateBrief: "Generate response brief",
  exercise: "EXERCISE",
  scenarioControls: "Scenario controls",
  activity: "ACTIVITY",
  requestsRemaining: "Requests remaining",
  decisionsMade: "Decisions made",
  resourcesRemaining: "Resources remaining",
  overallScore: "Overall score",
  of: "of",
  units: "units",
  unit: "unit",
  resolved: "resolved",
  completed: "completed",
  standingBy: "STANDING BY",
  liveSimulation: "LIVE SIMULATION",
  completeStatus: "COMPLETE",
  responseScore: "Response score",
  available: "available",
  safeCentres: "Safe centres",
  open: "open",
  areaProfile: "AREA PROFILE",
  population: "Population",
  vulnerableResidents: "Vulnerable residents",
  riskScore: "Risk score",
  pendingRequestCount: "Pending requests",
  exposure: "exposure",
  critical: "Critical",
  high: "High",
  moderate: "Moderate",
  low: "Low",
  alreadyOpen: "Centre already open",
  infrastructureReviewed: "Infrastructure reviewed",
  awaitingAction: "awaiting action",
  priority: "priority",
  pending: "pending",
  medical: "Medical",
  shelter: "Shelter",
  mapAttribution: "© OpenStreetMap contributors. Map view is limited to an approximate Mangaluru urban extent, not an official municipal boundary. Live tiles require an internet connection.",
  illustrativeValues: "Illustrative demo values · not operational guidance",
  responseBriefDescription: "Review the highest-priority request and area exposure before committing resources.",
  trainingAidDisclaimer: "Rule-based training aid only. Not for real emergency use.",
  simulationReportDisclaimer: "This score is for the simulated scenario, not a prediction of real-world outcomes. Review unresolved requests and try a different response strategy.",
  outOf100: "out of 100",
  requestsResolved: "Requests resolved",
  percentOfRequests: "of listed requests",
  stillAwaiting: "Still awaiting action",
  elapsed: "elapsed",
  decisionEfficiency: "Decision efficiency",
  requestCompletionLabel: "Request completion",
  equityIndicator: "Equity indicator",
  noRecordedActions: "No response actions were recorded in this exercise.",
  recorded: "recorded",
  resolvedPrefix: "Resolved:",
  review: "What to review",
  allResolvedReview: "All listed requests were resolved. Consider whether your actions reached different neighborhoods and vulnerable residents.",
  unresolvedReviewPrefix: "There are",
  unresolvedReviewSuffix: "unresolved requests. Review their urgency and location before replaying.",
  scoringExplanation: "Response score starts at 50; completed actions add fixed points and each resolved request adds urgency-weighted points (urgency ÷ 20, rounded). Area-impact reductions are fixed training effects. Overall score weights response 55%, request completion 25%, equity 10%, and efficiency 10%. These are illustrative prototype metrics, not validated measures of real-world response.",
  replayScenario: "Replay this scenario",
  responseRecommendations: "Rule-based training aid only. Not for real emergency use.",
  generateReport: "Saved on this device only. Run comparisons are illustrative prototype metrics.",
  actions: "actions",
  responseUnits: "response units",
  centres: "centres",
  latestScoreDifference: "Latest score difference:",
  requestCompletion: "request completion:",
  vs: "vs",
  entries: "entries",
  keyboardHelp: "Use ← / → to navigate · Esc to close",
  scenario: "scenario",
} as const;

const translatedCopy: Record<Language, Partial<Record<CopyKey, string>>> = {
  en: {},
  kn: {
    teamPerspective: "ತಂಡದ ದೃಷ್ಟಿಕೋನ",
    cityOperations: "ನಗರ ಕಾರ್ಯಾಚರಣೆ",
    trainingSimulation: "ತರಬೇತಿ ಅನುಕರಣೆ",
    elapsedLabel: "ಕಳೆದ ಸಮಯ",
    chooseRole: "ಪ್ರತಿಕ್ರಿಯಾ ಪಾತ್ರವನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    handoff: "ಹಂಚಿಕೊಂಡ ತರಬೇತಿ · ತಂಡಗಳ ನಡುವೆ ಕಾರ್ಯ ಹಸ್ತಾಂತರಿಸಲು ಪಾತ್ರ ಬದಲಿಸಿ",
    commandFocus: "ಪ್ರದೇಶಗಳು, ವಿನಂತಿಗಳು ಮತ್ತು ಲಭ್ಯ ಸಂಪನ್ಮೂಲಗಳ ಪ್ರತಿಕ್ರಿಯೆಯನ್ನು ಸಮನ್ವಯಗೊಳಿಸಿ.",
    fieldFocus: "ಪ್ರತಿಕ್ರಿಯೆ ನಿಯೋಜನೆಗೆ ಆದ್ಯತೆ ನೀಡಿ ಮತ್ತು ಆಯ್ದ ಪ್ರದೇಶದ ಪ್ರವೇಶ ಪರಿಶೀಲಿಸಿ.",
    resourceFocus: "ಅನುಕರಿಸಿದ ಆಶ್ರಯ ಸಾಮರ್ಥ್ಯ ಮತ್ತು ಸರಬರಾಜು ಹಂಚಿಕೆಯನ್ನು ನಿರ್ವಹಿಸಿ.",
    publicFocus: "ಬರುವ ಅಗತ್ಯಗಳನ್ನು ಗಮನಿಸಿ ಮತ್ತು ಸಾರ್ವಜನಿಕ ಎಚ್ಚರಿಕೆ ವ್ಯಾಪ್ತಿಯನ್ನು ಹೆಚ್ಚಿಸಿ.",
    incidentCommand: "ಘಟನೆ ನಿರ್ವಹಣೆ",
    fieldOperations: "ಕ್ಷೇತ್ರ ಕಾರ್ಯಾಚರಣೆ",
    resourceCoordination: "ಸಂಪನ್ಮೂಲ ಸಮನ್ವಯ",
    publicInformation: "ಸಾರ್ವಜನಿಕ ಮಾಹಿತಿ",
    mapOverview: "ಮಂಗಳೂರು · OPENSTREETMAP",
    cityMap: "ನಗರದ ನಕ್ಷೆ",
    actionTypes: "ಕಾರ್ಯ ಪ್ರಕಾರಗಳು",
    simulatedAreas: "ಅನುಕರಿಸಿದ ಪ್ರದೇಶಗಳು",
    impactPercent: "% ಪರಿಣಾಮ",
    loadout: "ಸನ್ನಿವೇಶ ಸಂಪನ್ಮೂಲಗಳು",
    resourceAllocation: "ಅನುಕರಿಸಿದ ಸಂಪನ್ಮೂಲ ಹಂಚಿಕೆ",
    incoming: "ಬರುತ್ತಿರುವವು",
    requests: "ವಿನಂತಿಗಳು ಮತ್ತು ಸೇವಾ ಅಗತ್ಯಗಳು",
    responseActions: "ಪ್ರತಿಕ್ರಿಯೆ ಕ್ರಮಗಳು",
    availableTo: "ಇವರಿಗೆ ಲಭ್ಯ:",
    switchRoles: "ಇತರ ಕಾರ್ಯಗಳನ್ನು ಹಸ್ತಾಂತರಿಸಲು ಮೇಲಿನ ಪಾತ್ರ ಬದಲಿಸಿ.",
    startExercise: "ಯಾದೃಚ್ಛಿಕ ಅಭ್ಯಾಸ ಪ್ರಾರಂಭಿಸಿ",
    running: "ಅಭ್ಯಾಸ ನಡೆಯುತ್ತಿದೆ",
    resetExercise: "ಅಭ್ಯಾಸ ಮರುಹೊಂದಿಸಿ",
    language: "ಭಾಷೆ",
    present: "ಮಾರ್ಗದರ್ಶಿತ ಪ್ರಸ್ತುತಿ",
    replayCompare: "ಮರುಪ್ರಯತ್ನ ಹೋಲಿಕೆ",
    noSavedRuns: "ಅಭ್ಯಾಸ ಪೂರ್ಣಗೊಳಿಸಿದಾಗ ಇಲ್ಲಿ ಉಳಿಯುತ್ತದೆ.",
    savedRuns: "ಇತ್ತೀಚಿನ ಪೂರ್ಣಗೊಂಡ ಅಭ್ಯಾಸಗಳು",
    sharedRunsUnavailable: "ಹಂಚಿಕೊಂಡ ಅಭ್ಯಾಸ ಇತಿಹಾಸ ಲಭ್ಯವಿಲ್ಲ. ಸರ್ವರ್ ಸಂಪರ್ಕ ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    loadingRuns: "ಹಂಚಿಕೊಂಡ ಅಭ್ಯಾಸಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ…",
    retry: "ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ",
    teamAccess: "ತಂಡದ ಪ್ರವೇಶ",
    teamPassword: "ಹಂಚಿಕೊಂಡ ತಂಡದ ಪಾಸ್‌ವರ್ಡ್",
    teamPasswordPlaceholder: "ತಂಡದ ಪಾಸ್‌ವರ್ಡ್ ನಮೂದಿಸಿ",
    teamSignIn: "ಅಭ್ಯಾಸ ಉಳಿಸಲು ಸೈನ್ ಇನ್ ಮಾಡಿ",
    teamSignOut: "ಸೈನ್ ಔಟ್",
    teamSignInRequired: "ಹಂಚಿಕೊಂಡ ಇತಿಹಾಸದಲ್ಲಿ ಪೂರ್ಣಗೊಂಡ ಅಭ್ಯಾಸಗಳನ್ನು ಉಳಿಸಲು ಸೈನ್ ಇನ್ ಮಾಡಿ.",
    teamPasswordUnconfigured: "ಸರ್ವರ್‌ನಲ್ಲಿ ತಂಡದ ಪ್ರವೇಶ ಹೊಂದಿಸಲಾಗಿಲ್ಲ.",
    teamSignInFailed: "ಸೈನ್ ಇನ್ ವಿಫಲವಾಗಿದೆ. ಪಾಸ್‌ವರ್ಡ್ ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    teamSessionChecking: "ತಂಡದ ಪ್ರವೇಶ ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ…",
    presentationTitle: "60 ಸೆಕೆಂಡುಗಳಲ್ಲಿ PulseCity",
    presentationIntro: "ಕಲ್ಪಿತ ಸೇವಾ ಕೇಂದ್ರಗಳು ಮತ್ತು ನೆರೆಹೊರೆಯ ಮಾಹಿತಿಯ ತರಬೇತಿ ಅನುಕರಣೆ.",
    presentationRoles: "ವಿಭಿನ್ನ ಜವಾಬ್ದಾರಿಗಳನ್ನು ಪರಿಶೀಲಿಸಲು ತಂಡದ ಪಾತ್ರ ಬದಲಿಸಿ.",
    presentationMap: "ನಕ್ಷೆಯಲ್ಲಿ ಅನುಕರಿಸಿದ ಅಪಾಯ ಪ್ರದೇಶಗಳು, ಸೇವಾ ಕೇಂದ್ರಗಳು ಮತ್ತು ಮಾರ್ಗಗಳನ್ನು ನೋಡಿ.",
    presentationActions: "ಅಭ್ಯಾಸ ಪ್ರಾರಂಭಿಸಿ, ವಿನಂತಿಗಳನ್ನು ಪರಿಹರಿಸಿ ಮತ್ತು ನಿರ್ಧಾರಗಳ ಪರಿಣಾಮ ಗಮನಿಸಿ.",
    presentationReport: "ಪೂರ್ಣಗೊಂಡ ಅಭ್ಯಾಸಗಳನ್ನು ಹೋಲಿಸಿ. ಅಂಕಗಳು ಮಾದರಿ ಸೂಚಕಗಳು ಮಾತ್ರ.",
    back: "ಹಿಂದಕ್ಕೆ",
    next: "ಮುಂದೆ",
    finish: "ಮುಗಿಸಿ",
    close: "ಮುಚ್ಚಿ",
    overview: "ಅವಲೋಕನ",
    roleTasks: "ಪಾತ್ರದ ಕಾರ್ಯ ಪಟ್ಟಿ",
    noRoleTasks: "ಈ ಪಾತ್ರಕ್ಕೆ ಹೊಂದುವ ಬಾಕಿ ವಿನಂತಿಗಳಿಲ್ಲ.",
    task: "ಬಾಕಿ ವಿನಂತಿ",
    tasks: "ಬಾಕಿ ವಿನಂತಿಗಳು",
    highestPriority: "ಅತ್ಯಂತ ಆದ್ಯತೆ",
    dispatchAction: "ಪ್ರತಿಕ್ರಿಯೆ ನಿಯೋಜಿಸಿ",
    shelterAction: "ಆಶ್ರಯ ತೆರೆಯಿರಿ",
    publicAlertAction: "ಸಾರ್ವಜನಿಕ ಎಚ್ಚರಿಕೆ ಕಳುಹಿಸಿ",
    suppliesAction: "ಸರಬರಾಜು ಹಂಚಿ",
    decisionRecord: "ನಿರ್ಧಾರ ದಾಖಲೆ",
    actionsOutcomes: "ಕ್ರಮಗಳು ಮತ್ತು ಫಲಿತಾಂಶಗಳು",
    simulationComplete: "ಅನುಕರಣೆ ಪೂರ್ಣಗೊಂಡಿದೆ",
    reportTitle: "ಪ್ರತಿಕ್ರಿಯೆ ವರದಿ",
    eventLog: "ಘಟನೆಗಳ ದಾಖಲೆ",
    decisionSupport: "ನಿರ್ಧಾರ ಬೆಂಬಲ",
    responseBrief: "ಪ್ರತಿಕ್ರಿಯೆ ಸಾರಾಂಶ",
    generateBrief: "ಪ್ರತಿಕ್ರಿಯೆ ಸಾರಾಂಶ ರಚಿಸಿ",
    exercise: "ಅಭ್ಯಾಸ",
    scenarioControls: "ಸನ್ನಿವೇಶ ನಿಯಂತ್ರಣಗಳು",
    activity: "ಚಟುವಟಿಕೆ",
    requestsRemaining: "ಉಳಿದ ವಿನಂತಿಗಳು",
    decisionsMade: "ಮಾಡಿದ ನಿರ್ಧಾರಗಳು",
    resourcesRemaining: "ಉಳಿದ ಸಂಪನ್ಮೂಲಗಳು",
    overallScore: "ಒಟ್ಟು ಅಂಕ",
    of: "ರಲ್ಲಿ",
    units: "ಘಟಕಗಳು",
    unit: "ಘಟಕ",
    resolved: "ಪರಿಹರಿಸಲಾಗಿದೆ",
    completed: "ಪೂರ್ಣಗೊಂಡಿದೆ",
    standingBy: "ಸಿದ್ಧವಾಗಿದೆ",
    liveSimulation: "ಅನುಕರಣೆ ನಡೆಯುತ್ತಿದೆ",
    completeStatus: "ಪೂರ್ಣ",
    responseScore: "ಪ್ರತಿಕ್ರಿಯೆ ಅಂಕ",
    available: "ಲಭ್ಯ",
    safeCentres: "ಸುರಕ್ಷಿತ ಕೇಂದ್ರಗಳು",
    open: "ತೆರೆದಿವೆ",
    areaProfile: "ಪ್ರದೇಶ ವಿವರ",
    population: "ಜನಸಂಖ್ಯೆ",
    vulnerableResidents: "ಸಹಾಯ ಅಗತ್ಯವಿರುವ ನಿವಾಸಿಗಳು",
    riskScore: "ಅಪಾಯ ಅಂಕ",
    pendingRequestCount: "ಬಾಕಿ ವಿನಂತಿಗಳು",
    exposure: "ಪರಿಣಾಮ",
    critical: "ಅತ್ಯಂತ ಗಂಭೀರ",
    high: "ಹೆಚ್ಚು",
    moderate: "ಮಧ್ಯಮ",
    low: "ಕಡಿಮೆ",
    alreadyOpen: "ಕೇಂದ್ರ ಈಗಾಗಲೇ ತೆರೆದಿದೆ",
    infrastructureReviewed: "ಮೂಲಸೌಕರ್ಯ ಪರಿಶೀಲಿಸಲಾಗಿದೆ",
    awaitingAction: "ಕ್ರಮಕ್ಕಾಗಿ ಕಾಯುತ್ತಿದೆ",
    priority: "ಆದ್ಯತೆ",
    pending: "ಬಾಕಿ",
    medical: "ವೈದ್ಯಕೀಯ",
    shelter: "ಆಶ್ರಯ",
    mapAttribution: "© OpenStreetMap ಕೊಡುಗೆದಾರರು. ನಕ್ಷೆಯು ಮಂಗಳೂರಿನ ಅಂದಾಜು ನಗರ ವ್ಯಾಪ್ತಿಗೆ ಸೀಮಿತವಾಗಿದೆ; ಇದು ಅಧಿಕೃತ ನಗರಪಾಲಿಕೆ ಗಡಿಯಲ್ಲ. ಲೈವ್ ಟೈಲ್‌ಗಳಿಗೆ ಇಂಟರ್ನೆಟ್ ಅಗತ್ಯ.",
    illustrativeValues: "ಉದಾಹರಣೆಯ ಮೌಲ್ಯಗಳು · ಕಾರ್ಯಾಚರಣೆಯ ಮಾರ್ಗದರ್ಶನವಲ್ಲ",
    responseBriefDescription: "ಸಂಪನ್ಮೂಲಗಳನ್ನು ಬಳಸುವ ಮೊದಲು ಅತ್ಯಂತ ಆದ್ಯತೆಯ ವಿನಂತಿ ಮತ್ತು ಪ್ರದೇಶದ ಪರಿಣಾಮ ಪರಿಶೀಲಿಸಿ.",
    trainingAidDisclaimer: "ನಿಯಮಾಧಾರಿತ ತರಬೇತಿ ಸಾಧನ ಮಾತ್ರ. ನೈಜ ತುರ್ತು ಪರಿಸ್ಥಿತಿಗೆ ಬಳಸಬೇಡಿ.",
    simulationReportDisclaimer: "ಈ ಅಂಕವು ಅನುಕರಿಸಿದ ಸನ್ನಿವೇಶಕ್ಕಷ್ಟೇ; ನೈಜ ಫಲಿತಾಂಶಗಳ ಮುನ್ಸೂಚನೆಯಲ್ಲ. ಬಾಕಿ ವಿನಂತಿಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.",
    outOf100: "ರಲ್ಲಿ 100",
    requestsResolved: "ಪರಿಹರಿಸಿದ ವಿನಂತಿಗಳು",
    percentOfRequests: "ಪಟ್ಟಿಯಲ್ಲಿರುವ ವಿನಂತಿಗಳಲ್ಲಿ",
    stillAwaiting: "ಇನ್ನೂ ಕ್ರಮಕ್ಕಾಗಿ ಕಾಯುತ್ತಿದೆ",
    elapsed: "ಕಳೆದಿದೆ",
    decisionEfficiency: "ನಿರ್ಧಾರ ದಕ್ಷತೆ",
    requestCompletionLabel: "ವಿನಂತಿ ಪೂರ್ಣತೆ",
    equityIndicator: "ಸಮಾನತೆ ಸೂಚಕ",
    noRecordedActions: "ಈ ಅಭ್ಯಾಸದಲ್ಲಿ ಯಾವುದೇ ಪ್ರತಿಕ್ರಿಯೆ ಕ್ರಮ ದಾಖಲಾಗಿಲ್ಲ.",
    recorded: "ದಾಖಲಾಗಿದೆ",
    resolvedPrefix: "ಪರಿಹರಿಸಲಾಗಿದೆ:",
    review: "ಪರಿಶೀಲಿಸಬೇಕಾದದ್ದು",
    allResolvedReview: "ಎಲ್ಲಾ ವಿನಂತಿಗಳೂ ಪರಿಹರಿಸಲಾಗಿದೆ. ವಿವಿಧ ಪ್ರದೇಶಗಳು ಮತ್ತು ದುರ್ಬಲ ನಿವಾಸಿಗಳಿಗೆ ಕ್ರಮ ತಲುಪಿದೆಯೇ ಪರಿಶೀಲಿಸಿ.",
    unresolvedReviewPrefix: "ಇನ್ನೂ",
    unresolvedReviewSuffix: "ವಿನಂತಿಗಳು ಬಾಕಿ. ಮರುಪ್ರಯತ್ನಿಸುವ ಮೊದಲು ಅವುಗಳ ಆದ್ಯತೆ ಮತ್ತು ಸ್ಥಳ ಪರಿಶೀಲಿಸಿ.",
    scoringExplanation: "ಪ್ರತಿಕ್ರಿಯೆ ಅಂಕ 50ರಿಂದ ಆರಂಭವಾಗುತ್ತದೆ; ಪೂರ್ಣಗೊಂಡ ಕ್ರಮಗಳು ಸ್ಥಿರ ಅಂಕಗಳನ್ನು ಸೇರಿಸುತ್ತವೆ. ಒಟ್ಟು ಅಂಕಗಳು ಮಾದರಿ ಸೂಚಕಗಳು ಮಾತ್ರ, ನೈಜ ಪ್ರತಿಕ್ರಿಯೆಯ ಮಾನ್ಯ ಅಳತೆಗಳಲ್ಲ.",
    replayScenario: "ಈ ಸನ್ನಿವೇಶವನ್ನು ಮರುಪ್ರಯತ್ನಿಸಿ",
    responseRecommendations: "ನಿಯಮಾಧಾರಿತ ತರಬೇತಿ ಸಾಧನ ಮಾತ್ರ. ನೈಜ ತುರ್ತು ಪರಿಸ್ಥಿತಿಗೆ ಬಳಸಬೇಡಿ.",
    generateReport: "ಈ ಸಾಧನದಲ್ಲೇ ಉಳಿಸಲಾಗಿದೆ. ಹೋಲಿಕೆಗಳು ಮಾದರಿ ಸೂಚಕಗಳು ಮಾತ್ರ.",
    actions: "ಕ್ರಮಗಳು",
    responseUnits: "ಪ್ರತಿಕ್ರಿಯೆ ಘಟಕಗಳು",
    centres: "ಕೇಂದ್ರಗಳು",
    latestScoreDifference: "ಇತ್ತೀಚಿನ ಅಂಕ ವ್ಯತ್ಯಾಸ:",
    requestCompletion: "ವಿನಂತಿ ಪೂರ್ಣತೆ:",
    vs: "ವಿರುದ್ಧ",
    entries: "ದಾಖಲೆಗಳು",
    keyboardHelp: "← / → ಬಳಸಿ ಮುಂದೆ-ಹಿಂದೆ · ಮುಚ್ಚಲು Esc",
    scenario: "ಸನ್ನಿವೇಶ",
  },
  hi: {
    teamPerspective: "टीम का दृष्टिकोण",
    cityOperations: "शहर संचालन",
    trainingSimulation: "प्रशिक्षण सिम्युलेशन",
    elapsedLabel: "बीता समय",
    chooseRole: "प्रतिक्रिया भूमिका चुनें",
    handoff: "साझा प्रशिक्षण · टीमों के बीच कार्य सौंपने के लिए भूमिका बदलें",
    commandFocus: "क्षेत्रों, अनुरोधों और उपलब्ध संसाधनों के बीच प्रतिक्रिया समन्वित करें।",
    fieldFocus: "प्रतिक्रिया तैनाती को प्राथमिकता दें और चुने गए क्षेत्र की पहुँच जाँचें।",
    resourceFocus: "सिम्युलेटेड आश्रय क्षमता और आपूर्ति आवंटन प्रबंधित करें।",
    publicFocus: "आने वाली जरूरतें देखें और सार्वजनिक चेतावनी का दायरा बढ़ाएँ।",
    incidentCommand: "घटना नियंत्रण",
    fieldOperations: "मैदानी संचालन",
    resourceCoordination: "संसाधन समन्वय",
    publicInformation: "जन सूचना",
    mapOverview: "मंगलुरु · OPENSTREETMAP",
    cityMap: "शहर का नक्शा",
    actionTypes: "कार्रवाई प्रकार",
    simulatedAreas: "सिम्युलेटेड क्षेत्र",
    impactPercent: "% प्रभाव",
    loadout: "परिदृश्य संसाधन",
    resourceAllocation: "सिम्युलेटेड संसाधन आवंटन",
    incoming: "आने वाले",
    requests: "अनुरोध और सेवा आवश्यकताएँ",
    responseActions: "प्रतिक्रिया कार्रवाइयाँ",
    availableTo: "के लिए उपलब्ध:",
    switchRoles: "अन्य कार्य सौंपने के लिए ऊपर भूमिका बदलें।",
    startExercise: "यादृच्छिक अभ्यास शुरू करें",
    running: "अभ्यास जारी है",
    resetExercise: "अभ्यास रीसेट करें",
    language: "भाषा",
    present: "निर्देशित प्रस्तुति",
    replayCompare: "अभ्यास तुलना",
    noSavedRuns: "अभ्यास पूरा होने पर यहाँ सहेजा जाएगा।",
    savedRuns: "हाल के पूरे अभ्यास",
    sharedRunsUnavailable: "साझा अभ्यास इतिहास उपलब्ध नहीं है। सर्वर कनेक्शन जाँचें और फिर प्रयास करें।",
    loadingRuns: "साझा अभ्यास लोड हो रहे हैं…",
    retry: "फिर प्रयास करें",
    teamAccess: "टीम एक्सेस",
    teamPassword: "साझा टीम पासवर्ड",
    teamPasswordPlaceholder: "टीम पासवर्ड दर्ज करें",
    teamSignIn: "रन सहेजने के लिए साइन इन करें",
    teamSignOut: "साइन आउट",
    teamSignInRequired: "पूरे हुए रन साझा इतिहास में सहेजने के लिए साइन इन करें।",
    teamPasswordUnconfigured: "सर्वर पर टीम एक्सेस कॉन्फ़िगर नहीं है।",
    teamSignInFailed: "साइन इन विफल हुआ। पासवर्ड जाँचकर फिर प्रयास करें।",
    teamSessionChecking: "टीम एक्सेस जाँचा जा रहा है…",
    presentationTitle: "60 सेकंड में PulseCity",
    presentationIntro: "काल्पनिक सेवा केंद्रों और पड़ोस के डेटा वाला प्रशिक्षण सिम्युलेशन।",
    presentationRoles: "अलग जिम्मेदारियों को देखने के लिए टीम की भूमिकाएँ बदलें।",
    presentationMap: "मानचित्र पर सिम्युलेटेड जोखिम क्षेत्र, सेवा केंद्र और उदाहरण मार्ग देखें।",
    presentationActions: "अभ्यास शुरू करें, अनुरोध सुलझाएँ और निर्णयों के प्रभाव देखें।",
    presentationReport: "पूरे अभ्यासों की तुलना करें। स्कोर केवल प्रोटोटाइप संकेतक हैं।",
    back: "वापस",
    next: "आगे",
    finish: "समाप्त",
    close: "बंद करें",
    overview: "अवलोकन",
    roleTasks: "भूमिका कार्य सूची",
    noRoleTasks: "इस भूमिका से मेल खाते खुले अनुरोध नहीं हैं।",
    task: "खुला अनुरोध",
    tasks: "खुले अनुरोध",
    highestPriority: "सर्वोच्च प्राथमिकता",
    dispatchAction: "प्रतिक्रिया भेजें",
    shelterAction: "आश्रय खोलें",
    publicAlertAction: "सार्वजनिक चेतावनी भेजें",
    suppliesAction: "आपूर्ति आवंटित करें",
    decisionRecord: "निर्णय रिकॉर्ड",
    actionsOutcomes: "कार्रवाई और परिणाम",
    simulationComplete: "सिम्युलेशन पूरा",
    reportTitle: "प्रतिक्रिया रिपोर्ट",
    eventLog: "घटना लॉग",
    decisionSupport: "निर्णय सहायता",
    responseBrief: "प्रतिक्रिया सारांश",
    generateBrief: "प्रतिक्रिया सारांश बनाएँ",
    exercise: "अभ्यास",
    scenarioControls: "परिदृश्य नियंत्रण",
    activity: "गतिविधि",
    requestsRemaining: "शेष अनुरोध",
    decisionsMade: "लिए गए निर्णय",
    resourcesRemaining: "शेष संसाधन",
    overallScore: "कुल स्कोर",
    of: "में से",
    units: "इकाइयाँ",
    unit: "इकाई",
    resolved: "हल किए गए",
    completed: "पूरे हुए",
    standingBy: "तैयार",
    liveSimulation: "सिम्युलेशन जारी",
    completeStatus: "पूरा",
    responseScore: "प्रतिक्रिया स्कोर",
    available: "उपलब्ध",
    safeCentres: "सुरक्षित केंद्र",
    open: "खुले",
    areaProfile: "क्षेत्र विवरण",
    population: "जनसंख्या",
    vulnerableResidents: "असुरक्षित निवासी",
    riskScore: "जोखिम स्कोर",
    pendingRequestCount: "लंबित अनुरोध",
    exposure: "प्रभाव",
    critical: "गंभीर",
    high: "उच्च",
    moderate: "मध्यम",
    low: "कम",
    alreadyOpen: "केंद्र पहले से खुला है",
    infrastructureReviewed: "बुनियादी ढाँचे की समीक्षा हुई",
    awaitingAction: "कार्रवाई की प्रतीक्षा",
    priority: "प्राथमिकता",
    pending: "लंबित",
    medical: "चिकित्सा",
    shelter: "आश्रय",
    mapAttribution: "© OpenStreetMap योगदानकर्ता। मानचित्र मंगलुरु के अनुमानित शहरी क्षेत्र तक सीमित है; यह आधिकारिक नगर-निगम सीमा नहीं है। लाइव टाइलों के लिए इंटरनेट आवश्यक है।",
    illustrativeValues: "उदाहरण मान · संचालन संबंधी मार्गदर्शन नहीं",
    responseBriefDescription: "संसाधन देने से पहले सर्वोच्च प्राथमिकता वाले अनुरोध और क्षेत्र के प्रभाव की समीक्षा करें।",
    trainingAidDisclaimer: "केवल नियम-आधारित प्रशिक्षण साधन। वास्तविक आपातकाल में उपयोग न करें।",
    simulationReportDisclaimer: "यह स्कोर सिम्युलेटेड परिदृश्य के लिए है, वास्तविक परिणामों का अनुमान नहीं। लंबित अनुरोधों की समीक्षा करें।",
    outOf100: "में से 100",
    requestsResolved: "हल किए गए अनुरोध",
    percentOfRequests: "सूचीबद्ध अनुरोधों में से",
    stillAwaiting: "कार्रवाई की प्रतीक्षा",
    elapsed: "बीत चुके",
    decisionEfficiency: "निर्णय दक्षता",
    requestCompletionLabel: "अनुरोध पूर्णता",
    equityIndicator: "समानता संकेतक",
    noRecordedActions: "इस अभ्यास में कोई प्रतिक्रिया कार्रवाई दर्ज नहीं हुई।",
    recorded: "दर्ज",
    resolvedPrefix: "हल:",
    review: "समीक्षा करें",
    allResolvedReview: "सभी सूचीबद्ध अनुरोध हल हुए। देखें कि कार्रवाई अलग-अलग पड़ोस और कमजोर निवासियों तक पहुँची या नहीं।",
    unresolvedReviewPrefix: "अभी",
    unresolvedReviewSuffix: "अनुरोध बाकी हैं। फिर से प्रयास करने से पहले उनकी प्राथमिकता और स्थान देखें।",
    scoringExplanation: "प्रतिक्रिया स्कोर 50 से शुरू होता है; पूरी कार्रवाइयों पर निश्चित अंक मिलते हैं। कुल स्कोर केवल प्रोटोटाइप संकेतक हैं, वास्तविक प्रतिक्रिया का मान्य माप नहीं।",
    replayScenario: "यह परिदृश्य फिर चलाएँ",
    responseRecommendations: "केवल नियम-आधारित प्रशिक्षण साधन। वास्तविक आपातकाल में उपयोग न करें।",
    generateReport: "केवल इसी डिवाइस पर सहेजा गया। तुलना के अंक उदाहरण मात्र हैं।",
    actions: "कार्रवाइयाँ",
    responseUnits: "प्रतिक्रिया इकाइयाँ",
    centres: "केंद्र",
    latestScoreDifference: "नवीनतम स्कोर अंतर:",
    requestCompletion: "अनुरोध पूर्णता:",
    vs: "बनाम",
    entries: "प्रविष्टियाँ",
    keyboardHelp: "← / → से जाएँ · बंद करने के लिए Esc",
    scenario: "परिदृश्य",
  },
};

const scenarioTerms: Record<Language, Record<string, string>> = {
  en: {},
  kn: {
    Flood: "ಪ್ರವಾಹ",
    Wildfire: "ಕಾಡ್ಗಿಚ್ಚು",
    Earthquake: "ಭೂಕಂಪ",
    "Extreme heat": "ತೀವ್ರ ಬಿಸಿ",
    "Power outage": "ವಿದ್ಯುತ್ ವ್ಯತ್ಯಯ",
    Cyberattack: "ಸೈಬರ್ ದಾಳಿ",
    Surathkal: "ಸುರತ್ಕಲ್",
    Kadri: "ಕದ್ರಿ",
    Hampankatta: "ಹಂಪನಕಟ್ಟೆ",
    Bolar: "ಬೋಳಾರ್",
    Baikampady: "ಬೈಕಂಪಾಡಿ",
    "Response vehicles": "ಪ್ರತಿಕ್ರಿಯೆ ವಾಹನಗಳು",
    "Rescue vehicles": "ರಕ್ಷಣಾ ವಾಹನಗಳು",
    "Medical vehicles": "ವೈದ್ಯಕೀಯ ವಾಹನಗಳು",
    "Service vehicles": "ಸೇವಾ ವಾಹನಗಳು",
    "Response teams": "ಪ್ರತಿಕ್ರಿಯೆ ತಂಡಗಳು",
    "Open shelter": "ತೆರೆದ ಆಶ್ರಯ ಕೇಂದ್ರ",
    "Open refuge centre": "ತೆರೆದ ಸುರಕ್ಷಿತ ಕೇಂದ್ರ",
    "Open assembly centre": "ತೆರೆದ ಸಭಾ ಕೇಂದ್ರ",
    "Open cooling centre": "ತೆರೆದ ತಂಪು ಕೇಂದ್ರ",
    "Open support centre": "ತೆರೆದ ಸಹಾಯ ಕೇಂದ್ರ",
    "Open information point": "ತೆರೆದ ಮಾಹಿತಿ ಕೇಂದ್ರ",
    "Supply units": "ಸರಬರಾಜು ಘಟಕಗಳು",
    "Safety supplies": "ಸುರಕ್ಷತಾ ಸಾಮಗ್ರಿಗಳು",
    "Medical supplies": "ವೈದ್ಯಕೀಯ ಸಾಮಗ್ರಿಗಳು",
    "Water and care units": "ನೀರು ಮತ್ತು ಆರೈಕೆ ಘಟಕಗಳು",
    "Backup power units": "ಪರ್ಯಾಯ ವಿದ್ಯುತ್ ಘಟಕಗಳು",
    "Offline coordination kits": "ಆಫ್‌ಲೈನ್ ಸಮನ್ವಯ ಕಿಟ್‌ಗಳು",
    "Manage Bridge A": "ಸೇತುವೆ A ನಿರ್ವಹಿಸಿ",
    "Set firebreak status": "ಅಗ್ನಿ ತಡೆ ಸ್ಥಿತಿ ಹೊಂದಿಸಿ",
    "Inspect Route A": "ಮಾರ್ಗ A ಪರಿಶೀಲಿಸಿ",
    "Check cooling-site power": "ತಂಪು ಕೇಂದ್ರದ ವಿದ್ಯುತ್ ಪರಿಶೀಲಿಸಿ",
    "Switch to backup grid": "ಪರ್ಯಾಯ ವಿದ್ಯುತ್ ಜಾಲಕ್ಕೆ ಬದಲಿಸಿ",
    "Switch to manual operations": "ಹಸ್ತಚಾಲಿತ ಕಾರ್ಯಾಚರಣೆಗೆ ಬದಲಿಸಿ",
    response: "ಪ್ರತಿಕ್ರಿಯೆ",
    shelter: "ಆಶ್ರಯ",
    alert: "ಎಚ್ಚರಿಕೆ",
    supplies: "ಸರಬರಾಜು",
    infrastructure: "ಮೂಲಸೌಕರ್ಯ",
    "Medical evacuation": "ವೈದ್ಯಕೀಯ ಸ್ಥಳಾಂತರ",
    "An injured resident needs transport.": "ಗಾಯಗೊಂಡ ನಿವಾಸಿಗೆ ಸಾರಿಗೆ ಅಗತ್ಯವಿದೆ.",
    "Shelter needed": "ಆಶ್ರಯ ಅಗತ್ಯ",
    "Residents need a safe, accessible location.": "ನಿವಾಸಿಗಳಿಗೆ ಸುರಕ್ಷಿತ, ಸುಲಭವಾಗಿ ತಲುಪಬಹುದಾದ ಸ್ಥಳ ಅಗತ್ಯ.",
    "Alert not received": "ಎಚ್ಚರಿಕೆ ತಲುಪಿಲ್ಲ",
    "Residents need an accessible warning.": "ನಿವಾಸಿಗಳಿಗೆ ಸುಲಭವಾಗಿ ತಲುಪುವ ಎಚ್ಚರಿಕೆ ಅಗತ್ಯ.",
    "Evacuation support": "ಸ್ಥಳಾಂತರ ಸಹಾಯ",
    "Residents need transport away from the simulated fire perimeter.": "ನಿವಾಸಿಗಳಿಗೆ ಅನುಕರಿಸಿದ ಅಗ್ನಿ ವಲಯದಿಂದ ಹೊರಗೆ ಸಾರಿಗೆ ಅಗತ್ಯ.",
    "Smoke exposure": "ಹೊಗೆಯ ಪರಿಣಾಮ",
    "Residents need masks and an indoor refuge.": "ನಿವಾಸಿಗಳಿಗೆ ಮುಖವಾಡ ಮತ್ತು ಒಳಾಂಗಣ ಸುರಕ್ಷಿತ ಸ್ಥಳ ಅಗತ್ಯ.",
    "Response team supplies": "ಪ್ರತಿಕ್ರಿಯೆ ತಂಡದ ಸರಬರಾಜು",
    "A response team needs water and protective supplies.": "ಪ್ರತಿಕ್ರಿಯೆ ತಂಡಕ್ಕೆ ನೀರು ಮತ್ತು ರಕ್ಷಣಾ ಸಾಮಗ್ರಿಗಳು ಅಗತ್ಯ.",
    "Medical response": "ವೈದ್ಯಕೀಯ ಪ್ರತಿಕ್ರಿಯೆ",
    "People are reported injured near damaged buildings.": "ಹಾನಿಗೊಂಡ ಕಟ್ಟಡಗಳ ಬಳಿ ಜನರು ಗಾಯಗೊಂಡಿದ್ದಾರೆಂದು ವರದಿಯಾಗಿದೆ.",
    "Safe assembly location": "ಸುರಕ್ಷಿತ ಸಭಾ ಸ್ಥಳ",
    "Residents need a verified open area.": "ನಿವಾಸಿಗಳಿಗೆ ಪರಿಶೀಲಿತ ತೆರೆದ ಪ್ರದೇಶ ಅಗತ್ಯ.",
    "Route blocked": "ಮಾರ್ಗ ತಡೆಗಟ್ಟಲಾಗಿದೆ",
    "Debris is obstructing an important road.": "ಅವಶೇಷಗಳು ಪ್ರಮುಖ ರಸ್ತೆಗೆ ಅಡ್ಡಿಯಾಗಿವೆ.",
    "Heat illness": "ಬಿಸಿಯಿಂದ ಅನಾರೋಗ್ಯ",
    "A resident needs medical attention and cooling.": "ನಿವಾಸಿಗೆ ವೈದ್ಯಕೀಯ ನೆರವು ಮತ್ತು ತಂಪು ಅಗತ್ಯ.",
    "Cooling centre needed": "ತಂಪು ಕೇಂದ್ರ ಅಗತ್ಯ",
    "Older residents need a cool, accessible location.": "ವಯೋವೃದ್ಧರಿಗೆ ತಂಪಾದ, ತಲುಪಬಹುದಾದ ಸ್ಥಳ ಅಗತ್ಯ.",
    "Water distribution": "ನೀರು ವಿತರಣೆ",
    "Workers need drinking water and shade.": "ಕಾರ್ಮಿಕರಿಗೆ ಕುಡಿಯುವ ನೀರು ಮತ್ತು ನೆರಳು ಅಗತ್ಯ.",
    "Hospital backup power": "ಆಸ್ಪತ್ರೆಯ ಪರ್ಯಾಯ ವಿದ್ಯುತ್",
    "A critical service needs backup power support.": "ಪ್ರಮುಖ ಸೇವೆಗೆ ಪರ್ಯಾಯ ವಿದ್ಯುತ್ ನೆರವು ಅಗತ್ಯ.",
    "Lift outage": "ಲಿಫ್ಟ್ ಸ್ಥಗಿತ",
    "Residents need assistance leaving a building.": "ಕಟ್ಟಡದಿಂದ ಹೊರಬರಲು ನಿವಾಸಿಗಳಿಗೆ ಸಹಾಯ ಅಗತ್ಯ.",
    "Communication outage": "ಸಂಪರ್ಕ ಸ್ಥಗಿತ",
    "Residents need information through another channel.": "ನಿವಾಸಿಗಳಿಗೆ ಮತ್ತೊಂದು ಮಾರ್ಗದ ಮೂಲಕ ಮಾಹಿತಿ ಅಗತ್ಯ.",
    "Critical service disruption": "ಪ್ರಮುಖ ಸೇವೆ ವ್ಯತ್ಯಯ",
    "A service needs verified manual coordination.": "ಸೇವೆಗೆ ಪರಿಶೀಲಿತ ಹಸ್ತಚಾಲಿತ ಸಮನ್ವಯ ಅಗತ್ಯ.",
    "Public information point": "ಸಾರ್ವಜನಿಕ ಮಾಹಿತಿ ಕೇಂದ್ರ",
    "Residents need a trusted offline information source.": "ನಿವಾಸಿಗಳಿಗೆ ವಿಶ್ವಾಸಾರ್ಹ ಆಫ್‌ಲೈನ್ ಮಾಹಿತಿ ಮೂಲ ಅಗತ್ಯ.",
    "Communications check": "ಸಂಪರ್ಕ ಪರಿಶೀಲನೆ",
    "Confirm which backup channel is working.": "ಯಾವ ಪರ್ಯಾಯ ಸಂಪರ್ಕ ಮಾರ್ಗ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತಿದೆ ಎಂದು ದೃಢಪಡಿಸಿ.",
    "Secondary response request": "ಹೆಚ್ಚುವರಿ ಪ್ರತಿಕ್ರಿಯೆ ವಿನಂತಿ",
    "A new simulated call has arrived. Reassess area priority and response capacity.": "ಹೊಸ ಅನುಕರಿಸಿದ ಕರೆ ಬಂದಿದೆ. ಪ್ರದೇಶದ ಆದ್ಯತೆ ಮತ್ತು ಪ್ರತಿಕ್ರಿಯೆ ಸಾಮರ್ಥ್ಯವನ್ನು ಮರುಪರಿಶೀಲಿಸಿ.",
    Medical: "ವೈದ್ಯಕೀಯ",
    Dispatch: "ನಿಯೋಜಿಸಿ",
    Allocate: "ಹಂಚಿ",
    "Send public alert": "ಸಾರ್ವಜನಿಕ ಎಚ್ಚರಿಕೆ ಕಳುಹಿಸಿ",
  },
  hi: {
    Flood: "बाढ़",
    Wildfire: "जंगल की आग",
    Earthquake: "भूकंप",
    "Extreme heat": "भीषण गर्मी",
    "Power outage": "बिजली बाधित",
    Cyberattack: "साइबर हमला",
    Surathkal: "सुरथकल",
    Kadri: "कद्री",
    Hampankatta: "हम्पनकट्टा",
    Bolar: "बोलार",
    Baikampady: "बैकम्पाडी",
    "Response vehicles": "प्रतिक्रिया वाहन",
    "Rescue vehicles": "बचाव वाहन",
    "Medical vehicles": "चिकित्सा वाहन",
    "Service vehicles": "सेवा वाहन",
    "Response teams": "प्रतिक्रिया दल",
    "Open shelter": "खुला आश्रय केंद्र",
    "Open refuge centre": "खुला सुरक्षित केंद्र",
    "Open assembly centre": "खुला सभा केंद्र",
    "Open cooling centre": "खुला शीतलन केंद्र",
    "Open support centre": "खुला सहायता केंद्र",
    "Open information point": "खुला सूचना केंद्र",
    "Supply units": "आपूर्ति इकाइयाँ",
    "Safety supplies": "सुरक्षा सामग्री",
    "Medical supplies": "चिकित्सा सामग्री",
    "Water and care units": "पानी और देखभाल इकाइयाँ",
    "Backup power units": "बैकअप बिजली इकाइयाँ",
    "Offline coordination kits": "ऑफ़लाइन समन्वय किट",
    "Manage Bridge A": "ब्रिज A प्रबंधित करें",
    "Set firebreak status": "अग्नि अवरोध स्थिति तय करें",
    "Inspect Route A": "मार्ग A का निरीक्षण करें",
    "Check cooling-site power": "शीतलन केंद्र की बिजली जाँचें",
    "Switch to backup grid": "बैकअप ग्रिड पर जाएँ",
    "Switch to manual operations": "मैन्युअल संचालन पर जाएँ",
    response: "प्रतिक्रिया",
    shelter: "आश्रय",
    alert: "चेतावनी",
    supplies: "आपूर्ति",
    infrastructure: "बुनियादी ढाँचा",
    "Medical evacuation": "चिकित्सा निकासी",
    "An injured resident needs transport.": "एक घायल निवासी को परिवहन चाहिए।",
    "Shelter needed": "आश्रय चाहिए",
    "Residents need a safe, accessible location.": "निवासियों को सुरक्षित और सुलभ स्थान चाहिए।",
    "Alert not received": "चेतावनी नहीं मिली",
    "Residents need an accessible warning.": "निवासियों को सुलभ चेतावनी चाहिए।",
    "Evacuation support": "निकासी सहायता",
    "Residents need transport away from the simulated fire perimeter.": "निवासियों को सिम्युलेटेड आग के दायरे से बाहर परिवहन चाहिए।",
    "Smoke exposure": "धुएँ का प्रभाव",
    "Residents need masks and an indoor refuge.": "निवासियों को मास्क और अंदर सुरक्षित स्थान चाहिए।",
    "Response team supplies": "प्रतिक्रिया दल की आपूर्ति",
    "A response team needs water and protective supplies.": "प्रतिक्रिया दल को पानी और सुरक्षा सामग्री चाहिए।",
    "Medical response": "चिकित्सा प्रतिक्रिया",
    "People are reported injured near damaged buildings.": "क्षतिग्रस्त इमारतों के पास लोगों के घायल होने की सूचना है।",
    "Safe assembly location": "सुरक्षित सभा स्थल",
    "Residents need a verified open area.": "निवासियों को सत्यापित खुला क्षेत्र चाहिए।",
    "Route blocked": "मार्ग अवरुद्ध",
    "Debris is obstructing an important road.": "मलबा एक महत्वपूर्ण सड़क को बाधित कर रहा है।",
    "Heat illness": "गर्मी से बीमारी",
    "A resident needs medical attention and cooling.": "एक निवासी को चिकित्सा सहायता और ठंडक चाहिए।",
    "Cooling centre needed": "शीतलन केंद्र चाहिए",
    "Older residents need a cool, accessible location.": "बुज़ुर्ग निवासियों को ठंडा और सुलभ स्थान चाहिए।",
    "Water distribution": "पानी वितरण",
    "Workers need drinking water and shade.": "कामगारों को पीने का पानी और छाया चाहिए।",
    "Hospital backup power": "अस्पताल बैकअप बिजली",
    "A critical service needs backup power support.": "एक महत्वपूर्ण सेवा को बैकअप बिजली सहायता चाहिए।",
    "Lift outage": "लिफ्ट बंद",
    "Residents need assistance leaving a building.": "निवासियों को इमारत से बाहर निकलने में सहायता चाहिए।",
    "Communication outage": "संचार बाधित",
    "Residents need information through another channel.": "निवासियों को दूसरे माध्यम से जानकारी चाहिए।",
    "Critical service disruption": "महत्वपूर्ण सेवा बाधित",
    "A service needs verified manual coordination.": "एक सेवा को सत्यापित मैन्युअल समन्वय चाहिए।",
    "Public information point": "जन सूचना केंद्र",
    "Residents need a trusted offline information source.": "निवासियों को विश्वसनीय ऑफ़लाइन सूचना स्रोत चाहिए।",
    "Communications check": "संचार जाँच",
    "Confirm which backup channel is working.": "पुष्टि करें कि कौन-सा बैकअप माध्यम काम कर रहा है।",
    "Secondary response request": "दूसरा प्रतिक्रिया अनुरोध",
    "A new simulated call has arrived. Reassess area priority and response capacity.": "एक नया सिम्युलेटेड कॉल आया है। क्षेत्र की प्राथमिकता और प्रतिक्रिया क्षमता फिर जाँचें।",
    Medical: "चिकित्सा",
    Dispatch: "भेजें",
    Allocate: "आवंटित करें",
    "Send public alert": "सार्वजनिक चेतावनी भेजें",
  },
};

const roleTranslationKeys: Record<RoleId, CopyKey> = {
  command: "incidentCommand",
  field: "fieldOperations",
  resources: "resourceCoordination",
  public: "publicInformation",
};

const roleFocusKeys: Record<RoleId, CopyKey> = {
  command: "commandFocus",
  field: "fieldFocus",
  resources: "resourceFocus",
  public: "publicFocus",
};

const roleNeedTypes: Record<RoleId, NeedType[]> = {
  command: ["response", "shelter", "alert", "supplies", "infrastructure"],
  field: ["response", "infrastructure"],
  resources: ["shelter", "supplies"],
  public: ["alert"],
};

const presentationSlides: CopyKey[] = [
  "presentationIntro",
  "presentationRoles",
  "presentationMap",
  "presentationActions",
  "presentationReport",
];

function isSavedRun(value: unknown): value is SavedRun {
  if (typeof value !== "object" || value === null) return false;
  const run = value as Partial<SavedRun>;
  return (
    typeof run.id === "number" &&
    typeof run.crisisName === "string" &&
    typeof run.completedAt === "string" &&
    typeof run.score === "number" &&
    typeof run.requestsResolved === "number" &&
    typeof run.requestTotal === "number" &&
    typeof run.actionsTaken === "number" &&
    typeof run.responseUnitsUsed === "number" &&
    typeof run.supplyUnitsUsed === "number" &&
    typeof run.sheltersOpened === "number" &&
    typeof run.outcomes === "number"
  );
}

const runStoreKeys = {
  legacyRuns: "pulsecity-completed-runs",
  legacyMigrated: "pulsecity-runs-migrated",
  clientInstance: "pulsecity-client-instance",
} as const;

function getClientInstanceId() {
  let instanceId = window.localStorage.getItem(runStoreKeys.clientInstance);
  if (!instanceId) {
    instanceId = window.crypto.randomUUID();
    window.localStorage.setItem(runStoreKeys.clientInstance, instanceId);
  }
  return instanceId;
}

const simulationRoles: {
  id: RoleId;
  name: string;
  focus: string;
  actions: readonly RoleAction[];
}[] = [
  {
    id: "command",
    name: "Incident command",
    focus: "Coordinate the full response across areas, requests, and available resources.",
    actions: ["dispatch", "shelter", "alert", "supplies", "infrastructure"],
  },
  {
    id: "field",
    name: "Field operations",
    focus: "Prioritize response dispatches and review access or infrastructure in the selected area.",
    actions: ["dispatch", "infrastructure"],
  },
  {
    id: "resources",
    name: "Resource coordination",
    focus: "Manage simulated shelter capacity and supply allocations against listed needs.",
    actions: ["shelter", "supplies"],
  },
  {
    id: "public",
    name: "Public information",
    focus: "Monitor incoming needs and extend simulated public-alert coverage.",
    actions: ["alert"],
  },
];

const crises: Crisis[] = [
  {
    id: "flood",
    name: "Flood",
    icon: "🌊",
    description: "Rising water, blocked roads, and evacuation requests.",
    color: "#38bdf8",
    resourceAllocation: { responseUnits: 2, safeCentres: 2, supplies: 80 },
    resourceName: "Response vehicles",
    safePlaceName: "Open shelter",
    supplyName: "Supply units",
    infrastructureAction: "Manage Bridge A",
    infrastructureResult: "Bridge A changed status. Check whether it is safe for response vehicles.",
    firstEvent: "Heavy rainfall begins. Low-lying roads are at risk.",
    escalationEvent: "Floodwater is rising in a low-lying neighborhood.",
    laterEvent: "Check evacuation routes and shelter capacity.",
    requests: [
      { id: "req-1", zoneId: "ward-3", title: "Medical evacuation", detail: "An injured resident needs transport.", urgency: 95, need: "response" },
      { id: "req-2", zoneId: "ward-4", title: "Shelter needed", detail: "Residents need a safe, accessible location.", urgency: 78, need: "shelter" },
      { id: "req-3", zoneId: "ward-5", title: "Alert not received", detail: "Residents need an accessible warning.", urgency: 60, need: "alert" },
    ],
  },
  {
    id: "wildfire",
    name: "Wildfire",
    icon: "🔥",
    description: "Fire spread, smoke exposure, and evacuation decisions.",
    color: "#fb923c",
    resourceAllocation: { responseUnits: 3, safeCentres: 2, supplies: 100 },
    resourceName: "Response vehicles",
    safePlaceName: "Open refuge centre",
    supplyName: "Safety supplies",
    infrastructureAction: "Set firebreak status",
    infrastructureResult: "Firebreak status changed. Recheck nearby exposure and access routes.",
    firstEvent: "A wildfire is reported near the city boundary.",
    escalationEvent: "Smoke is affecting nearby neighborhoods. Review evacuation zones.",
    laterEvent: "Reassess wind direction, exposure, and refuge capacity.",
    requests: [
      { id: "req-1", zoneId: "ward-3", title: "Evacuation support", detail: "Residents need transport away from the simulated fire perimeter.", urgency: 95, need: "response" },
      { id: "req-2", zoneId: "ward-2", title: "Smoke exposure", detail: "Residents need masks and an indoor refuge.", urgency: 76, need: "supplies" },
      { id: "req-3", zoneId: "ward-5", title: "Response team supplies", detail: "A response team needs water and protective supplies.", urgency: 70, need: "supplies" },
    ],
  },
  {
    id: "earthquake",
    name: "Earthquake",
    icon: "🏚️",
    description: "Building damage, medical needs, and blocked routes.",
    color: "#c084fc",
    resourceAllocation: { responseUnits: 3, safeCentres: 1, supplies: 120 },
    resourceName: "Rescue vehicles",
    safePlaceName: "Open assembly centre",
    supplyName: "Medical supplies",
    infrastructureAction: "Inspect Route A",
    infrastructureResult: "Route A inspection status changed. Verify access before dispatching.",
    firstEvent: "An earthquake has been detected. Assess damage and urgent needs.",
    escalationEvent: "A road is reported blocked by debris. Prioritize safe medical access.",
    laterEvent: "Check building assessments and unresolved medical requests.",
    requests: [
      { id: "req-1", zoneId: "ward-3", title: "Medical response", detail: "People are reported injured near damaged buildings.", urgency: 98, need: "response" },
      { id: "req-2", zoneId: "ward-4", title: "Safe assembly location", detail: "Residents need a verified open area.", urgency: 78, need: "shelter" },
      { id: "req-3", zoneId: "ward-2", title: "Route blocked", detail: "Debris is obstructing an important road.", urgency: 68, need: "infrastructure" },
    ],
  },
  {
    id: "heatwave",
    name: "Extreme heat",
    icon: "☀️",
    description: "Heat illness, cooling centres, and water distribution.",
    color: "#fbbf24",
    resourceAllocation: { responseUnits: 2, safeCentres: 3, supplies: 120 },
    resourceName: "Medical vehicles",
    safePlaceName: "Open cooling centre",
    supplyName: "Water and care units",
    infrastructureAction: "Check cooling-site power",
    infrastructureResult: "Cooling-site power status changed. Check backup power before directing people there.",
    firstEvent: "An extreme heat alert is issued for the city.",
    escalationEvent: "Heat-related medical requests are increasing.",
    laterEvent: "Check water distribution and access for vulnerable residents.",
    requests: [
      { id: "req-1", zoneId: "ward-3", title: "Heat illness", detail: "A resident needs medical attention and cooling.", urgency: 92, need: "response" },
      { id: "req-2", zoneId: "ward-4", title: "Cooling centre needed", detail: "Older residents need a cool, accessible location.", urgency: 82, need: "shelter" },
      { id: "req-3", zoneId: "ward-5", title: "Water distribution", detail: "Workers need drinking water and shade.", urgency: 65, need: "supplies" },
    ],
  },
  {
    id: "power",
    name: "Power outage",
    icon: "⚡",
    description: "Service disruption, hospital backup, and public communication.",
    color: "#facc15",
    resourceAllocation: { responseUnits: 2, safeCentres: 2, supplies: 100 },
    resourceName: "Service vehicles",
    safePlaceName: "Open support centre",
    supplyName: "Backup power units",
    infrastructureAction: "Switch to backup grid",
    infrastructureResult: "Backup grid status changed. Check which services remain powered.",
    firstEvent: "A simulated power outage affects part of the city.",
    escalationEvent: "Backup power is limited at a critical service location.",
    laterEvent: "Check accessibility, communications, and critical-service needs.",
    requests: [
      { id: "req-1", zoneId: "ward-3", title: "Hospital backup power", detail: "A critical service needs backup power support.", urgency: 98, need: "infrastructure" },
      { id: "req-2", zoneId: "ward-4", title: "Lift outage", detail: "Residents need assistance leaving a building.", urgency: 78, need: "response" },
      { id: "req-3", zoneId: "ward-2", title: "Communication outage", detail: "Residents need information through another channel.", urgency: 66, need: "alert" },
    ],
  },
  {
    id: "cyberattack",
    name: "Cyberattack",
    icon: "🛡️",
    description: "Disrupted digital services and safe manual coordination.",
    color: "#4ade80",
    resourceAllocation: { responseUnits: 2, safeCentres: 2, supplies: 80 },
    resourceName: "Response teams",
    safePlaceName: "Open information point",
    supplyName: "Offline coordination kits",
    infrastructureAction: "Switch to manual operations",
    infrastructureResult: "Manual-operations status changed. Verify information through trusted channels.",
    firstEvent: "A simulated cyber incident disrupts some city services.",
    escalationEvent: "Digital communications are unreliable. Review backup channels.",
    laterEvent: "Confirm reports before acting and protect sensitive information.",
    requests: [
      { id: "req-1", zoneId: "ward-3", title: "Critical service disruption", detail: "A service needs verified manual coordination.", urgency: 90, need: "infrastructure" },
      { id: "req-2", zoneId: "ward-4", title: "Public information point", detail: "Residents need a trusted offline information source.", urgency: 76, need: "shelter" },
      { id: "req-3", zoneId: "ward-2", title: "Communications check", detail: "Confirm which backup channel is working.", urgency: 65, need: "alert" },
    ],
  },
];

const baseZones: Omit<Zone, "risk" | "impact">[] = [
  { id: "ward-1", name: "Surathkal", x: 51, y: 15, population: 820, vulnerable: 90 },
  { id: "ward-2", name: "Kadri", x: 74, y: 49, population: 1100, vulnerable: 150 },
  { id: "ward-3", name: "Hampankatta", x: 49, y: 54, population: 1350, vulnerable: 240 },
  { id: "ward-4", name: "Bolar", x: 42, y: 75, population: 950, vulnerable: 180 },
  { id: "ward-5", name: "Baikampady", x: 50, y: 29, population: 740, vulnerable: 130 },
];

function makeZones(crisis: Crisis): Zone[] {
  const variations = [0, 8, 17, 11, 5];

  return baseZones.map((zone, index) => ({
    ...zone,
    risk: Math.min(95, 35 + variations[index] + (crisis.id === "cyberattack" ? 5 : 10)),
    impact: 8 + variations[index] / 2,
  }));
}

function makeRequests(crisis: Crisis): RequestItem[] {
  return crisis.requests.map((request) => ({ ...request, status: "pending" }));
}

function formatTime(seconds: number) {
  const elapsed = 180 - seconds;
  const minutes = Math.floor(elapsed / 60).toString().padStart(2, "0");
  const secs = (elapsed % 60).toString().padStart(2, "0");
  return `${minutes}:${secs}`;
}

function riskLabel(risk: number): CopyKey {
  if (risk >= 80) return "critical";
  if (risk >= 60) return "high";
  if (risk >= 40) return "moderate";
  return "low";
}

export default function Home() {
  const [crisisId, setCrisisId] = useState<CrisisId>("flood");
  const [roleId, setRoleId] = useState<RoleId>("command");
  const [language, setLanguage] = useState<Language>("en");
  const [presentationStep, setPresentationStep] = useState<number | null>(null);
  const [savedRuns, setSavedRuns] = useState<SavedRun[]>([]);
  const [runsLoaded, setRunsLoaded] = useState(false);
  const [runsLoadAttempt, setRunsLoadAttempt] = useState(0);
  const [runsError, setRunsError] = useState(false);
  const [teamAccess, setTeamAccess] = useState<
    "checking" | "signed-out" | "signed-in" | "unconfigured"
  >("checking");
  const [teamPassword, setTeamPassword] = useState("");
  const [teamAccessError, setTeamAccessError] = useState("");
  const activeRunId = useRef<number | null>(null);
  const savedRunIds = useRef(new Set<number>());
  const clientInstanceId = useRef<string | null>(null);
  const presentationDialogRef = useRef<HTMLElement | null>(null);
  const presentationTriggerRef = useRef<HTMLButtonElement | null>(null);
  const presentationWasOpen = useRef(false);
  const t = (key: CopyKey) => translatedCopy[language][key] ?? englishCopy[key];
  const localizeTerm = (value: string) => {
    const terms = scenarioTerms[language];
    if (terms[value]) return terms[value];
    const capitalized = value.length > 0 ? value[0].toUpperCase() + value.slice(1) : value;
    if (terms[capitalized]) return terms[capitalized];
    return value;
  };
  const localize = (value: string) => {
    if (value.startsWith("Dispatch ")) {
      const resource = value.slice("Dispatch ".length);
      return `${localizeTerm("Dispatch")} ${localizeTerm(resource)}`;
    }
    if (value.startsWith("Allocate ")) {
      const resource = value.slice("Allocate ".length);
      return `${localizeTerm("Allocate")} ${localizeTerm(resource)}`;
    }
    return localizeTerm(value);
  };
  const localizeNarrative = (message: string): string => {
    if (language === "en") return message;

    const translations: Record<Exclude<Language, "en">, Record<string, string>> = {
      kn: {
        "Heavy rainfall begins. Low-lying roads are at risk.": "ಭಾರಿ ಮಳೆ ಆರಂಭವಾಗಿದೆ. ತಗ್ಗು ಪ್ರದೇಶದ ರಸ್ತೆಗಳು ಅಪಾಯದಲ್ಲಿವೆ.",
        "A wildfire is reported near the city boundary.": "ನಗರದ ಗಡಿಯ ಬಳಿ ಕಾಡ್ಗಿಚ್ಚು ವರದಿಯಾಗಿದೆ.",
        "An earthquake has been detected. Assess damage and urgent needs.": "ಭೂಕಂಪ ಸಂಭವಿಸಿರುವುದಾಗಿ ಪತ್ತೆಯಾಗಿದೆ. ಹಾನಿ ಮತ್ತು ತುರ್ತು ಅಗತ್ಯಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.",
        "An extreme heat alert is issued for the city.": "ನಗರಕ್ಕೆ ತೀವ್ರ ಬಿಸಿಯ ಎಚ್ಚರಿಕೆ ನೀಡಲಾಗಿದೆ.",
        "A simulated power outage affects part of the city.": "ಅನುಕರಿಸಿದ ವಿದ್ಯುತ್ ವ್ಯತ್ಯಯವು ನಗರದ ಒಂದು ಭಾಗದ ಮೇಲೆ ಪರಿಣಾಮ ಬೀರಿದೆ.",
        "A simulated cyber incident disrupts some city services.": "ಅನುಕರಿಸಿದ ಸೈಬರ್ ಘಟನೆಯಿಂದ ಕೆಲವು ನಗರ ಸೇವೆಗಳಿಗೆ ವ್ಯತ್ಯಯವಾಗಿದೆ.",
        "Floodwater is rising in a low-lying neighborhood.": "ತಗ್ಗು ಪ್ರದೇಶದ ನೆರೆಹೊರೆಯಲ್ಲಿ ಪ್ರವಾಹದ ನೀರು ಏರುತ್ತಿದೆ.",
        "Smoke is affecting nearby neighborhoods. Review evacuation zones.": "ಹೊಗೆಯು ಹತ್ತಿರದ ಪ್ರದೇಶಗಳ ಮೇಲೆ ಪರಿಣಾಮ ಬೀರುತ್ತಿದೆ. ಸ್ಥಳಾಂತರ ವಲಯಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.",
        "A road is reported blocked by debris. Prioritize safe medical access.": "ಅವಶೇಷಗಳಿಂದ ರಸ್ತೆ ಮುಚ್ಚಿರುವ ವರದಿ ಇದೆ. ಸುರಕ್ಷಿತ ವೈದ್ಯಕೀಯ ಪ್ರವೇಶಕ್ಕೆ ಆದ್ಯತೆ ನೀಡಿ.",
        "Heat-related medical requests are increasing.": "ಬಿಸಿಯಿಂದ ಉಂಟಾಗುವ ವೈದ್ಯಕೀಯ ವಿನಂತಿಗಳು ಹೆಚ್ಚುತ್ತಿವೆ.",
        "Backup power is limited at a critical service location.": "ಪ್ರಮುಖ ಸೇವಾ ಸ್ಥಳದಲ್ಲಿ ಪರ್ಯಾಯ ವಿದ್ಯುತ್ ಸೀಮಿತವಾಗಿದೆ.",
        "Digital communications are unreliable. Review backup channels.": "ಡಿಜಿಟಲ್ ಸಂವಹನಗಳು ವಿಶ್ವಾಸಾರ್ಹವಾಗಿಲ್ಲ. ಪರ್ಯಾಯ ಮಾರ್ಗಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.",
        "Check evacuation routes and shelter capacity.": "ಸ್ಥಳಾಂತರ ಮಾರ್ಗಗಳು ಮತ್ತು ಆಶ್ರಯ ಸಾಮರ್ಥ್ಯ ಪರಿಶೀಲಿಸಿ.",
        "Reassess wind direction, exposure, and refuge capacity.": "ಗಾಳಿಯ ದಿಕ್ಕು, ಅಪಾಯದ ಪರಿಣಾಮ ಮತ್ತು ಆಶ್ರಯ ಸಾಮರ್ಥ್ಯವನ್ನು ಮರುಪರಿಶೀಲಿಸಿ.",
        "Check building assessments and unresolved medical requests.": "ಕಟ್ಟಡಗಳ ಮೌಲ್ಯಮಾಪನ ಮತ್ತು ಬಾಕಿ ವೈದ್ಯಕೀಯ ವಿನಂತಿಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.",
        "Check water distribution and access for vulnerable residents.": "ನೀರಿನ ವಿತರಣೆ ಮತ್ತು ದುರ್ಬಲ ನಿವಾಸಿಗಳ ಪ್ರವೇಶ ಪರಿಶೀಲಿಸಿ.",
        "Check accessibility, communications, and critical-service needs.": "ಪ್ರವೇಶಸಾಧ್ಯತೆ, ಸಂವಹನ ಮತ್ತು ಪ್ರಮುಖ ಸೇವೆಗಳ ಅಗತ್ಯ ಪರಿಶೀಲಿಸಿ.",
        "Confirm reports before acting and protect sensitive information.": "ಕ್ರಮ ಕೈಗೊಳ್ಳುವ ಮೊದಲು ವರದಿಗಳನ್ನು ದೃಢೀಕರಿಸಿ ಮತ್ತು ಸೂಕ್ಷ್ಮ ಮಾಹಿತಿಯನ್ನು ರಕ್ಷಿಸಿ.",
        "New simulated requests have arrived. Review urgency and location.": "ಹೊಸ ಅನುಕರಿಸಿದ ವಿನಂತಿಗಳು ಬಂದಿವೆ. ತುರ್ತುತೆ ಮತ್ತು ಸ್ಥಳ ಪರಿಶೀಲಿಸಿ.",
        "Scenario complete. Review your response report.": "ಸನ್ನಿವೇಶ ಪೂರ್ಣಗೊಂಡಿದೆ. ಪ್ರತಿಕ್ರಿಯೆ ವರದಿಯನ್ನು ಪರಿಶೀಲಿಸಿ.",
        "Alert delivered; local impact reduced by 2 points.": "ಎಚ್ಚರಿಕೆ ತಲುಪಿಸಲಾಗಿದೆ; ಸ್ಥಳೀಯ ಪರಿಣಾಮ 2 ಅಂಕ ಕಡಿಮೆಯಾಗಿದೆ.",
        "Alert coverage expanded; no listed communication request needed resolution.": "ಎಚ್ಚರಿಕೆ ವ್ಯಾಪ್ತಿ ಹೆಚ್ಚಿಸಲಾಗಿದೆ; ಪಟ್ಟಿಯಲ್ಲಿದ್ದ ಸಂವಹನ ವಿನಂತಿಯನ್ನು ಪರಿಹರಿಸುವ ಅಗತ್ಯವಿರಲಿಲ್ಲ.",
        "Centre opened; local impact reduced by 4 points.": "ಕೇಂದ್ರ ತೆರೆಯಲಾಗಿದೆ; ಸ್ಥಳೀಯ ಪರಿಣಾಮ 4 ಅಂಕ ಕಡಿಮೆಯಾಗಿದೆ.",
        "One response unit used; ": "ಒಂದು ಪ್ರತಿಕ್ರಿಯೆ ಘಟಕ ಬಳಸಲಾಗಿದೆ; ",
        " handled and local impact reduced by 3 points.": " ನಿರ್ವಹಿಸಲಾಗಿದೆ ಮತ್ತು ಸ್ಥಳೀಯ ಪರಿಣಾಮ 3 ಅಂಕ ಕಡಿಮೆಯಾಗಿದೆ.",
        " local impact reduced by 6 points.": " ಸ್ಥಳೀಯ ಪರಿಣಾಮ 6 ಅಂಕ ಕಡಿಮೆಯಾಗಿದೆ.",
        "Area conditions reviewed; local impact reduced by 6 points.": "ಪ್ರದೇಶದ ಪರಿಸ್ಥಿತಿಗಳನ್ನು ಪರಿಶೀಲಿಸಲಾಗಿದೆ; ಸ್ಥಳೀಯ ಪರಿಣಾಮ 6 ಅಂಕ ಕಡಿಮೆಯಾಗಿದೆ.",
        "New development: a secondary response request is reported in ": "ಹೊಸ ಬೆಳವಣಿಗೆ: ಹೆಚ್ಚುವರಿ ಪ್ರತಿಕ್ರಿಯೆ ವಿನಂತಿ ವರದಿಯಾಗಿದೆ — ",
        "Positive development: coordinated action stabilized conditions in ": "ಸಕಾರಾತ್ಮಕ ಬೆಳವಣಿಗೆ: ಸಮನ್ವಯಿತ ಕ್ರಮದಿಂದ ಪರಿಸ್ಥಿತಿ ಸ್ಥಿರವಾಗಿದೆ — ",
        "Conditions worsened in ": "ಪರಿಸ್ಥಿತಿ ಹದಗೆಟ್ಟಿದೆ — ",
        "; the secondary request remains open.": "; ಹೆಚ್ಚುವರಿ ವಿನಂತಿ ಇನ್ನೂ ಬಾಕಿಯಿದೆ.",
      },
      hi: {
        "Heavy rainfall begins. Low-lying roads are at risk.": "भारी बारिश शुरू हो गई है। निचले इलाकों की सड़कें जोखिम में हैं।",
        "A wildfire is reported near the city boundary.": "शहर की सीमा के पास जंगल में आग की सूचना है।",
        "An earthquake has been detected. Assess damage and urgent needs.": "भूकंप का पता चला है। नुकसान और तत्काल जरूरतों का आकलन करें।",
        "An extreme heat alert is issued for the city.": "शहर के लिए अत्यधिक गर्मी की चेतावनी जारी की गई है।",
        "A simulated power outage affects part of the city.": "सिम्युलेटेड बिजली कटौती से शहर का एक हिस्सा प्रभावित है।",
        "A simulated cyber incident disrupts some city services.": "सिम्युलेटेड साइबर घटना से शहर की कुछ सेवाएँ बाधित हैं।",
        "Floodwater is rising in a low-lying neighborhood.": "निचले इलाके में बाढ़ का पानी बढ़ रहा है।",
        "Smoke is affecting nearby neighborhoods. Review evacuation zones.": "धुआँ आसपास के इलाकों को प्रभावित कर रहा है। निकासी क्षेत्रों की समीक्षा करें।",
        "A road is reported blocked by debris. Prioritize safe medical access.": "मलबे से सड़क बंद होने की सूचना है। सुरक्षित चिकित्सा पहुँच को प्राथमिकता दें।",
        "Heat-related medical requests are increasing.": "गर्मी से जुड़ी चिकित्सा सहायता की माँग बढ़ रही है।",
        "Backup power is limited at a critical service location.": "महत्वपूर्ण सेवा स्थल पर बैकअप बिजली सीमित है।",
        "Digital communications are unreliable. Review backup channels.": "डिजिटल संचार भरोसेमंद नहीं है। वैकल्पिक माध्यम देखें।",
        "Check evacuation routes and shelter capacity.": "निकासी मार्गों और आश्रय क्षमता की जाँच करें।",
        "Reassess wind direction, exposure, and refuge capacity.": "हवा की दिशा, जोखिम और सुरक्षित आश्रय क्षमता का फिर आकलन करें।",
        "Check building assessments and unresolved medical requests.": "इमारतों के आकलन और लंबित चिकित्सा अनुरोधों की जाँच करें।",
        "Check water distribution and access for vulnerable residents.": "पानी वितरण और असुरक्षित निवासियों की पहुँच जाँचें।",
        "Check accessibility, communications, and critical-service needs.": "पहुँच, संचार और आवश्यक सेवाओं की जरूरत जाँचें।",
        "Confirm reports before acting and protect sensitive information.": "कार्रवाई से पहले रिपोर्ट की पुष्टि करें और संवेदनशील जानकारी सुरक्षित रखें।",
        "New simulated requests have arrived. Review urgency and location.": "नए सिम्युलेटेड अनुरोध आए हैं। तात्कालिकता और स्थान देखें।",
        "Scenario complete. Review your response report.": "परिदृश्य पूरा हुआ। अपनी प्रतिक्रिया रिपोर्ट देखें।",
        "Alert delivered; local impact reduced by 2 points.": "चेतावनी पहुँचा दी गई; स्थानीय प्रभाव 2 अंक घटा।",
        "Alert coverage expanded; no listed communication request needed resolution.": "चेतावनी का दायरा बढ़ा; सूची में संचार संबंधी अनुरोध नहीं था।",
        "Centre opened; local impact reduced by 4 points.": "केंद्र खोला गया; स्थानीय प्रभाव 4 अंक घटा।",
        "One response unit used; ": "एक प्रतिक्रिया इकाई उपयोग हुई; ",
        " handled and local impact reduced by 3 points.": " का प्रबंधन हुआ और स्थानीय प्रभाव 3 अंक घटा।",
        " local impact reduced by 6 points.": " स्थानीय प्रभाव 6 अंक घटा।",
        "Area conditions reviewed; local impact reduced by 6 points.": "क्षेत्र की स्थिति की समीक्षा हुई; स्थानीय प्रभाव 6 अंक घटा।",
        "New development: a secondary response request is reported in ": "नई जानकारी: अतिरिक्त प्रतिक्रिया अनुरोध की सूचना — ",
        "Positive development: coordinated action stabilized conditions in ": "सकारात्मक जानकारी: समन्वित कार्रवाई से स्थिति स्थिर हुई — ",
        "Conditions worsened in ": "स्थिति बिगड़ी — ",
        "; the secondary request remains open.": "; अतिरिक्त अनुरोध अभी लंबित है।",
      },
    };

    if (message.startsWith("Conditions worsened in ")) {
      const [zone] = message.slice("Conditions worsened in ".length).split("; the secondary request remains open.");
      return `${translations[language]["Conditions worsened in "]}${localizeTerm(zone)}${translations[language]["; the secondary request remains open."]}`;
    };

    const actionSeparator = message.indexOf(" · ");
    const resultSeparator = message.indexOf(": ", actionSeparator + 3);
    if (actionSeparator > 0 && resultSeparator > actionSeparator) {
      return `${localize(message.slice(0, actionSeparator))} · ${localizeTerm(message.slice(actionSeparator + 3, resultSeparator))}: ${localizeNarrative(message.slice(resultSeparator + 2))}`;
    }
    if (message.startsWith("New development: a secondary response request is reported in ") ||
      message.startsWith("Positive development: coordinated action stabilized conditions in ")) {
      const marker = message.startsWith("New development:") ? "New development: a secondary response request is reported in " : "Positive development: coordinated action stabilized conditions in ";
      return `${translations[language][marker]}${localizeTerm(message.slice(marker.length).replace(/\.$/, ""))}।`;
    }
    const scenarioMarker = " Random scenario selected: ";
    if (message.includes(scenarioMarker)) {
      const [opening, selected] = message.split(scenarioMarker);
      return `${localizeNarrative(opening)} ${language === "kn" ? "ಯಾದೃಚ್ಛಿಕ ಸನ್ನಿವೇಶ ಆಯ್ಕೆಮಾಡಲಾಗಿದೆ" : "यादृच्छिक परिदृश्य चुना गया"}: ${localizeTerm(selected.replace(/\.$/, ""))}.`;
    }
    if (message.startsWith("One response unit used; ")) {
      const [, target] = message.match(/^One response unit used; (.+) handled and local impact reduced by 3 points\.$/) ?? [];
      if (target) return `${translations[language]["One response unit used; "]}${localizeTerm(target)}${translations[language][" handled and local impact reduced by 3 points."]}`;
    }
    const supplyResult = message.match(/^20 (.+) allocated; (.+) addressed and local impact reduced by 4 points\.$/);
    if (supplyResult) {
      const template = language === "kn" ? "20 {resource} ಹಂಚಲಾಗಿದೆ; {requests} ಪರಿಹರಿಸಲಾಗಿದೆ ಮತ್ತು ಸ್ಥಳೀಯ ಪರಿಣಾಮ 4 ಅಂಕ ಕಡಿಮೆಯಾಗಿದೆ." : "20 {resource} आवंटित; {requests} का समाधान हुआ और स्थानीय प्रभाव 4 अंक घटा।";
      return template
        .replace("{resource}", localizeTerm(supplyResult[1]))
        .replace("{requests}", localizeTerm(supplyResult[2]));
    }
    const infrastructureResult = message.match(/^(.+) addressed; local impact reduced by 6 points\.$/);
    if (infrastructureResult) {
      return language === "kn"
        ? `${localizeTerm(infrastructureResult[1])} ಪರಿಹರಿಸಲಾಗಿದೆ; ಸ್ಥಳೀಯ ಪರಿಣಾಮ 6 ಅಂಕ ಕಡಿಮೆಯಾಗಿದೆ.`
        : `${localizeTerm(infrastructureResult[1])} का समाधान हुआ; स्थानीय प्रभाव 6 अंक घटा।`;
    }
    if (message.startsWith("Dispatch ") || message.startsWith("Allocate ")) {
      const separator = message.indexOf(" · ");
      if (separator >= 0) {
        const action = localize(message.slice(0, separator));
        const details: string = localizeNarrative(message.slice(separator + 3));
        return `${action} · ${details}`;
      }
    }
    if (message.startsWith("A ") && message.includes(" is already open in ")) {
      const [centre, zone] = message.slice(2).replace(/\.$/, "").split(" is already open in ");
      return language === "kn"
        ? `${localizeTerm(centre)} ಈಗಾಗಲೇ ${localizeTerm(zone)}ನಲ್ಲಿ ತೆರೆದಿದೆ.`
        : `${localizeTerm(centre)} पहले से ${localizeTerm(zone)} में खुला है।`;
    }
    if (message.startsWith("No dispatchable request is listed for ")) {
      const zone = message.match(/^No dispatchable request is listed for (.+)\. Select an area with a response need\.$/)?.[1];
      if (zone) return language === "kn"
        ? `${localizeTerm(zone)}ಗೆ ಪ್ರತಿಕ್ರಿಯೆ ವಿನಂತಿ ಇಲ್ಲ. ಪ್ರತಿಕ್ರಿಯೆ ಅಗತ್ಯವಿರುವ ಪ್ರದೇಶ ಆಯ್ಕೆಮಾಡಿ.`
        : `${localizeTerm(zone)} में प्रतिक्रिया अनुरोध सूचीबद्ध नहीं है। जरूरत वाला क्षेत्र चुनें।`;
    }
    if (message.startsWith("Team handoff: ")) {
      const [from, to] = message.slice("Team handoff: ".length).replace(/\.$/, "").split(" → ");
      return language === "kn"
        ? `ತಂಡದ ಕಾರ್ಯ ಹಸ್ತಾಂತರ: ${localize(from)} → ${localize(to)}.`
        : `टीम को कार्य हस्तांतरण: ${localize(from)} → ${localize(to)}।`;
    }

    let result = translations[language][message] ?? message;
    if (result === message) {
      for (const [source, translated] of Object.entries(translations[language])) {
        if (source.length > 12 && result.includes(source)) result = result.replaceAll(source, translated);
      }
    }
    return result;
  };
  const [zones, setZones] = useState<Zone[]>(() => makeZones(crises[0]));
  const [requests, setRequests] = useState<RequestItem[]>(() => makeRequests(crises[0]));
  const [events, setEvents] = useState<EventItem[]>([
    { id: 1, time: "00:00", text: crises[0].firstEvent },
  ]);
  const [selectedZoneId, setSelectedZoneId] = useState("ward-3");
  const [seconds, setSeconds] = useState(180);
  const [running, setRunning] = useState(false);
  const [responseUnits, setResponseUnits] = useState(crises[0].resourceAllocation.responseUnits);
  const [safeCentres, setSafeCentres] = useState(crises[0].resourceAllocation.safeCentres);
  const [supplies, setSupplies] = useState(crises[0].resourceAllocation.supplies);
  const [score, setScore] = useState(50);
  const [actionsTaken, setActionsTaken] = useState(0);
  const [resolvedRequests, setResolvedRequests] = useState(0);
  const [alertedZones, setAlertedZones] = useState<string[]>([]);
  const [openedSafeZones, setOpenedSafeZones] = useState<string[]>([]);
  const [reviewedInfrastructureZones, setReviewedInfrastructureZones] = useState<string[]>([]);
  const [outcomes, setOutcomes] = useState<OutcomeItem[]>([]);

  const crisis = crises.find((item) => item.id === crisisId) ?? crises[0];
  const activeRole =
    simulationRoles.find((role) => role.id === roleId) ?? simulationRoles[0];
  const selectedZone = zones.find((zone) => zone.id === selectedZoneId) ?? zones[0];
  const pendingRequests = requests.filter((request) => request.status === "pending");
  const roleRequests = pendingRequests.filter((request) =>
    roleNeedTypes[roleId].includes(request.need)
  );
  const topRoleRequest = [...roleRequests].sort(
    (left, right) => right.urgency - left.urgency
  )[0];
  const finished = seconds === 0;
  const completionPercent =
    requests.length === 0
      ? 0
      : Math.round((resolvedRequests / requests.length) * 100);

  const responseTimeSeconds = 180 - seconds;

  const fairnessScore = Math.min(
    100,
    Math.round(
      zones.reduce((sum, zone) => sum + zone.vulnerable, 0) > 0
        ? (resolvedRequests / Math.max(actionsTaken, 1)) * 70 +
            (alertedZones.length / Math.max(zones.length, 1)) * 30
        : 0
    )
  );

  const efficiencyScore = Math.max(
    0,
    Math.min(
      100,
      actionsTaken === 0
        ? 100
        : Math.round((resolvedRequests / actionsTaken) * 100)
    )
  );

  const reportScore = Math.round(
    score * 0.55 +
      completionPercent * 0.25 +
      fairnessScore * 0.1 +
      efficiencyScore * 0.1
  );

  const sharedRunsUnavailable = translatedCopy[language].sharedRunsUnavailable ??
    englishCopy.sharedRunsUnavailable;

  useEffect(() => {
    let cancelled = false;

    async function loadTeamSession() {
      try {
        const response = await fetch("/api/team-session", { cache: "no-store" });
        if (!response.ok) throw new Error(`Team session request failed (${response.status}).`);
        const payload: unknown = await response.json();
        if (
          typeof payload !== "object" ||
          payload === null ||
          !("configured" in payload) ||
          typeof payload.configured !== "boolean" ||
          !("authenticated" in payload) ||
          typeof payload.authenticated !== "boolean"
        ) {
          throw new Error("Team session response has an invalid shape.");
        }
        if (!cancelled) {
          setTeamAccess(
            !payload.configured
              ? "unconfigured"
              : payload.authenticated
                ? "signed-in"
                : "signed-out"
          );
        }
      } catch (error) {
        console.error("Could not check PulseCity team access.", error);
        if (!cancelled) {
          setTeamAccess("signed-out");
          setTeamAccessError(sharedRunsUnavailable);
        }
      }
    }

    void loadTeamSession();
    return () => {
      cancelled = true;
    };
  }, [language, sharedRunsUnavailable]);

  async function signInToTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTeamAccessError("");

    try {
      const response = await fetch("/api/team-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: teamPassword }),
      });

      if (response.status === 503) {
        setTeamAccess("unconfigured");
        setTeamAccessError(t("teamPasswordUnconfigured"));
        return;
      }
      if (!response.ok) {
        setTeamAccessError(
          response.status === 429 ? t("sharedRunsUnavailable") : t("teamSignInFailed")
        );
        return;
      }

      setTeamPassword("");
      setTeamAccess("signed-in");
      setRunsError(false);
      setRunsLoadAttempt((attempt) => attempt + 1);
    } catch (error) {
      console.error("Could not sign in to PulseCity team access.", error);
      setTeamAccessError(t("sharedRunsUnavailable"));
    }
  }

  async function signOutOfTeam() {
    setTeamAccessError("");
    try {
      const response = await fetch("/api/team-session", { method: "DELETE" });
      if (!response.ok) throw new Error(`Team sign-out failed (${response.status}).`);
      setTeamAccess("signed-out");
    } catch (error) {
      console.error("Could not sign out of PulseCity team access.", error);
      setTeamAccessError(t("sharedRunsUnavailable"));
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadSharedRuns() {
      try {
        let response = await fetch("/api/runs", { cache: "no-store" });
        if (!response.ok) throw new Error(`Run history request failed (${response.status}).`);
        let payload: unknown = await response.json();
        if (
          typeof payload !== "object" ||
          payload === null ||
          !("runs" in payload) ||
          !Array.isArray(payload.runs) ||
          !payload.runs.every(isSavedRun)
        ) {
          throw new Error("Run history response has an invalid shape.");
        }

        const migrationComplete =
          window.localStorage.getItem(runStoreKeys.legacyMigrated) === "true";
        const storedRuns = window.localStorage.getItem(runStoreKeys.legacyRuns);
        if (!migrationComplete && storedRuns) {
          const parsed: unknown = JSON.parse(storedRuns);
          const legacyRuns = Array.isArray(parsed)
            ? parsed.filter(isSavedRun).slice(0, 10)
            : [];
          const instanceId = getClientInstanceId();
          clientInstanceId.current = instanceId;

          for (const run of legacyRuns) {
            const { id, ...runInput } = run;
            response = await fetch("/api/runs", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...runInput,
                clientKey: `${instanceId}:legacy:${id}`,
              }),
            });
            if (!response.ok) {
              throw new Error(`Could not migrate a saved run (${response.status}).`);
            }
          }
          window.localStorage.setItem(runStoreKeys.legacyMigrated, "true");
          window.localStorage.removeItem(runStoreKeys.legacyRuns);

          response = await fetch("/api/runs", { cache: "no-store" });
          if (!response.ok) throw new Error(`Run history request failed (${response.status}).`);
          payload = await response.json();
          if (
            typeof payload !== "object" ||
            payload === null ||
            !("runs" in payload) ||
            !Array.isArray(payload.runs) ||
            !payload.runs.every(isSavedRun)
          ) {
            throw new Error("Run history response has an invalid shape.");
          }
        } else {
          clientInstanceId.current = getClientInstanceId();
        }

        if (cancelled) return;
        const runs = payload.runs as SavedRun[];
        setSavedRuns(runs);
        savedRunIds.current = new Set(runs.map((run) => run.id));
        setRunsError(false);
      } catch (error) {
        console.error("Could not load shared PulseCity runs.", error);
        if (!cancelled) setRunsError(true);
      } finally {
        if (!cancelled) setRunsLoaded(true);
      }
    }

    void loadSharedRuns();
    const refreshInterval = window.setInterval(() => {
      void loadSharedRuns();
    }, 15_000);
    return () => {
      cancelled = true;
      window.clearInterval(refreshInterval);
    };
  }, [runsLoadAttempt]);

  useEffect(() => {
    if (
      !finished ||
      running ||
      teamAccess !== "signed-in" ||
      activeRunId.current === null
    ) {
      return;
    }
    const runId = activeRunId.current;
    if (savedRunIds.current.has(runId)) return;
    const run = {
      crisisName: crisis.name,
      completedAt: new Date().toISOString(),
      score: reportScore,
      requestsResolved: resolvedRequests,
      requestTotal: requests.length,
      actionsTaken,
      responseUnitsUsed:
        crisis.resourceAllocation.responseUnits -
        responseUnits,
      supplyUnitsUsed: crisis.resourceAllocation.supplies - supplies,
      sheltersOpened: openedSafeZones.length,
      outcomes: outcomes.length,
    };

    async function persistRun() {
      try {
        const instanceId = clientInstanceId.current ?? getClientInstanceId();
        clientInstanceId.current = instanceId;
        const response = await fetch("/api/runs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...run, clientKey: `${instanceId}:${runId}` }),
        });
        if (response.status === 401) {
          setTeamAccess("signed-out");
        }
        if (!response.ok) {
          throw new Error(`Could not save completed run (${response.status}).`);
        }
        const payload: unknown = await response.json();
        if (
          typeof payload !== "object" ||
          payload === null ||
          !("run" in payload) ||
          !isSavedRun(payload.run)
        ) {
          throw new Error("Saved run response has an invalid shape.");
        }
        const savedRun: SavedRun = payload.run;
        savedRunIds.current.add(runId);
        setSavedRuns((current) =>
          [savedRun, ...current.filter((existingRun) => existingRun.id !== savedRun.id)]
            .sort((left, right) =>
              right.completedAt.localeCompare(left.completedAt) || right.id - left.id
            )
            .slice(0, 10)
        );
        setRunsError(false);
      } catch (error) {
        console.error("Could not save completed PulseCity run.", error);
        setRunsError(true);
      }
    }

    void persistRun();
  }, [
    finished,
    running,
    crisis,
    reportScore,
    resolvedRequests,
    requests.length,
    actionsTaken,
    responseUnits,
    supplies,
    openedSafeZones.length,
    outcomes.length,
    runsLoadAttempt,
    teamAccess,
  ]);

  useEffect(() => {
    if (presentationStep === null) {
      if (presentationWasOpen.current) {
        window.requestAnimationFrame(() => presentationTriggerRef.current?.focus());
      }
      presentationWasOpen.current = false;
      return;
    }
    let focusFrame = 0;
    if (!presentationWasOpen.current) {
      focusFrame = window.requestAnimationFrame(() => presentationDialogRef.current?.focus());
      presentationWasOpen.current = true;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPresentationStep(null);
      if (event.key === "ArrowRight") {
        setPresentationStep((step) => Math.min(presentationSlides.length - 1, (step ?? 0) + 1));
      }
      if (event.key === "ArrowLeft") {
        setPresentationStep((step) => Math.max(0, (step ?? 0) - 1));
      }
      if (event.key === "Tab") {
        const focusable = presentationDialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], select, input, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [presentationStep]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const addEvent = useCallback(
    (text: string, atTime = seconds) => {
      setEvents((current) => [
        {
          id: current.reduce((highestId, event) => Math.max(highestId, event.id), 0) + 1,
          time: formatTime(atTime),
          text,
        },
        ...current,
      ]);
    },
    [seconds]
  );

  function resetForCrisis(nextCrisisId: CrisisId) {
    const nextCrisis = crises.find((item) => item.id === nextCrisisId) ?? crises[0];

    setCrisisId(nextCrisisId);
    setZones(makeZones(nextCrisis));
    setRequests(makeRequests(nextCrisis));
    setEvents([{ id: 1, time: "00:00", text: nextCrisis.firstEvent }]);
    setSelectedZoneId("ward-3");
    setSeconds(180);
    setRunning(false);
    setResponseUnits(nextCrisis.resourceAllocation.responseUnits);
    setSafeCentres(nextCrisis.resourceAllocation.safeCentres);
    setSupplies(nextCrisis.resourceAllocation.supplies);
    setScore(50);
    setActionsTaken(0);
    setResolvedRequests(0);
    setAlertedZones([]);
    setOpenedSafeZones([]);
    setReviewedInfrastructureZones([]);
    setOutcomes([]);
  }

  useEffect(() => {
    if (!running || seconds <= 0) return;

    const timer = window.setInterval(() => {
      const nextSeconds = Math.max(0, seconds - 1);
      setSeconds(nextSeconds);
      setZones((current) =>
        current.map((zone) => ({
          ...zone,
          impact: Math.min(100, zone.impact + (zone.risk >= 60 ? 0.28 : 0.16)),
        }))
      );

      if (nextSeconds === 150) addEvent(crisis.escalationEvent, nextSeconds);
      if (nextSeconds === 110) {
        addEvent("New simulated requests have arrived. Review urgency and location.", nextSeconds);
      }
      if (nextSeconds === 70) addEvent(crisis.laterEvent, nextSeconds);
      if (nextSeconds === 120) {
        const targetZone = [...zones].sort((left, right) => right.risk - left.risk)[0];
        const secondaryRequest: RequestItem = {
          id: `dynamic-${crisis.id}`,
          zoneId: targetZone.id,
          title: "Secondary response request",
          detail: "A new simulated call has arrived. Reassess area priority and response capacity.",
          urgency: 84,
          need: "response",
          status: "pending",
        };
        setRequests((current) =>
          current.some((request) => request.id === secondaryRequest.id)
            ? current
            : [...current, secondaryRequest]
        );
        setZones((current) =>
          current.map((zone) =>
            zone.id === targetZone.id
              ? { ...zone, risk: Math.min(100, zone.risk + 8), impact: Math.min(100, zone.impact + 8) }
              : zone
          )
        );
        addEvent(
          `New development: a secondary response request is reported in ${targetZone.name}.`,
          nextSeconds
        );
      }
      if (nextSeconds === 60) {
        const secondaryRequest = requests.find((request) => request.id === `dynamic-${crisis.id}`);
        const targetZone = secondaryRequest
          ? zones.find((zone) => zone.id === secondaryRequest.zoneId)
          : undefined;
        if (secondaryRequest?.status === "resolved" && targetZone) {
          setZones((current) =>
            current.map((zone) =>
              zone.id === targetZone.id
                ? { ...zone, impact: Math.max(0, zone.impact - 5) }
                : zone
            )
          );
          addEvent(
            `Positive development: coordinated action stabilized conditions in ${targetZone.name}.`,
            nextSeconds
          );
        } else if (targetZone) {
          setZones((current) =>
            current.map((zone) =>
              zone.id === targetZone.id
                ? { ...zone, impact: Math.min(100, zone.impact + 10) }
                : zone
            )
          );
          addEvent(
            `Conditions worsened in ${targetZone.name}; the secondary request remains open.`,
            nextSeconds
          );
        }
      }

      if (nextSeconds === 0) {
        setRunning(false);
        addEvent("Scenario complete. Review your response report.", 0);
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [
    running,
    seconds,
    crisis.id,
    crisis.escalationEvent,
    crisis.laterEvent,
    zones,
    requests,
    addEvent,
  ]);

  function startSimulation() {
    if (running) return;

    const nextOptions = crises.filter((item) => item.id !== crisisId);
    const nextCrisis = nextOptions[Math.floor(Math.random() * nextOptions.length)];

    activeRunId.current = Date.now();
    resetForCrisis(nextCrisis.id);
    setRunning(true);
    setEvents([
      {
        id: Date.now(),
        time: "00:00",
        text: `${nextCrisis.firstEvent} Random scenario selected: ${nextCrisis.name}.`,
      },
    ]);
  }

  function recordActionOutcome({
    action,
    zone,
    result,
    resolved,
    impactReduction = 0,
    basePoints = 0,
  }: {
    action: string;
    zone: Zone;
    result: string;
    resolved: RequestItem[];
    impactReduction?: number;
    basePoints?: number;
  }) {
    const resolvedIds = new Set(resolved.map((request) => request.id));

    setRequests((current) =>
      current.map((request) =>
        resolvedIds.has(request.id) ? { ...request, status: "resolved" } : request
      )
    );
    setResolvedRequests((current) => current + resolved.length);
    setActionsTaken((current) => current + 1);
    setScore((current) =>
      Math.min(
        100,
        current +
          basePoints +
          resolved.reduce((points, request) => points + Math.round(request.urgency / 20), 0)
      )
    );

    if (impactReduction > 0) {
      setZones((current) =>
        current.map((item) =>
          item.id === zone.id
            ? { ...item, impact: Math.max(0, item.impact - impactReduction) }
            : item
        )
      );
    }

    setOutcomes((current) => [
      {
        id: current.reduce((highestId, outcome) => Math.max(highestId, outcome.id), 0) + 1,
        action,
        zoneName: zone.name,
        result,
        resolvedTitles: resolved.map((request) => request.title),
      },
      ...current,
    ]);
    addEvent(`${action} · ${zone.name}: ${result}`);
  }

  function requestsForZone(zoneId: string, need: NeedType) {
    return requests
      .filter(
        (request) =>
          request.zoneId === zoneId &&
          request.status === "pending" &&
          request.need === need
      )
      .sort((a, b) => b.urgency - a.urgency);
  }

  function dispatchResponse() {
    if (responseUnits <= 0) {
      addEvent(`No ${crisis.resourceName.toLowerCase()} are available.`);
      return;
    }

    const targets = requestsForZone(selectedZoneId, "response");
    const target = targets[0];
    if (!target) {
      addEvent(`No dispatchable request is listed for ${selectedZone.name}. Select an area with a response need.`);
      return;
    }

    setResponseUnits((value) => value - 1);
    recordActionOutcome({
      action: `Dispatch ${crisis.resourceName.toLowerCase()}`,
      zone: selectedZone,
      result: `One response unit used; ${target.title.toLowerCase()} handled and local impact reduced by 3 points.`,
      resolved: [target],
      impactReduction: 3,
    });
  }

  function openSafeCentre() {
    if (openedSafeZones.includes(selectedZoneId)) {
      addEvent(`A ${crisis.safePlaceName.toLowerCase()} is already open in ${selectedZone.name}.`);
      return;
    }

    const targets = requestsForZone(selectedZoneId, "shelter");
    if (targets.length === 0) {
      addEvent(`No shelter or cooling-centre request is listed for ${selectedZone.name}.`);
      return;
    }

    setOpenedSafeZones((current) => [...current, selectedZoneId]);
    setSafeCentres((value) => value + 1);
    recordActionOutcome({
      action: crisis.safePlaceName,
      zone: selectedZone,
      result: `Centre opened; local impact reduced by 4 points.`,
      resolved: targets,
      impactReduction: 4,
      basePoints: 2,
    });
  }

  function sendAlert() {
    if (alertedZones.includes(selectedZoneId)) {
      addEvent(`A public safety message was already sent to ${selectedZone.name}.`);
      return;
    }

    const targets = requestsForZone(selectedZoneId, "alert");

    setAlertedZones((current) => [...current, selectedZoneId]);
    recordActionOutcome({
      action: "Send public alert",
      zone: selectedZone,
      result: targets.length > 0
        ? `Alert delivered; local impact reduced by 2 points.`
        : "Alert coverage expanded; no listed communication request needed resolution.",
      resolved: targets,
      impactReduction: 2,
      basePoints: 2,
    });
  }

  function allocateSupplies() {
    if (supplies < 20) {
      addEvent(`Not enough ${crisis.supplyName.toLowerCase()} remain.`);
      return;
    }

    const targets = requestsForZone(selectedZoneId, "supplies");
    if (targets.length === 0) {
      addEvent(`No supply-related request is listed for ${selectedZone.name}; supplies were not spent.`);
      return;
    }

    setSupplies((value) => value - 20);
    recordActionOutcome({
      action: `Allocate ${crisis.supplyName.toLowerCase()}`,
      zone: selectedZone,
      result: `20 ${crisis.supplyName.toLowerCase()} allocated; ${targets.map((request) => request.title).join(", ").toLowerCase()} addressed and local impact reduced by 4 points.`,
      resolved: targets,
      impactReduction: 4,
    });
  }

  function changeInfrastructure() {
    if (reviewedInfrastructureZones.includes(selectedZoneId)) {
      addEvent(`Infrastructure in ${selectedZone.name} has already been reviewed.`);
      return;
    }

    const targets = requestsForZone(selectedZoneId, "infrastructure");
    setReviewedInfrastructureZones((current) => [...current, selectedZoneId]);
    recordActionOutcome({
      action: crisis.infrastructureAction,
      zone: selectedZone,
      result: targets.length > 0
        ? `${targets.map((request) => request.title).join(", ")} addressed; local impact reduced by 6 points.`
        : `Area conditions reviewed; local impact reduced by 6 points.`,
      resolved: targets,
      impactReduction: 6,
      basePoints: 3,
    });
  }

  function getRecommendation() {
    const highestRisk = [...zones].sort((a, b) => b.risk - a.risk)[0];
    const mostUrgent = [...pendingRequests].sort((a, b) => b.urgency - a.urgency)[0];

    if (mostUrgent) {
      const requestZone = zones.find((zone) => zone.id === mostUrgent.zoneId);
      addEvent(
        `Rule-based brief: Review "${mostUrgent.title}" in ${requestZone?.name ?? "the city"} first (urgency ${mostUrgent.urgency}/100). Also monitor ${highestRisk.name}, currently the highest-risk area (${highestRisk.risk}/100).`
      );
      return;
    }

    addEvent(
      `Rule-based brief: No requests are pending. Monitor ${highestRisk.name}, currently the highest-risk area (${highestRisk.risk}/100).`
    );
  }

  function resetSimulation() {
    resetForCrisis(crisisId);
  }

  return (
    <main className="pulse-app min-h-screen">
      <a className="pulse-skip-link" href="#main-content">Skip to simulation</a>
      <header className="pulse-header">
        <div className="pulse-header-inner mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div className="pulse-brand-lockup">
            <span className="pulse-brand-mark" aria-hidden="true">P</span>
            <div>
              <p className="pulse-eyebrow">
                {t("cityOperations")} <span>/</span> {t("trainingSimulation")}
              </p>
              <h1 className="pulse-brand">PulseCity</h1>
            </div>
          </div>
          <div className="pulse-header-meta flex items-center gap-3">
            <div className="pulse-clock">
              <span>{t("elapsedLabel")}</span>
              <strong>{formatTime(180 - seconds)}</strong>
            </div>
            <span className={`pulse-status ${running ? "is-live" : finished ? "is-complete" : ""}`} aria-live="polite">
              <i aria-hidden="true" />
              {running ? t("liveSimulation") : finished ? t("completeStatus") : t("standingBy")}
            </span>
            <label className="pulse-language">
              <span>{t("language")}</span>
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value as Language)}
                aria-label={t("language")}
              >
                <option value="en">English</option>
                <option value="kn">ಕನ್ನಡ</option>
                <option value="hi">हिन्दी</option>
              </select>
            </label>
            <button
              type="button"
              className="pulse-header-button"
              ref={presentationTriggerRef}
              onClick={() => setPresentationStep(0)}
            >
              {t("present")}
            </button>
          </div>
        </div>
      </header>

      <div id="main-content" className="pulse-layout mx-auto grid max-w-7xl gap-5 px-5 py-6 xl:grid-cols-[1fr_340px]">
        <section className="pulse-role-panel col-span-full" aria-labelledby="role-heading">
          <div className="pulse-role-intro">
            <div>
              <p className="pulse-section-kicker">{t("teamPerspective")}</p>
              <h2 id="role-heading">{t("chooseRole")}</h2>
              <p>{t(roleFocusKeys[roleId])}</p>
            </div>
            <span>{t("handoff")}</span>
          </div>
          <div className="pulse-role-options" role="group" aria-label={t("chooseRole")}>
            {simulationRoles.map((role) => (
              <button
                key={role.id}
                type="button"
                className={`pulse-role-option ${role.id === roleId ? "is-active" : ""}`}
                onClick={() => {
                  if (running && role.id !== roleId) {
                    addEvent(
                      `Team handoff: ${t(roleTranslationKeys[roleId])} → ${t(roleTranslationKeys[role.id])}.`
                    );
                  }
                  setRoleId(role.id);
                }}
                aria-pressed={role.id === roleId}
              >
                {t(roleTranslationKeys[role.id])}
              </button>
            ))}
          </div>
          <div className="pulse-role-dashboard" aria-live="polite">
            <div className="pulse-role-stat">
              <span>{t("roleTasks")}</span>
              <strong>{roleRequests.length} {roleRequests.length === 1 ? t("task") : t("tasks")}</strong>
            </div>
            <div className="pulse-role-stat">
              <span>{t("highestPriority")}</span>
              <strong>{topRoleRequest ? `${topRoleRequest.urgency}/100 · ${localize(topRoleRequest.title)}` : "—"}</strong>
            </div>
            <div className="pulse-role-stat">
              <span>{t("overview")}</span>
              <strong>
                {roleNeedTypes[roleId].length} {t("actionTypes")} · {zones.length} {t("simulatedAreas")}
              </strong>
            </div>
          </div>
          <ul className="pulse-role-queue" aria-label={t("roleTasks")}>
            {roleRequests.slice(0, 2).map((request) => (
              <li key={request.id}>
                <button type="button" onClick={() => setSelectedZoneId(request.zoneId)}>
                  <span>{localize(request.title)} · {localize(zones.find((zone) => zone.id === request.zoneId)?.name ?? "")}</span>
                  <strong>{request.urgency}/100</strong>
                </button>
              </li>
            ))}
            {roleRequests.length === 0 && <li>{t("noRoleTasks")}</li>}
          </ul>
        </section>

        <section className="pulse-primary space-y-5">
          <section className="pulse-map-panel overflow-hidden rounded-2xl">
            <div className="pulse-map-heading px-5 py-4">
              <div>
                <p className="pulse-section-kicker">{t("mapOverview")}</p>
                <h2>{t("cityMap")}</h2>
              </div>
            </div>

            <CityMapLoader
              language={language}
            />

            <div className="pulse-map-attribution px-4 py-2">
              {t("mapAttribution")}
            </div>
          </section>

          <div>
            <div className="pulse-allocation-heading">
              <div>
                <p className="pulse-section-kicker">{t("loadout")}</p>
                <h2>{t("resourceAllocation")}</h2>
              </div>
              <p>{t("illustrativeValues")}</p>
            </div>
            <div className="pulse-metrics grid gap-3 sm:grid-cols-4">
              <Metric label={t("responseScore")} value={`${score}/100`} accent="text-cyan-300" />
              <Metric label={localize(crisis.resourceName)} value={`${responseUnits} ${t("available")}`} accent="text-emerald-300" />
              <Metric label={t("safeCentres")} value={`${safeCentres} ${t("open")}`} accent="text-violet-300" />
              <Metric label={localize(crisis.supplyName)} value={`${supplies}`} accent="text-amber-300" />
            </div>
          </div>

          <section className="grid gap-5 lg:grid-cols-2">
            <div className="pulse-card rounded-2xl p-5">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <p className="pulse-section-kicker">{t("areaProfile")}</p>
                  <h2 className="pulse-card-title">{localize(selectedZone.name)}</h2>
                  <p className="pulse-muted">
                    {t(riskLabel(selectedZone.risk))} {t("exposure")}
                  </p>
                </div>
                <span className="pulse-impact">
                  <strong>{Math.round(selectedZone.impact)}</strong>
                  <small>{t("impactPercent")}</small>
                </span>
              </div>

              <div className="pulse-progress mb-4 h-2 overflow-hidden rounded-full">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${selectedZone.impact}%`, backgroundColor: crisis.color }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <Info label={t("population")} value={selectedZone.population.toLocaleString(language === "hi" ? "hi-IN" : language === "kn" ? "kn-IN" : "en-IN")} />
                <Info label={t("vulnerableResidents")} value={selectedZone.vulnerable.toLocaleString(language === "hi" ? "hi-IN" : language === "kn" ? "kn-IN" : "en-IN")} />
                <Info label={t("riskScore")} value={`${selectedZone.risk}/100`} />
                <Info label={t("pendingRequestCount")} value={requests.filter((request) => request.zoneId === selectedZone.id && request.status === "pending").length.toString()} />
              </div>

              <p className="pulse-actions-label">{t("responseActions")}</p>
              <div className="pulse-actions mt-3 grid grid-cols-2 gap-2">
                {activeRole.actions.includes("dispatch") && (
                  <ActionButton onClick={dispatchResponse} disabled={!running || responseUnits === 0}>
                    {t("dispatchAction")}
                  </ActionButton>
                )}
                {activeRole.actions.includes("shelter") && (
                  <ActionButton
                    onClick={openSafeCentre}
                    disabled={!running || openedSafeZones.includes(selectedZoneId)}
                  >
                    {openedSafeZones.includes(selectedZoneId) ? t("alreadyOpen") : localize(crisis.safePlaceName)}
                  </ActionButton>
                )}
                {activeRole.actions.includes("alert") && (
                  <ActionButton onClick={sendAlert} disabled={!running}>
                    {t("publicAlertAction")}
                  </ActionButton>
                )}
                {activeRole.actions.includes("supplies") && (
                  <ActionButton onClick={allocateSupplies} disabled={!running || supplies < 20}>
                    {t("suppliesAction")}: {localize(crisis.supplyName)}
                  </ActionButton>
                )}
                {activeRole.actions.includes("infrastructure") && (
                  <ActionButton
                    onClick={changeInfrastructure}
                    disabled={!running || reviewedInfrastructureZones.includes(selectedZoneId)}
                    className="col-span-2"
                  >
                    {reviewedInfrastructureZones.includes(selectedZoneId)
                      ? t("infrastructureReviewed")
                      : localize(crisis.infrastructureAction)}
                  </ActionButton>
                )}
                <p className="pulse-role-hint col-span-2">
                  {t("availableTo")} {t(roleTranslationKeys[roleId])}. {t("switchRoles")}
                </p>
              </div>
            </div>

            <div className="pulse-card rounded-2xl p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="pulse-section-kicker">{t("incoming")}</p>
                  <h2 className="pulse-card-title">{t("requests")}</h2>
                  <p className="pulse-muted">{pendingRequests.length} {t("awaitingAction")}</p>
                </div>
                <span className="pulse-count">
                  {pendingRequests.length.toString().padStart(2, "0")}
                </span>
              </div>

              <div className="pulse-request-list space-y-3">
                {requests.map((request) => (
                  <div key={request.id} className={`pulse-request ${request.status === "resolved" ? "is-resolved" : ""}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="pulse-request-title">{localize(request.title)}</p>
                        <p className="pulse-request-detail">{localize(request.detail)}</p>
                        <p className="pulse-request-meta">
                          {localize(zones.find((zone) => zone.id === request.zoneId)?.name ?? "")} <span>·</span> {t("priority")} {request.urgency} <span>·</span> {localize(request.need)}
                        </p>
                      </div>
                      <span className={`pulse-request-status ${request.status}`}>
                        {request.status === "pending" ? t("pending") : t("resolved")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {finished && (
            <section className="pulse-report rounded-2xl p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
                    {t("simulationComplete")}
                  </p>
                  <h2 className="mt-1 text-xl font-black">
                    {localize(crisis.name)} {t("reportTitle")}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                    {t("simulationReportDisclaimer")}
                  </p>
                </div>

                <div className="rounded-2xl border border-cyan-300/20 bg-slate-950/60 px-5 py-3 text-center">
                  <p className="text-xs text-slate-400">{t("overallScore")}</p>
                  <p className="text-3xl font-black text-cyan-300">{reportScore}</p>
                  <p className="text-xs text-slate-500">{t("outOf100")}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <ReportMetric
                  label={t("requestsResolved")}
                  value={`${resolvedRequests}/${requests.length} ${t("resolved")}`}
                  detail={`${completionPercent}% ${t("percentOfRequests")}`}
                />
                <ReportMetric
                  label={t("requestsRemaining")}
                  value={pendingRequests.length.toString()}
                  detail={t("stillAwaiting")}
                />
                <ReportMetric
                  label={t("decisionsMade")}
                  value={actionsTaken.toString()}
                  detail={`${Math.floor(responseTimeSeconds / 60)}m ${responseTimeSeconds % 60}s ${t("elapsed")}`}
                />
                <ReportMetric
                  label={t("resourcesRemaining")}
                  value={`${responseUnits} ${responseUnits === 1 ? t("unit") : t("units")}`}
                  detail={`${supplies} ${localize(crisis.supplyName)}`}
                />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <ScoreBar label={t("responseScore")} value={score} color="pulse-score-response" />
                <ScoreBar label={t("requestCompletionLabel")} value={completionPercent} color="pulse-score-completion" />
                <ScoreBar label={t("equityIndicator")} value={fairnessScore} color="pulse-score-equity" />
                <ScoreBar label={t("decisionEfficiency")} value={efficiencyScore} color="pulse-score-efficiency" />
              </div>

              <div className="pulse-outcomes mt-5">
                <div className="mb-3 flex items-end justify-between gap-3">
                  <div>
                    <p className="pulse-section-kicker">{t("decisionRecord")}</p>
                    <h3 className="pulse-card-title">{t("actionsOutcomes")}</h3>
                  </div>
                  <span className="pulse-event-count">{outcomes.length} {t("recorded")}</span>
                </div>
                {outcomes.length === 0 ? (
                  <p className="pulse-outcome-empty">{t("noRecordedActions")}</p>
                ) : (
                  <ol className="pulse-outcome-list">
                    {outcomes.map((outcome) => (
                      <li key={outcome.id} className="pulse-outcome">
                        <div className="pulse-outcome-heading">
                          <strong>{localize(outcome.action)}</strong>
                          <span>{localize(outcome.zoneName)}</span>
                        </div>
                        <p>{localizeNarrative(outcome.result)}</p>
                        {outcome.resolvedTitles.length > 0 && (
                          <p className="pulse-outcome-resolved">
                            {t("resolvedPrefix")} {outcome.resolvedTitles.map(localize).join(", ")}
                          </p>
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              <div className="mt-5 rounded-xl border border-slate-700 bg-slate-950/60 p-4">
                <h3 className="text-sm font-bold">{t("review")}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-300">
                  {pendingRequests.length === 0
                    ? t("allResolvedReview")
                    : `${t("unresolvedReviewPrefix")} ${pendingRequests.length} ${t("unresolvedReviewSuffix")}`}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  {t("scoringExplanation")}
                </p>
              </div>

              <button
                onClick={resetSimulation}
                className="mt-4 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
              >
                {t("replayScenario")}
              </button>
            </section>
          )}
        </section>

        <aside className="pulse-sidebar space-y-5">
          <section className="pulse-card pulse-advisor rounded-2xl p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="pulse-advisor-mark" aria-hidden="true">i</span>
              <div>
                <p className="pulse-section-kicker">{t("decisionSupport")}</p>
                <h2 className="pulse-card-title">{t("responseBrief")}</h2>
              </div>
            </div>
            <p className="pulse-advisor-copy">
              {t("responseBriefDescription")}
            </p>
            <button
              onClick={getRecommendation}
              className="pulse-primary-button mt-4 w-full"
            >
              {t("generateBrief")}
            </button>
            <p className="pulse-disclaimer mt-3">
              {t("trainingAidDisclaimer")}
            </p>
          </section>

          <section className="pulse-card pulse-controls rounded-2xl p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="pulse-section-kicker">{t("exercise")}</p>
                <h2 className="pulse-card-title">{t("scenarioControls")}</h2>
              </div>
              <span className="pulse-duration">03:00</span>
            </div>
            <button
              onClick={startSimulation}
              disabled={running}
              className="pulse-primary-button w-full"
            >
              {running ? t("running") : t("startExercise")}
            </button>
            <button
              onClick={resetSimulation}
              className="pulse-secondary-button mt-2 w-full"
            >
              {t("resetExercise")}
            </button>
          </section>

          <section className="pulse-card pulse-comparison rounded-2xl p-5" aria-labelledby="comparison-heading">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div>
                <p className="pulse-section-kicker">{t("replayCompare")}</p>
                <h2 id="comparison-heading" className="pulse-card-title">{t("savedRuns")}</h2>
              </div>
              <span className="pulse-event-count">{savedRuns.length}/10</span>
            </div>
            <div className="pulse-team-access">
              <div className="pulse-team-access-heading">
                <span className="pulse-section-kicker">{t("teamAccess")}</span>
                {teamAccess === "signed-in" && (
                  <button
                    type="button"
                    className="pulse-team-signout"
                    onClick={() => void signOutOfTeam()}
                  >
                    {t("teamSignOut")}
                  </button>
                )}
              </div>
              {teamAccess === "checking" && (
                <p className="pulse-team-access-note">{t("teamSessionChecking")}</p>
              )}
              {teamAccess === "signed-in" && (
                <p className="pulse-team-access-note">{t("teamSignInRequired")}</p>
              )}
              {(teamAccess === "signed-out" || teamAccess === "unconfigured") && (
                <>
                  {teamAccess === "signed-out" ? (
                    <form className="pulse-team-login" onSubmit={(event) => void signInToTeam(event)}>
                      <label htmlFor="pulse-team-password">{t("teamPassword")}</label>
                      <input
                        id="pulse-team-password"
                        type="password"
                        autoComplete="current-password"
                        value={teamPassword}
                        onChange={(event) => setTeamPassword(event.target.value)}
                        placeholder={t("teamPasswordPlaceholder")}
                        required
                      />
                      <button type="submit" disabled={!teamPassword}>
                        {t("teamSignIn")}
                      </button>
                    </form>
                  ) : (
                    <p className="pulse-team-access-note">{t("teamPasswordUnconfigured")}</p>
                  )}
                  {teamAccess === "signed-out" && (
                    <p className="pulse-team-access-note">{t("teamSignInRequired")}</p>
                  )}
                </>
              )}
              {teamAccessError && <p className="pulse-team-access-error" role="alert">{teamAccessError}</p>}
            </div>
            {savedRuns.length === 0 ? (
              <div className="pulse-comparison-empty" aria-live="polite">
                <p>{runsError ? t("sharedRunsUnavailable") : runsLoaded ? t("noSavedRuns") : t("loadingRuns")}</p>
              </div>
            ) : (
              <ol className="pulse-run-list">
                {savedRuns.slice(0, 2).map((run) => (
                  <li key={run.id} className="pulse-run">
                    <div>
                      <strong>{localize(run.crisisName)} · {run.score}/100</strong>
                      <time dateTime={run.completedAt}>
                        {new Date(run.completedAt).toLocaleString(
                          language === "hi" ? "hi-IN" : language === "kn" ? "kn-IN" : "en-IN"
                        )}
                      </time>
                    </div>
                    <span>
                      {run.requestsResolved}/{run.requestTotal} {t("resolved")} · {run.actionsTaken} {t("actions")} ·{" "}
                      {run.responseUnitsUsed} {t("responseUnits")} · {run.supplyUnitsUsed} {t("units")} · {run.sheltersOpened} {t("centres")}
                    </span>
                  </li>
                ))}
              </ol>
            )}
            {savedRuns.length >= 2 && (
              <p className="pulse-run-delta">
                {t("latestScoreDifference")} {savedRuns[0].score - savedRuns[1].score > 0 ? "+" : ""}
                {savedRuns[0].score - savedRuns[1].score} · {t("requestCompletion")}{" "}
                {(savedRuns[0].requestsResolved / Math.max(savedRuns[0].requestTotal, 1) * 100).toFixed(0)}% vs{" "}
                {(savedRuns[1].requestsResolved / Math.max(savedRuns[1].requestTotal, 1) * 100).toFixed(0)}%
              </p>
            )}
            {runsError && savedRuns.length > 0 && (
              <p className="pulse-disclaimer mt-3" role="alert">{t("sharedRunsUnavailable")}</p>
            )}
            {runsError && (
              <button
                type="button"
                className="pulse-secondary-button mt-3"
                onClick={() => {
                  setRunsLoaded(false);
                  setRunsLoadAttempt((attempt) => attempt + 1);
                }}
              >
                {t("retry")}
              </button>
            )}
            <p className="pulse-disclaimer mt-3">{t("generateReport")}</p>
          </section>

          <section className="pulse-card pulse-timeline rounded-2xl p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="pulse-section-kicker">{t("activity")}</p>
                <h2 className="pulse-card-title">{t("eventLog")}</h2>
              </div>
              <span className="pulse-event-count">{events.length} {t("entries")}</span>
            </div>
            <div className="max-h-[320px] space-y-3 overflow-auto pr-1">
              {events.map((event) => (
                <div key={event.id} className="pulse-event flex gap-3">
                  <span>{event.time}</span>
                  <p>{localizeNarrative(event.text)}</p>
                </div>
              ))}
            </div>
            <p className="pulse-sr-only" role="status" aria-live="polite" aria-atomic="true">
              {events[0] ? localizeNarrative(events[0].text) : ""}
            </p>
          </section>
        </aside>
      </div>

      {presentationStep !== null && (
        <div className="pulse-presentation-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setPresentationStep(null);
        }}>
          <section
            className="pulse-presentation"
            ref={presentationDialogRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="presentation-title"
            aria-describedby="presentation-copy"
          >
            <div className="pulse-presentation-top">
              <p className="pulse-section-kicker">{t("present")} · {presentationStep + 1}/{presentationSlides.length}</p>
              <button type="button" onClick={() => setPresentationStep(null)} aria-label={t("close")}>×</button>
            </div>
            <h2 id="presentation-title">{t("presentationTitle")}</h2>
            <p id="presentation-copy" aria-live="polite">{t(presentationSlides[presentationStep])}</p>
            <div className="pulse-presentation-progress" aria-hidden="true">
              {presentationSlides.map((slide, index) => (
                <span key={slide} className={index <= presentationStep ? "is-current" : ""} />
              ))}
            </div>
            <div className="pulse-presentation-actions">
              <button type="button" className="pulse-secondary-button" onClick={() => setPresentationStep((step) => Math.max(0, (step ?? 0) - 1))} disabled={presentationStep === 0}>
                {t("back")}
              </button>
              <button type="button" className="pulse-primary-button" onClick={() => presentationStep === presentationSlides.length - 1 ? setPresentationStep(null) : setPresentationStep(presentationStep + 1)}>
                {presentationStep === presentationSlides.length - 1 ? t("finish") : t("next")}
              </button>
            </div>
            <p className="pulse-disclaimer">{t("keyboardHelp")}</p>
          </section>
        </div>
      )}
    </main>
  );
}

function Metric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  const metricColor = accent.includes("emerald")
    ? "#6c9174"
    : accent.includes("violet")
      ? "#88739a"
      : accent.includes("amber")
        ? "#aa8053"
        : "#426f76";

  return (
    <div className="pulse-metric" style={{ "--metric-color": metricColor } as React.CSSProperties}>
      <p className="pulse-metric-label"><i aria-hidden="true" />{label}</p>
      <p className="pulse-metric-value">{value}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="pulse-info">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function ReportMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="pulse-info">
      <p className="pulse-report-label">{label}</p>
      <p className="pulse-report-value">{value}</p>
      <p className="pulse-report-detail">{detail}</p>
    </div>
  );
}

function ScoreBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div className="pulse-info">
      <div className="mb-2 flex justify-between gap-2 text-xs">
        <span className="text-slate-300">{label}</span>
        <span className="font-bold text-white">{safeValue}/100</span>
      </div>
      <div className="pulse-score-track h-2 overflow-hidden rounded-full">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  className = "",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`pulse-action px-3 py-2.5 font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}