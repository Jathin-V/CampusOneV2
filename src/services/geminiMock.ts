/**
 * CampusOne - Simulated Gemini AI Service
 * Simulates Gemini AI API calls with Promise delays, JSON stripping,
 * smart semantic classification, anti-spam duplicate detection, and technician action plans.
 */

import { ActionPlan, MaintenanceTicket, TicketCategory, TicketPriority } from '../types';

/**
 * Strips markdown code blocks like ```json ... ``` or ``` ... ```
 */
function stripMarkdownFences(raw: string): string {
  return raw
    .replace(/^```[a-zA-Z]*\n?/gm, '')
    .replace(/```$/gm, '')
    .trim();
}

/**
 * Simulates Gemini AI call to auto-categorize and prioritize a maintenance issue.
 * Returns raw JSON string simulating LLM output, then parses it.
 */
export async function simulateGeminiCategorize(
  title: string,
  description: string,
  _location: string
): Promise<{ category: TicketCategory; priority: TicketPriority; rawJson: string }> {
  // Simulate network latency for AI inference
  await new Promise(resolve => setTimeout(resolve, 950));

  const text = `${title} ${description}`.toLowerCase();

  let category: TicketCategory = 'Classroom Utilities';
  let priority: TicketPriority = 'Normal';

  // Category heuristics
  if (
    text.includes('leak') ||
    text.includes('water') ||
    text.includes('pipe') ||
    text.includes('drain') ||
    text.includes('sink') ||
    text.includes('tap') ||
    text.includes('flush') ||
    text.includes('washroom')
  ) {
    category = 'Plumbing';
  } else if (
    text.includes('spark') ||
    text.includes('short circuit') ||
    text.includes('power') ||
    text.includes('fuse') ||
    text.includes('breaker') ||
    text.includes('wire') ||
    text.includes('switchboard') ||
    text.includes('led') ||
    text.includes('light') ||
    text.includes('voltage')
  ) {
    category = 'Electrical';
  } else if (
    text.includes('wifi') ||
    text.includes('internet') ||
    text.includes('ethernet') ||
    text.includes('switch') ||
    text.includes('router') ||
    text.includes('lan') ||
    text.includes('server') ||
    text.includes('cable') ||
    text.includes('network')
  ) {
    category = 'IT';
  } else if (
    text.includes('oscilloscope') ||
    text.includes('microcontroller') ||
    text.includes('soldering') ||
    text.includes('fume') ||
    text.includes('bunsen') ||
    text.includes('multimeter') ||
    text.includes('workbench') ||
    text.includes('chemical') ||
    text.includes('apparatus')
  ) {
    category = 'Lab Utilities';
  } else if (
    text.includes('projector') ||
    text.includes('fan') ||
    text.includes('ac') ||
    text.includes('air conditioner') ||
    text.includes('desk') ||
    text.includes('podium') ||
    text.includes('whiteboard') ||
    text.includes('door')
  ) {
    category = 'Classroom Utilities';
  }

  // Priority heuristics
  if (
    text.includes('severe') ||
    text.includes('hazard') ||
    text.includes('short circuit') ||
    text.includes('spark') ||
    text.includes('smoke') ||
    text.includes('flood') ||
    text.includes('conduit') ||
    text.includes('exam') ||
    text.includes('emergency') ||
    text.includes('danger')
  ) {
    priority = 'Extreme';
  } else if (
    text.includes('broken') ||
    text.includes('leak') ||
    text.includes('flicker') ||
    text.includes('drop') ||
    text.includes('urgent') ||
    text.includes('offline') ||
    text.includes('stuck')
  ) {
    priority = 'Medium';
  } else {
    priority = 'Normal';
  }

  // Simulated raw JSON output from Gemini including possible markdown fences
  const simulatedRaw = `\`\`\`json
{
  "category": "${category}",
  "priority": "${priority}",
  "confidenceScore": 0.96,
  "reasoning": "Detected keyword tokens matching ${category} facilities with severity classification '${priority}'."
}
\`\`\``;

  // Requirement: Strips markdown fences
  const cleaned = stripMarkdownFences(simulatedRaw);
  const parsed = JSON.parse(cleaned);

  return {
    category: parsed.category as TicketCategory,
    priority: parsed.priority as TicketPriority,
    rawJson: cleaned,
  };
}

/**
 * Anti-Spam AI: Check against existing active tickets in that location.
 * If a match is found in the same location with overlapping issue semantics,
 * returns the existing ticket to increment upvotes instead of creating duplicates.
 */
export async function checkAntiSpamDuplicate(
  title: string,
  description: string,
  location: string,
  existingTickets: MaintenanceTicket[]
): Promise<MaintenanceTicket | null> {
  await new Promise(resolve => setTimeout(resolve, 400));

  const cleanLoc = location.trim().toUpperCase();
  const inputWords = `${title} ${description}`
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3);

  for (const ticket of existingTickets) {
    // Only check active tickets
    if (ticket.status === 'Resolved') continue;

    const ticketLoc = ticket.location.trim().toUpperCase();
    if (ticketLoc === cleanLoc) {
      const ticketWords = `${ticket.title} ${ticket.description}`
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 3);

      // Check common keywords
      const common = inputWords.filter(w => ticketWords.includes(w));
      // If same room and has 2+ significant keywords or identical category keywords
      if (common.length >= 2) {
        return ticket;
      }
    }
  }

  return null;
}

/**
 * Technician On-Demand Action Plan:
 * Simulates Gemini AI to generate Tools, Estimated Time, Safety Caution, and Action Steps.
 */
export async function generateTechnicianActionPlan(ticket: MaintenanceTicket): Promise<ActionPlan> {
  await new Promise(resolve => setTimeout(resolve, 1100));

  let suggestedTools: string[] = ['Standard Tool Bag', 'Digital Voltage Tester', 'Flashlight'];
  let estimatedTime = '30 - 45 mins';
  let safetyCaution = 'Ensure equipment is isolated and work area is cordoned off.';
  let actionSteps: string[] = ['Initial site inspection', 'Fault isolation', 'Component replacement and sign-off'];

  switch (ticket.category) {
    case 'Electrical':
      suggestedTools = [
        'Insulated Screwdrivers (1000V rated)',
        'Fluke True-RMS Multimeter',
        'Wire Strippers & Crimping Plier',
        'Circuit Breaker Lockout Tag',
      ];
      estimatedTime = ticket.priority === 'Extreme' ? '1.5 - 2 Hours (Urgent)' : '45 mins';
      safetyCaution =
        '⚡ HIGH VOLTAGE: Wear Class 0 dielectric rubber gloves. Always lockout/tagout (LOTO) breaker distribution panel before contacting exposed lines.';
      actionSteps = [
        'Lock out sub-distribution panel for section ' + ticket.location + '.',
        'Verify zero potential with calibrated high-impedance meter.',
        'Replace defective terminal connector or fuse block.',
        'Perform insulation resistance test (Megger) before re-energizing.',
      ];
      break;

    case 'Plumbing':
      suggestedTools = [
        'Adjustable Pipe Wrench (14")',
        'Teflon Thread Sealant Tape',
        'PVC Pipe Cutter & Solvent Cement',
        'Industrial Wet Vacuum',
      ];
      estimatedTime = '1 Hour';
      safetyCaution =
        '💧 SLIP & SHOCK HAZARD: Keep water runoff strictly clear of adjacent floor electrical conduits. Wear anti-skid rubber gumboots.';
      actionSteps = [
        'Shut off the local riser isolation stop-cock valve.',
        'Drain remaining water head into utility bucket.',
        'Cut away fractured pipe section and solvent-weld fresh schedule 40 coupling.',
        'Pressure-test union at full campus pump line pressure for 15 minutes.',
      ];
      break;

    case 'IT':
      suggestedTools = [
        'RJ45 Cat6 Crimper & Cable Tester',
        'SFP+ Fiber Optic Inspection Scope',
        'Precision Torx Set',
        'Console Cable (USB-to-RJ45)',
      ];
      estimatedTime = '35 mins';
      safetyCaution =
        '👁️ CLASS 1 LASER: Never stare directly into optical transceiver port or fiber core. Use ESD wrist grounding strap.';
      actionSteps = [
        'Connect console terminal and check transceiver optical power telemetry (DOM).',
        'Clean LC fiber ferrule tips using lint-free isopropyl alcohol wipes.',
        'Reseat replacement SFP transceiver into port.',
        'Verify CRC packet error counter resets to zero and link aggregation is stable.',
      ];
      break;

    case 'Classroom Utilities':
      suggestedTools = [
        'Fiberglass Step Ladder (8ft)',
        'Cordless Impact Driver & Drill Bits',
        'High-Speed HDMI 2.1 Test Cables',
        'Air Duster Canister',
      ];
      estimatedTime = '40 mins';
      safetyCaution: '🧗 WORKING AT HEIGHT: Secure ladder base on non-slip mat; do not overreach past side rails while handling ceiling equipment.';
      actionSteps = [
        'Set up ladder with secondary spotter in room ' + ticket.location + '.',
        'Unmount hardware bracket and clear accumulated dust filters.',
        'Inspect HDMI / DisplayPort input connectors and power supply rails.',
        'Calibrate keystone and run 1080p 60Hz test pattern for 10 minutes.',
      ];
      break;

    case 'Lab Utilities':
      suggestedTools = [
        '10X Attenuation Scope Probes',
        'Thermal Imaging Camera',
        'Soldering & Desoldering Station',
        'ESD Grounding Mat & Clips',
      ];
      estimatedTime = '50 mins';
      safetyCaution =
        '⚠️ LAB PROTOCOL: Disconnect all live circuit experiments and verify ground loop isolation before touching test probes.';
      actionSteps = [
        'Test bench socket earth-to-neutral potential (must be < 2V).',
        'Inspect internal fuse and transformer primary winding on workstation.',
        'Recalibrate instrument with standard 1kHz reference square wave.',
        'Obtain lab instructor signature verification.',
      ];
      break;
  }

  return {
    suggestedTools,
    estimatedTime,
    safetyCaution,
    actionSteps,
    generatedAt: new Date().toISOString(),
  };
}
