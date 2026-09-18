import React, { useState, useEffect } from 'react';
import { Lock, Clock, CheckCircle, ShieldCheck } from 'lucide-react';
import api from '../api/axios';
import FormattedTerms from '../components/FormattedTerms';

const FALLBACK_PRIVACY_CONTENT = `
BuildForge Technologies ("BuildForge", "we", "us") is committed to protecting your personal data and respecting your privacy. This Privacy Policy outlines how we collect, process, store, and safeguard your personal information in compliance with the Digital Personal Data Protection Act, 2023 (DPDPA), the Information Technology Act, 2000, and applicable rules.

1. PERSONAL DATA WE COLLECT

We collect only the personal information necessary to deliver our custom PC building tools, order fulfillment, and account services:
• Identity & Account Data: Name, email address, password hash, and account verification status.
• Delivery & Contact Data: Shipping addresses, billing addresses, city, state, postal code, country, and contact telephone numbers.
• Order & Transactional Data: Items ordered, prices, order status history, payment transaction IDs, shipping zones, and tax amounts.
• Platform Activity & Preferences: Custom PC build configurations (Saved Builds, Public Build Shares), product wishlists, price drop alert subscriptions, verified product reviews, and customer Q&A interactions.
• Consent & Compliance Records: Timestamps and version identifiers of legal terms and privacy policies accepted at registration.

2. SPECIFIC PURPOSES OF DATA PROCESSING

Your personal data is processed strictly for the following lawful and explicit purposes:
• User Authentication & Security: Registering and managing your user account, securing sessions via JWT access and refresh tokens, and preventing unauthorized account takeover.
• Order Processing & Fulfillment: Calculating applicable taxes, determining regional shipping fees, packing hardware orders, and coordinating parcel delivery.
• System Compatibility & Custom PC Advisory: Storing saved configurations, computing real-time hardware clearances, and providing custom bottleneck projections.
• Transactional Communications: Transmitting order confirmations, live shipping milestone updates, RMA return status alerts, and price-drop notifications.
• Customer Support & Moderation: Managing 7-day RMA returns, resolving inquiries, and moderating verified customer reviews and questions.
• Statutory Compliance: Maintaining financial records and issuing tax invoices in compliance with Indian Goods and Services Tax (GST) regulations.

3. PAYMENT CARD DATA & FINANCIAL SECURITY

BuildForge does NOT collect, process, or store your credit card numbers, debit card details, CVV, or banking passwords on our servers. All payment transactions are executed through certified, PCI-DSS Level 1 compliant payment gateways (Razorpay). During checkout, payment instruments are securely tokenized and processed directly between your browser and the payment gateway. BuildForge receives only transaction reference IDs, payment status flags, and masked identifiers for order reconciliation.

4. THIRD-PARTY DATA PROCESSORS

We share minimal personal data with trusted third-party service providers solely to the extent required for operational fulfillment:
• Payment Processors: Razorpay (for secure transaction authorization, refunds, and webhook verifications).
• Transactional Email Providers: Secure SMTP services (for delivering order receipts, verification codes, and status updates).
• Logistics & Courier Partners: Regional shipping carriers (receiving name, delivery address, and contact number for parcel delivery).
• Cloud Infrastructure & Hosting: Hosted database and cloud infrastructure providers with encrypted at-rest and in-transit protocols.
We do not sell, rent, or trade your personal data to third parties for commercial marketing or advertising purposes.

5. DATA RETENTION POLICY

We retain your personal data only for as long as necessary to fulfill the purposes for which it was collected:
• Active Account Data: Maintained for the lifespan of your account until account deactivation or deletion is requested.
• Financial & Invoicing Records: Retained for the statutory periods mandated under Indian tax, accounting, and commercial statutes (typically 7 to 8 years).
• Unsaved Session Data: Ephemeral cart and temporary checkout reservation data are purged automatically upon expiration.

6. YOUR RIGHTS UNDER THE DIGITAL PERSONAL DATA PROTECTION ACT, 2023

Under the DPDPA 2023, you have the following enforceable rights regarding your personal data:
• Right to Access: You may request a summary of the personal data we hold about you and the processing activities undertaken.
• Right to Correction & Updating: You can update inaccurate or incomplete personal data via your User Dashboard or by contacting customer support.
• Right to Erasure: You may request the deletion of your personal data when it is no longer necessary for the purpose collected or required by statutory retention laws.
• Right to Withdraw Consent: You may withdraw your consent to data processing at any time. Withdrawal does not affect the lawfulness of processing undertaken prior to withdrawal.
• Right of Grievance Redressal: You have the right to register grievances with our designated Data Protection & Grievance Officer.

7. ELECTRONIC CONSENT RECORDING

In accordance with Section 6 of the DPDPA 2023, consent is obtained through an explicit, affirmative action (such as checking the signup agreement box). We maintain tamper-evident audit records capturing the user ID, terms version number, and exact timestamp (termsAcceptedAt) at the time consent was provided.

8. GRIEVANCE OFFICER & DATA PROTECTION CONTACT

For any inquiries, requests to exercise data rights, or privacy-related grievances, please contact our designated Grievance Officer:

Name: Travis Hancock
Title: Grievance Officer & Data Protection Lead, BuildForge Technologies
Office Address: JVLR, Jogeshwari, Mumbai 400060, Maharashtra, India
Email: grievance@buildforge.in
Phone: +91 99304 60497

We will acknowledge your communication within 48 hours and resolve your inquiry within thirty (30) days from receipt.
`.trim();

export default function Privacy() {
  const [privacyData, setPrivacyData] = useState({
    version: '1.0',
    effectiveDate: '2026-08-24',
    content: FALLBACK_PRIVACY_CONTENT,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/legal/privacy')
      .then((res) => {
        if (res.data?.data?.content) {
          setPrivacyData(res.data.data);
        }
      })
      .catch((err) => {
        console.error('Failed to load privacy policy from API, using fallback:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="border-b border-gray-800 pb-8 text-center sm:text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
              <Lock className="w-3.5 h-3.5" />
              <span>DPDPA 2023 & Data Protection</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Privacy Policy
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              How BuildForge collects, uses, protects, and retains your personal information, and your statutory data rights.
            </p>
          </div>

          <div className="flex flex-col items-center sm:items-end gap-1.5 text-xs text-gray-400 bg-gray-800/50 p-4 rounded-xl border border-gray-800 shrink-0">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <CheckCircle className="w-4 h-4" />
              <span>Version {privacyData.version}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-gray-500" />
              <span>Effective: {privacyData.effectiveDate}</span>
            </div>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-gray-800/90 border border-gray-700/80 rounded-2xl p-6 sm:p-10 shadow-xl">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            </div>
          ) : (
            <FormattedTerms content={privacyData.content} isCompact={false} />
          )}
        </div>
      </div>
    </div>
  );
}
