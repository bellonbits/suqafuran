/**
 * Suqafuran Chat Fraud Guard
 * Real-time detection of high-risk scam patterns:
 * - Advance deposit / booking fee demands
 * - Transport / fare scams ("tuma fare", "send fare first")
 * - M-Pesa PIN / OTP phishing
 * - Off-platform unverified payment lures
 */

export interface FraudAlert {
  isSuspicious: boolean;
  category?: 'advance_fee' | 'fare_scam' | 'phishing' | 'off_platform';
  title?: string;
  warning?: string;
}

const ADVANCE_FEE_REGEX = /(?:send|tuma|lipa|pay|deposit)\s*(?:deposit|advance|booking|commitment|security\s*deposit|downpayment|kwanza|first)/i;
const FARE_SCAM_REGEX = /(?:fare\s*(?:ya\s*kuja|first|kwanza)|(?:send|tuma)\s*(?:fare|transport|delivery\s*fee\s*(?:first|kwanza)|boda\s*fare))/i;
const PHISHING_REGEX = /(?:mpesa\s*pin|pin\s*yako|enter\s*pin|send\s*otp|verification\s*code|your\s*password|sim\s*swap)/i;
const OFF_PLATFORM_REGEX = /(?:pay\s*(?:to\s*this\s*number|directly\s*to)|wire\s*transfer|bitcoin|crypto|usdt|western\s*union|gift\s*card)/i;

export function detectFraudRisk(text: string): FraudAlert {
  if (!text || text.trim().length === 0) {
    return { isSuspicious: false };
  }

  // 1. Phishing / PIN theft (Critical)
  if (PHISHING_REGEX.test(text)) {
    return {
      isSuspicious: true,
      category: 'phishing',
      title: 'Phishing & Account Security Risk',
      warning: 'Never share your M-Pesa PIN, OTP, or password with anyone. Suqafuran will never ask for your PIN.',
    };
  }

  // 2. Advance fee / booking deposit scam
  if (ADVANCE_FEE_REGEX.test(text)) {
    return {
      isSuspicious: true,
      category: 'advance_fee',
      title: 'Advance Deposit Scam Alert',
      warning: 'Never send advance deposits or booking fees upfront. Always inspect the item in person before making payment.',
    };
  }

  // 3. Transport fare / delivery fee upfront scam
  if (FARE_SCAM_REGEX.test(text)) {
    return {
      isSuspicious: true,
      category: 'fare_scam',
      title: 'Transport / Fare Scam Warning',
      warning: 'Do not send fare or transport money before seeing the product. Agree on a public meetup location instead.',
    };
  }

  // 4. Off-platform wire or crypto lures
  if (OFF_PLATFORM_REGEX.test(text)) {
    return {
      isSuspicious: true,
      category: 'off_platform',
      title: 'Unverified Payment Method',
      warning: 'Pay only upon in-person handover. Avoid untraceable payment channels such as gift cards or wire transfers.',
    };
  }

  return { isSuspicious: false };
}

